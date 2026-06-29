// `brightspace question-bank` — aggregate quiz questions and assignments
// across many course shells into one deduplicated, topic-organized bank.
//
// Pulls quizzes (+ questions) and assignments for every course matching
// --filter / --course-ids / --all, normalizes each question, dedupes identical
// ones across semesters, tags a topic from the quiz name, and writes Markdown +
// JSON + CSV. Read-only against Brightspace.

import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import TurndownService from 'turndown';
import { loadConfig, flagBool } from '../config.mjs';
import { openApi, enrollments, quizzes, quizQuestions, assignments } from '../api.mjs';
import { buildRepoFileIndex, fixTemplateLinks } from '../repo-links.mjs';

// Instructor overlay (committed beside this tool): scopes the single-snapshot
// flights prompts to one quarter and applies BigQuery-validated hint counts, so
// a regeneration keeps the public prompts matching the quarter-scoped private
// solutions instead of reverting to the raw Brightspace text. Keyed by exact
// question text; unmatched entries are warned about so stale keys are visible.
let FLIGHTS_OVERLAY = { scopeClause: '', questions: [] };
try {
  FLIGHTS_OVERLAY = JSON.parse(
    readFileSync(new URL('../../flights-snapshot-overlay.json', import.meta.url), 'utf8')
  );
} catch {
  /* no overlay file → flights prompts stay as fetched */
}
const OVERLAY_BY_TEXT = new Map(FLIGHTS_OVERLAY.questions.map((q) => [q.match, q]));
const overlayMatched = new Set();
function applyFlightsOverlay(text) {
  const e = OVERLAY_BY_TEXT.get(text);
  if (!e) return text;
  overlayMatched.add(e.match);
  const fixed = e.hintFrom ? text.replace(e.hintFrom, e.hintTo) : text;
  return fixed + FLIGHTS_OVERLAY.scopeClause;
}

const td = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' });

export async function run(flags) {
  if (flags.help) {
    console.log(`brightspace question-bank [--filter <substr> | --course-ids a,b,c | --all]
       [--out <dir>] [--insecure]

Aggregates quiz questions and assignments across all matching course shells into
a deduplicated, topic-organized bank under <out> (default: question-bank/).`);
    return;
  }

  const config = loadConfig(flags);
  const outDir = flags.out ? resolve(config.repoRoot, flags.out) : resolve(config.repoRoot, 'question-bank');
  const ctx = await openApi(config);
  try {
    const courses = await resolveCourses(ctx, flags);
    if (!courses.length) throw new Error('No courses matched. Use --filter, --course-ids, or --all.');
    console.log(`Building question bank from ${courses.length} course(s)...`);
    const tplIndex = buildRepoFileIndex(config.repoRoot);

    const qOccur = [];
    const aOccur = [];
    for (const c of courses) {
      const term = termInfo(c.code);
      // Let auth/API failures propagate — folding them into empty lists would
      // silently commit a corrupted bank (Codex review).
      const qs = await quizzes(ctx, c.id);
      const fetched = await Promise.all(
        qs.map((q) => quizQuestions(ctx, c.id, q.QuizId).then((list) => ({ q, list })))
      );
      let nq = 0;
      for (const { q, list } of fetched) {
        const topic = topicFor(q.Name);
        for (const qq of list) {
          const text = fixTemplateLinks(applyFlightsOverlay(redactSecrets(scrubAnswerKey(plain(qq.QuestionText)))), tplIndex);
          if (!text) continue;
          nq++;
          qOccur.push({ key: normKey(text), text, type: qType(qq.QuestionTypeId), topic, course: c, term, quiz: q.Name });
        }
      }
      const asg = await assignments(ctx, c.id);
      for (const f of asg) {
        const text = fixTemplateLinks(redactSecrets(scrubAnswerKey(plain(f.CustomInstructions))), tplIndex);
        // Skip onboarding/setup assignments: they carry DB connection details
        // (host + shared `student` login), not practice material, so they don't
        // belong in the public bank (and trip secret scanners).
        if (/\bset\s?up\b/i.test(f.Name) || /db\.ipeirotis\.org/i.test(text)) continue;
        aOccur.push({ key: normKey(f.Name + ' :: ' + text), title: f.Name, text, topic: topicFor(f.Name), course: c, term });
      }
      console.log(
        `  ${term.short.padEnd(5)} ${String(c.id).padEnd(7)} ${c.name.slice(0, 42).padEnd(42)} quizzes:${qs.length} q:${nq} assign:${asg.length}`
      );
    }

    const uniqueQ = groupBy(qOccur);
    const uniqueA = groupBy(aOccur);

    // Only count shells that actually contributed material, so the advertised
    // coverage (count + term span) doesn't claim a term an empty shell added
    // nothing to (e.g. a not-yet-populated future-semester shell).
    const contributed = new Set([...qOccur, ...aOccur].map((o) => String(o.course.id)));
    const sourceCourses = courses.filter((c) => contributed.has(String(c.id)));

    mkdirSync(outDir, { recursive: true });
    const stats = {
      courses: sourceCourses.length,
      quizOccurrences: qOccur.length,
      uniqueQuestions: uniqueQ.length,
      assignmentOccurrences: aOccur.length,
      uniqueAssignments: uniqueA.length,
    };
    for (const e of FLIGHTS_OVERLAY.questions) {
      if (!overlayMatched.has(e.match)) {
        console.warn(`  ⚠ flights overlay entry matched no question (text changed?): "${e.match.slice(0, 60)}…"`);
      }
    }
    writeFileSync(resolve(outDir, 'by-topic.md'), renderByTopic(uniqueQ, uniqueA, sourceCourses, stats));
    writeFileSync(resolve(outDir, 'courses.md'), renderCourses(sourceCourses, qOccur, aOccur));
    writeFileSync(resolve(outDir, 'bank.json'), JSON.stringify({ stats, questions: uniqueQ.map(toJson), assignments: uniqueA.map(toJson) }, null, 2) + '\n');
    writeFileSync(resolve(outDir, 'bank.csv'), renderCsv(uniqueQ, uniqueA));
    writeFileSync(resolve(outDir, 'README.md'), renderReadme(stats, sourceCourses));

    console.log(
      `\nDone: ${stats.uniqueQuestions} unique questions (from ${stats.quizOccurrences} occurrences), ` +
        `${stats.uniqueAssignments} unique assignments. Wrote to ${outDir}`
    );
  } finally {
    await ctx.dispose();
  }
}

// --- course resolution ------------------------------------------------------

async function resolveCourses(ctx, flags) {
  if (flags['course-ids']) {
    // Dedupe so a repeated id (e.g. `--course-ids 578630,578630`) isn't fetched
    // twice and doesn't inflate occurrence/coverage counts.
    const ids = [...new Set(String(flags['course-ids']).split(',').map((s) => s.trim()).filter(Boolean))];
    // The caller named the shells; enrollments is only a nicety for names/codes
    // here, so don't let a restricted or failing MyEnrollments route block the
    // explicit-ID fetch — fall back to bare ids.
    let byId = new Map();
    try {
      const all = await enrollments(ctx);
      byId = new Map(all.map((it) => [String(it.OrgUnit.Id), { id: it.OrgUnit.Id, name: it.OrgUnit.Name, code: it.OrgUnit.Code || '' }]));
    } catch {
      /* explicit IDs don't require enrollments */
    }
    return ids.map((id) => byId.get(String(id)) || { id, name: `course ${id}`, code: '' });
  }
  const all = await enrollments(ctx);
  const rows = all.map((it) => ({ id: it.OrgUnit.Id, name: it.OrgUnit.Name, code: it.OrgUnit.Code || '' }));
  if (flags.filter) {
    const f = String(flags.filter).toLowerCase();
    return rows.filter((r) => `${r.name} ${r.code}`.toLowerCase().includes(f));
  }
  if (flagBool(flags.all)) return rows;
  throw new Error('Specify --filter <substr>, --course-ids a,b,c, or --all.');
}

// --- normalization / classification -----------------------------------------

function plain(rt) {
  if (!rt) return '';
  let s = rt.Html ? safeTurndown(rt.Html) : String(rt.Text || '');
  return s.replace(/ /g, ' ').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}
function safeTurndown(html) {
  try {
    return td.turndown(html);
  } catch {
    return String(html).replace(/<[^>]+>/g, ' ');
  }
}
// Strip an embedded answer key (an expected-result table) from a question stem
// so the public bank stays "questions only" (see CLAUDE.md). Only triggers when
// a "the results/answer are|is|will be" preamble is followed by result data
// (>=2 standalone numbers, or a high-precision decimal), so ordinary row-count
// hints ("Hint: 52 rows") and spec text ("... should be null") are left intact.
// Hand-curated hints may need re-adding after a regeneration.
function scrubAnswerKey(text) {
  const s = String(text || '');
  // Find an answer/hint preamble — "(the )(correct )results/answer
  // are|is|will be|start with". Without one, leave quoted literals alone: a
  // legitimate prompt may quote CSV-like INPUT data such as "Alice, 100".
  const m = s.match(/(?:Hint:?\s*)?(?:the\s+)?(?:correct\s+)?(?:results?|answer)(?:\s+of\s+the\s+query)?\s+(?:are|is|will\s+be|starts?\s+with|begins?\s+with)\b/i);
  if (!m) return s;
  const head = s.slice(0, m.index);
  const tail = s.slice(m.index);
  // Trailing result table (numbers on their own lines / high-precision decimals)
  // → drop the whole answer block.
  const numlines = (tail.match(/^\s*\$?\d[\d,.]*\s*$/gm) || []).length;
  if (numlines >= 2 || /\d+\.\d{3,}/.test(tail)) return head.trim();
  // Otherwise redact inline answer-value examples, but ONLY within the hint tail.
  return head + tail.replace(/"[A-Z][A-Za-z .'’-]*,\s?\$?\d[\d,]*"/g, '"…"');
}

// Strip secrets that appear in course content so the public bank stays clean:
// live group-chat invite links and the shared practice-DB password from the
// setup assignments. Students get both via Brightspace. (See CLAUDE.md.)
const INVITE_HOSTS = 'chat\\.whatsapp\\.com|wa\\.me|t\\.me|discord\\.gg|signal\\.group';
const REDACTED_PW = '[redacted — connect per the instructions on Brightspace]';
function redactSecrets(text) {
  return String(text || '')
    .replace(new RegExp(`\\[[^\\]]*\\]\\(https?:\\/\\/[^)]*?(?:${INVITE_HOSTS})[^)]*\\)`, 'gi'), '_(invite link redacted — public repo)_')
    .replace(new RegExp(`https?:\\/\\/[^\\s)]*(?:${INVITE_HOSTS})[^\\s)]*`, 'gi'), '_(invite link redacted — public repo)_')
    .replace(/dwdstudent\d{4}/gi, REDACTED_PW)
    .replace(/(password,?\s+enter\s+")[^"]{1,40}(")/gi, `$1${REDACTED_PW}$2`);
}

// Dedup key: collapse whitespace, undo markdown escaping/link punctuation, drop
// markdown punctuation, lowercase. Turndown escapes vary between shells (one may
// emit `\[available]\]` where another emits `[available]`), so without
// normalizing escapes the same assignment would key differently and inflate the
// unique count. Collapse `[text](url)` to `text` for the same reason.
function normKey(s) {
  return String(s)
    .replace(/\\([^A-Za-z0-9\s])/g, '$1') // undo Turndown backslash-escapes (\[ \] \. \( ...)
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // [text](url) -> text
    .replace(/[`*_>#~[\]()]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s+([.,;:!?])/g, '$1') // drop space before punctuation (an escaping artifact)
    .trim()
    .toLowerCase()
    .replace(/[.,;:!?]+$/, '');
}

const SEASON = { SP: ['Spring', 2], SU: ['Summer', 3], FA: ['Fall', 4], WI: ['Winter', 1], JA: ['January', 1] };
function termInfo(code) {
  const m = String(code).match(/^(SP|SU|FA|WI|JA)(\d{2})/);
  if (m) {
    const [, s, yy] = m;
    const [name, ord] = SEASON[s];
    const year = 2000 + parseInt(yy, 10);
    return { label: `${name} ${year}`, key: year * 10 + ord, short: `${s}${yy}` };
  }
  const y = String(code).match(/20(\d{2})/);
  if (y) return { label: `~20${y[1]}`, key: parseInt('20' + y[1], 10) * 10, short: '20' + y[1] };
  return { label: 'unknown term', key: 0, short: '?' };
}

const TOPICS = [
  ['Final exam', /final\s*exam/i],
  ['Midterm', /midterm/i],
  ['ER & schemas', /\b(er|entity|diagram|schema|relational\s*(model|schema)|modell?ing)\b/i],
  ['Setup & basics', /\b(setup|navigation|understanding a database|getting started|intro)/i],
  ['Window functions', /\bwindow/i],
  ['Subqueries', /\bsub\s*quer/i],
  ['Aggregations', /\b(aggregat|group\s*by)/i],
  ['Joins', /\bjoin/i],
  ['Filtering', /\bfilter/i],
  ['Selection', /\bselect/i],
];
function topicFor(name) {
  for (const [t, re] of TOPICS) if (re.test(name || '')) return t;
  return 'General / other';
}
const TOPIC_ORDER = [
  'Setup & basics', 'ER & schemas', 'Selection', 'Filtering', 'Joins', 'Aggregations',
  'Subqueries', 'Window functions', 'General / other', 'Midterm', 'Final exam',
];

// D2L QUESTION_T enum (https://docs.valence.desire2learn.com/res/quiz.html).
const QTYPES = { 1: 'Multiple Choice', 2: 'True/False', 3: 'Fill in the Blank', 4: 'Multi-Select', 5: 'Matching', 6: 'Ordering', 7: 'Long Answer', 8: 'Short Answer', 9: 'Likert', 10: 'Image', 11: 'Text', 12: 'Arithmetic', 13: 'Significant Figures', 14: 'Multi-Short Answer' };
function qType(id) {
  return QTYPES[id] || `Type ${id}`;
}

// --- aggregation ------------------------------------------------------------

function groupBy(occurs) {
  const m = new Map();
  for (const o of occurs) {
    if (!m.has(o.key)) m.set(o.key, { text: o.text, title: o.title, type: o.type, topics: {}, occ: [] });
    const g = m.get(o.key);
    g.occ.push(o);
    g.topics[o.topic] = (g.topics[o.topic] || 0) + 1;
  }
  return [...m.values()]
    .map((g) => ({ ...g, topic: Object.entries(g.topics).sort((a, b) => b[1] - a[1])[0][0], count: g.occ.length }))
    .sort((a, b) => b.count - a.count);
}

function occLabels(occ) {
  const seen = new Set();
  return occ
    .map((o) => ({ key: o.term.key, label: `${o.term.label} · ${o.quiz || o.title || ''}`.trim() }))
    .filter((x) => (seen.has(x.label) ? false : seen.add(x.label)))
    .sort((a, b) => a.key - b.key)
    .map((x) => x.label);
}

function toJson(g) {
  return { topic: g.topic, type: g.type, title: g.title, text: g.text, occurrences: g.count, usedIn: occLabels(g.occ) };
}

// --- rendering --------------------------------------------------------------

function topicSections(items) {
  const m = {};
  for (const it of items) (m[it.topic] = m[it.topic] || []).push(it);
  const ordered = [...TOPIC_ORDER.filter((t) => m[t]), ...Object.keys(m).filter((t) => !TOPIC_ORDER.includes(t))];
  return ordered.map((t) => [t, m[t]]);
}

function renderByTopic(uniqueQ, uniqueA, courses, stats) {
  const span = termSpan(courses);
  let out = `# Databases — Question Bank\n\n`;
  out += `Aggregated from **${stats.courses} course shells** (${span}). `;
  out += `**${stats.uniqueQuestions} unique quiz questions** (from ${stats.quizOccurrences} occurrences) and `;
  out += `**${stats.uniqueAssignments} unique assignments**, organized by topic. `;
  out += `Each item lists every semester/quiz it appears in. See \`courses.md\` for provenance, \`bank.csv\` for a spreadsheet view.\n`;

  out += `\n## Quiz questions by topic\n`;
  for (const [topic, items] of topicSections(uniqueQ)) {
    out += `\n### ${topic} — ${items.length} unique\n`;
    items.forEach((g, i) => {
      out += `\n**${i + 1}.** _(${g.count}× · ${g.type})_\n\n`;
      out += indentBlock(g.text) + '\n\n';
      out += `<sub>Used in: ${occLabels(g.occ).join(' · ')}</sub>\n`;
    });
  }

  out += `\n## Assignments by topic\n`;
  for (const [topic, items] of topicSections(uniqueA)) {
    out += `\n### ${topic} — ${items.length} unique\n`;
    items.forEach((g) => {
      out += `\n**${g.title || '(untitled)'}** _(${g.count}×)_\n\n`;
      out += (g.text ? indentBlock(g.text) + '\n\n' : '');
      out += `<sub>Used in: ${occLabels(g.occ).join(' · ')}</sub>\n`;
    });
  }
  return out + '\n';
}

// Indent a (possibly multi-line) block as a Markdown blockquote for readability.
function indentBlock(text) {
  return String(text)
    .split('\n')
    .map((l) => `> ${l}`)
    .join('\n');
}

function renderCourses(courses, qOccur, aOccur) {
  const byCourse = (occ, id) => occ.filter((o) => String(o.course.id) === String(id)).length;
  let out = `# Source courses\n\n${courses.length} shells fed the bank:\n\n`;
  out += `| id | term | course | quiz Qs | assignments |\n|---|---|---|---|---|\n`;
  for (const c of courses.slice().sort((a, b) => termInfo(b.code).key - termInfo(a.code).key)) {
    out += `| ${c.id} | ${termInfo(c.code).label} | ${c.name.replace(/\|/g, '\\|')} | ${byCourse(qOccur, c.id)} | ${byCourse(aOccur, c.id)} |\n`;
  }
  return out + '\n';
}

function renderCsv(uniqueQ, uniqueA) {
  const esc = (v) => {
    v = String(v == null ? '' : v);
    return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
  };
  const rows = [['kind', 'topic', 'type', 'occurrences', 'terms', 'text']];
  for (const g of uniqueQ) rows.push(['question', g.topic, g.type, g.count, occLabels(g.occ).join(' | '), g.text]);
  for (const g of uniqueA) rows.push(['assignment', g.topic, '', g.count, occLabels(g.occ).join(' | '), `${g.title}: ${g.text}`]);
  return rows.map((r) => r.map(esc).join(',')).join('\n') + '\n';
}

function termSpan(courses) {
  const keys = courses.map((c) => termInfo(c.code)).filter((t) => t.key).sort((a, b) => a.key - b.key);
  return keys.length ? `${keys[0].label} – ${keys[keys.length - 1].label}` : 'various terms';
}

function renderReadme(stats, courses) {
  return (
    `# Databases — Question Bank\n\n` +
    `Cross-semester bank of quiz questions and assignments, aggregated from ${stats.courses} ` +
    `Brightspace shells (${termSpan(courses)}) with \`brightspace question-bank\`.\n\n` +
    `- **\`by-topic.md\`** — every unique question and assignment, grouped by topic, with the semesters each appears in.\n` +
    `- **\`bank.csv\`** — flat table for spreadsheets (sort/filter by topic, term, frequency).\n` +
    `- **\`bank.json\`** — structured data for further tooling.\n` +
    `- **\`courses.md\`** — the source shells and per-course counts.\n\n` +
    `Stats: ${stats.uniqueQuestions} unique questions (from ${stats.quizOccurrences} occurrences across semesters), ` +
    `${stats.uniqueAssignments} unique assignments.\n\n` +
    `## Answers\n\n` +
    `This is a public repo, so it carries the **questions only**. Solution SQL, ` +
    `BigQuery-validated row counts, and the needs-review list live in the private ` +
    `companion repo — **<https://github.com/ipeirotis/introduction-to-databases-private>** ` +
    `— under \`question-bank/solutions/\`, \`question-bank/bank-validated.json\`, and ` +
    `\`question-bank/FLAGGED.md\`.\n\n` +
    `Regenerate: \`npm run brightspace -- question-bank --filter databases\` (from \`tools/brightspace\`).\n`
  );
}
