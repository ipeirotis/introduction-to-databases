// `brightspace question-bank` — aggregate quiz questions and assignments
// across many course shells into one deduplicated, topic-organized bank.
//
// Pulls quizzes (+ questions) and assignments for every course matching
// --filter / --course-ids / --all, normalizes each question, dedupes identical
// ones across semesters, tags a topic from the quiz name, and writes Markdown +
// JSON + CSV. Read-only against Brightspace.

import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import TurndownService from 'turndown';
import { loadConfig } from '../config.mjs';
import { openApi, enrollments, quizzes, quizQuestions, assignments } from '../api.mjs';

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
          const text = plain(qq.QuestionText);
          if (!text) continue;
          nq++;
          qOccur.push({ key: normKey(text), text, type: qType(qq.QuestionTypeId), topic, course: c, term, quiz: q.Name });
        }
      }
      const asg = await assignments(ctx, c.id);
      for (const f of asg) {
        const text = plain(f.CustomInstructions);
        aOccur.push({ key: normKey(f.Name + ' :: ' + text), title: f.Name, text, topic: topicFor(f.Name), course: c, term });
      }
      console.log(
        `  ${term.short.padEnd(5)} ${String(c.id).padEnd(7)} ${c.name.slice(0, 42).padEnd(42)} quizzes:${qs.length} q:${nq} assign:${asg.length}`
      );
    }

    const uniqueQ = groupBy(qOccur);
    const uniqueA = groupBy(aOccur);

    mkdirSync(outDir, { recursive: true });
    const stats = {
      courses: courses.length,
      quizOccurrences: qOccur.length,
      uniqueQuestions: uniqueQ.length,
      assignmentOccurrences: aOccur.length,
      uniqueAssignments: uniqueA.length,
    };
    writeFileSync(resolve(outDir, 'by-topic.md'), renderByTopic(uniqueQ, uniqueA, courses, stats));
    writeFileSync(resolve(outDir, 'courses.md'), renderCourses(courses, qOccur, aOccur));
    writeFileSync(resolve(outDir, 'bank.json'), JSON.stringify({ stats, questions: uniqueQ.map(toJson), assignments: uniqueA.map(toJson) }, null, 2) + '\n');
    writeFileSync(resolve(outDir, 'bank.csv'), renderCsv(uniqueQ, uniqueA));
    writeFileSync(resolve(outDir, 'README.md'), renderReadme(stats, courses));

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
  const all = await enrollments(ctx);
  const rows = all.map((it) => ({ id: it.OrgUnit.Id, name: it.OrgUnit.Name, code: it.OrgUnit.Code || '' }));
  if (flags['course-ids']) {
    const ids = String(flags['course-ids']).split(',').map((s) => s.trim()).filter(Boolean);
    const byId = new Map(rows.map((r) => [String(r.id), r]));
    return ids.map((id) => byId.get(String(id)) || { id, name: `course ${id}`, code: '' });
  }
  if (flags.filter) {
    const f = String(flags.filter).toLowerCase();
    return rows.filter((r) => `${r.name} ${r.code}`.toLowerCase().includes(f));
  }
  if (flags.all) return rows;
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
// Dedup key: collapse whitespace, drop markdown punctuation, lowercase.
function normKey(s) {
  return String(s).replace(/\s+/g, ' ').replace(/[`*_>#~]/g, '').trim().toLowerCase().replace(/[.,;:!?]+$/, '');
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
      out += `\n**${g.title || '(untitled)'}** _(${g.count}×)_ — used in: ${occLabels(g.occ).join(' · ')}\n`;
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
    `Regenerate: \`npm run brightspace -- question-bank --filter databases\` (from \`tools/brightspace\`).\n`
  );
}
