// `brightspace download` — export a course shell's content into the repo.
//
// Pulls assignments, quizzes (with questions), content topics (files +
// external links), and announcements via the D2L API and writes them as
// readable Markdown (HTML converted with Turndown), with content files saved
// in their native format. Read-only against Brightspace.
//
// NOTE: if the repo is public, review before committing — quiz questions in
// particular are live assessment material.

import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { resolve, basename } from 'node:path';
import TurndownService from 'turndown';
import { loadConfig } from '../config.mjs';
import {
  openApi,
  courseInfo,
  assignments,
  quizzes,
  quizQuestions,
  contentToc,
  news,
  topicFile,
  AuthExpiredError,
} from '../api.mjs';

const td = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' });

const DEFAULT_KINDS = 'assignments,quizzes,content,announcements';

export async function run(flags) {
  if (flags.help) {
    console.log(`brightspace download [--offering <path>] [--insecure]
       [--kinds assignments,quizzes,content,announcements]
       [--out <dir>]

Exports the configured course's content into <out> (default:
<offering>/brightspace/) as Markdown plus native content files. Read-only.`);
    return;
  }

  const config = loadConfig(flags);
  const ou = config.brightspace.courseId;
  if (!ou) {
    throw new Error(
      `brightspace.course_id is not set in ${config.offeringRel}/offering.yaml. ` +
        `Run "brightspace courses" to find it, or pass --course-id <id>.`
    );
  }

  const kinds = (flags.kinds || DEFAULT_KINDS)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const outDir = flags.out
    ? resolve(config.repoRoot, flags.out)
    : resolve(config.offeringDir, 'brightspace');
  mkdirSync(outDir, { recursive: true });

  const ctx = await openApi(config);
  try {
    let course = { Name: config.brightspace.label, Code: '' };
    try {
      course = await courseInfo(ctx, ou);
    } catch (err) {
      if (err instanceof AuthExpiredError) throw err;
    }
    console.log(`Exporting ${course.Name} (${ou}) -> ${outDir}`);

    const manifest = {
      course: { id: ou, name: course.Name, code: course.Code },
      offering: config.offeringRel,
      kinds: {},
    };

    const runners = {
      assignments: dlAssignments,
      quizzes: dlQuizzes,
      content: dlContent,
      announcements: dlAnnouncements,
    };
    const base = config.brightspace.baseUrl;
    for (const kind of kinds) {
      const runner = runners[kind];
      if (!runner) {
        console.warn(`Skipping unknown kind: ${kind}`);
        continue;
      }
      // Clear any prior export of this kind so renamed/deleted items don't linger.
      rmSync(resolve(outDir, kind), { recursive: true, force: true });
      manifest.kinds[kind] = await runner(ctx, ou, outDir, base);
      const k = manifest.kinds[kind];
      console.log(`  ${kind}: ${summaryLine(kind, k)}`);
    }

    writeFileSync(resolve(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
    writeFileSync(resolve(outDir, 'README.md'), renderIndex(manifest));
    console.log(`Wrote manifest.json and README.md to ${outDir}`);
  } finally {
    await ctx.dispose();
  }
}

// --- helpers ----------------------------------------------------------------

function slug(s) {
  return (
    String(s || '')
      .normalize('NFKD')
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .toLowerCase()
      .slice(0, 80) || 'untitled'
  );
}

// D2L RichText is { Text, Html }. Prefer converting the HTML; fall back to Text.
function richToMd(rt) {
  if (!rt) return '';
  if (rt.Html) {
    try {
      return td.turndown(rt.Html).trim();
    } catch {
      /* fall through to Text */
    }
  }
  return String(rt.Text || '').trim();
}

// Root-relative D2L URLs (e.g. quicklinks "/d2l/...") only resolve on the live
// Brightspace host, so qualify them with the base URL for the exported Markdown.
function absUrl(url, base) {
  return url && /^\/(?!\/)/.test(url) ? base + url : url;
}

function metaList(obj) {
  return Object.entries(obj)
    .filter(([, v]) => v != null && v !== '')
    .map(([k, v]) => `- **${k}:** ${v}`)
    .join('\n');
}

function summaryLine(kind, k) {
  if (kind === 'content') {
    return `${k.modules} modules, ${k.topics} topics (${k.files} files, ${k.links} links)`;
  }
  return `${k.count} item(s)`;
}

// --- per-kind exporters -----------------------------------------------------

async function dlAssignments(ctx, ou, outDir) {
  const dir = resolve(outDir, 'assignments');
  mkdirSync(dir, { recursive: true });
  const folders = await assignments(ctx, ou);
  const items = [];
  for (const f of folders) {
    const file = `assignments/${f.Id}-${slug(f.Name)}.md`;
    const md =
      `# ${f.Name}\n\n` +
      metaList({ 'Brightspace id': f.Id, Due: f.DueDate, Hidden: f.IsHidden }) +
      `\n\n## Instructions\n\n${richToMd(f.CustomInstructions) || '_(no instructions)_'}\n`;
    writeFileSync(resolve(outDir, file), md);
    items.push({ id: f.Id, title: f.Name, dueDate: f.DueDate || null, file });
  }
  return { count: items.length, items };
}

async function dlQuizzes(ctx, ou, outDir) {
  const dir = resolve(outDir, 'quizzes');
  mkdirSync(dir, { recursive: true });
  const list = await quizzes(ctx, ou);
  const items = [];
  for (const q of list) {
    // Let fetch failures propagate rather than committing a "0 questions" quiz.
    const questions = await quizQuestions(ctx, ou, q.QuizId);
    const qmd = questions
      .map((qq, i) => `### Q${i + 1}${qq.Name ? ` — ${qq.Name}` : ''}\n\n${richToMd(qq.QuestionText) || '_(no text)_'}`)
      .join('\n\n');
    // Quiz Description is { Text: <RichText>, IsDisplayed }, so unwrap one level.
    const descMd = q.Description ? richToMd(q.Description.Text) : '';
    const file = `quizzes/${q.QuizId}-${slug(q.Name)}.md`;
    const md =
      `# ${q.Name}\n\n` +
      metaList({
        'Brightspace id': q.QuizId,
        Start: q.StartDate,
        Due: q.DueDate,
        End: q.EndDate,
        Active: q.IsActive,
        Attempts: q.AttemptsAllowed && q.AttemptsAllowed.NumberOfAttemptsAllowed,
        Questions: questions.length,
      }) +
      '\n\n' +
      (descMd ? `## Description\n\n${descMd}\n\n` : '') +
      `## Questions (${questions.length})\n\n${qmd || '_(no questions retrieved)_'}\n`;
    writeFileSync(resolve(outDir, file), md);
    items.push({ id: q.QuizId, title: q.Name, dueDate: q.DueDate || null, questions: questions.length, file });
  }
  return { count: items.length, items };
}

async function dlAnnouncements(ctx, ou, outDir) {
  const dir = resolve(outDir, 'announcements');
  mkdirSync(dir, { recursive: true });
  const list = await news(ctx, ou);
  const items = [];
  for (const n of list) {
    const date = String(n.StartDate || n.CreatedDate || '').slice(0, 10) || 'undated';
    const file = `announcements/${date}-${n.Id}-${slug(n.Title)}.md`;
    const md =
      `# ${n.Title}\n\n` +
      metaList({ 'Brightspace id': n.Id, Posted: n.StartDate || n.CreatedDate, Hidden: n.IsHidden }) +
      `\n\n${richToMd(n.Body) || '_(no body)_'}\n`;
    writeFileSync(resolve(outDir, file), md);
    items.push({ id: n.Id, title: n.Title, posted: n.StartDate || n.CreatedDate || null, file });
  }
  return { count: items.length, items };
}

async function dlContent(ctx, ou, outDir, base) {
  const dir = resolve(outDir, 'content');
  const filesDir = resolve(dir, 'files');
  mkdirSync(filesDir, { recursive: true });

  const toc = await contentToc(ctx, ou);
  const lines = [];
  const links = [];
  const counts = { modules: 0, topics: 0, files: 0, links: 0 };

  const walk = async (m, depth) => {
    for (const sub of m.Modules || []) {
      counts.modules++;
      lines.push(`${'  '.repeat(depth)}- **${sub.Title}**`);
      for (const t of sub.Topics || []) {
        counts.topics++;
        const indent = '  '.repeat(depth + 1);
        if (/file/i.test(t.TypeIdentifier || '')) {
          try {
            const { body } = await topicFile(ctx, ou, t.TopicId);
            const fname = `${t.TopicId}-${basename(t.Url || slug(t.Title))}`.replace(/[^\w.\-]/g, '_');
            writeFileSync(resolve(filesDir, fname), body);
            counts.files++;
            lines.push(`${indent}- ${t.Title} → [files/${fname}](files/${fname})`);
          } catch (err) {
            lines.push(`${indent}- ${t.Title} _(file download failed: ${err.message})_`);
          }
        } else if (/link/i.test(t.TypeIdentifier || '')) {
          counts.links++;
          const url = absUrl(t.Url, base);
          links.push({ title: t.Title, url });
          lines.push(`${indent}- ${t.Title} → ${url}`);
        } else {
          lines.push(`${indent}- ${t.Title} _(${t.TypeIdentifier})_`);
        }
      }
      await walk(sub, depth + 1);
    }
  };
  await walk(toc || {}, 0);

  writeFileSync(resolve(dir, 'toc.md'), `# Content\n\n${lines.join('\n')}\n`);
  writeFileSync(
    resolve(dir, 'links.md'),
    `# External links\n\n${links.map((l) => `- [${l.title}](${l.url})`).join('\n')}\n`
  );
  return counts;
}

// --- index ------------------------------------------------------------------

function renderIndex(m) {
  const k = m.kinds;
  const line = (label, n) => `- **${label}:** ${n}`;
  return (
    `# ${m.course.name}\n\n` +
    `Brightspace export for \`${m.offering}\` (course id ${m.course.id}` +
    `${m.course.code ? `, ${m.course.code}` : ''}).\n\n` +
    `## Contents\n\n` +
    (k.assignments ? line('Assignments', `${k.assignments.count} → \`assignments/\``) + '\n' : '') +
    (k.quizzes ? line('Quizzes', `${k.quizzes.count} → \`quizzes/\``) + '\n' : '') +
    (k.content
      ? line('Content', `${k.content.modules} modules / ${k.content.topics} topics → \`content/\``) + '\n'
      : '') +
    (k.announcements ? line('Announcements', `${k.announcements.count} → \`announcements/\``) + '\n' : '') +
    `\nSee \`manifest.json\` for the full machine-readable index.\n`
  );
}
