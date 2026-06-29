// `brightspace download` — export a course shell's content into the repo.
//
// Pulls assignments, quizzes (with questions), content topics (files +
// external links), and announcements via the D2L API and writes them as
// readable Markdown (HTML converted with Turndown), with content files saved
// in their native format. Read-only against Brightspace.
//
// NOTE: if the repo is public, review before committing — quiz questions in
// particular are live assessment material.

import { mkdirSync, writeFileSync, readFileSync, rmSync, existsSync, renameSync } from 'node:fs';
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

    // Seed from any existing manifest so a `--kinds` subset refresh preserves
    // the index entries for kinds it doesn't touch (their directories stay too).
    let priorKinds = {};
    const manifestPath = resolve(outDir, 'manifest.json');
    if (existsSync(manifestPath)) {
      try {
        priorKinds = JSON.parse(readFileSync(manifestPath, 'utf8')).kinds || {};
      } catch {
        /* ignore an unreadable prior manifest */
      }
    }
    const manifest = {
      course: { id: ou, name: course.Name, code: course.Code },
      offering: config.offeringRel,
      kinds: { ...priorKinds },
    };

    const runners = {
      assignments: dlAssignments,
      quizzes: dlQuizzes,
      content: dlContent,
      announcements: dlAnnouncements,
    };
    const base = config.brightspace.baseUrl;
    const unknown = kinds.filter((k) => !runners[k]);
    if (unknown.length) {
      throw new Error(`Unknown --kinds: ${unknown.join(', ')}. Valid: ${Object.keys(runners).join(', ')}`);
    }
    // Regenerate each kind atomically: stash the prior export, write a fresh
    // copy, and restore the stash if any fetch/render fails — so a transient API
    // error can't replace a complete export with a partial one. Only the
    // requested kinds are touched, so a `--kinds` subset leaves the rest intact.
    const stashed = [];
    try {
      for (const kind of kinds) {
        const runner = runners[kind];
        const kdir = resolve(outDir, kind);
        const bak = resolve(outDir, `.${kind}.bak`);
        rmSync(bak, { recursive: true, force: true });
        if (existsSync(kdir)) {
          renameSync(kdir, bak);
          stashed.push([kdir, bak]);
        }
        manifest.kinds[kind] = await runner(ctx, ou, outDir, base);
        console.log(`  ${kind}: ${summaryLine(kind, manifest.kinds[kind])}`);
      }
      writeFileSync(resolve(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
      writeFileSync(resolve(outDir, 'README.md'), renderIndex(manifest));
      console.log(`Wrote manifest.json and README.md to ${outDir}`);
      for (const [, bak] of stashed) rmSync(bak, { recursive: true, force: true });
    } catch (err) {
      // Roll back to the previously complete export.
      for (const [kdir, bak] of stashed) {
        rmSync(kdir, { recursive: true, force: true });
        if (existsSync(bak)) renameSync(bak, kdir);
      }
      throw err;
    }
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
// RichText bodies can embed D2L quicklinks as root-relative hrefs (`/d2l/...`)
// that only resolve on the Brightspace host, so qualify them with the base URL
// (same rule as absUrl, but applied to the links inside the rendered Markdown).
function richToMd(rt, base) {
  if (!rt) return '';
  let md = null;
  if (rt.Html) {
    try {
      md = td.turndown(rt.Html).trim();
    } catch {
      /* fall through to Text */
    }
  }
  if (md == null) md = String(rt.Text || '').trim();
  if (base) md = md.replace(/(\]\()\/(?!\/)([^)]*\))/g, `$1${base}/$2`);
  return redactSecrets(md);
}

// This export lives in a public repo, so strip two kinds of secrets that show up
// in course content: (1) live group-chat invite links (anyone could join the
// class channel — the WhatsApp announcement also asks for names + NetIDs); and
// (2) the shared practice-DB password from the setup assignments. Students get
// both via Brightspace; they should not be committed here.
const INVITE_HOSTS = 'chat\\.whatsapp\\.com|wa\\.me|t\\.me|discord\\.gg|signal\\.group';
const REDACTED_INVITE = '_(invite link redacted — this export is public; the live link is on Brightspace)_';
const REDACTED_PW = '[redacted — connect per the instructions on Brightspace]';
function redactSecrets(md) {
  return md
    .replace(new RegExp(`\\[[^\\]]*\\]\\(https?:\\/\\/[^)]*?(?:${INVITE_HOSTS})[^)]*\\)`, 'gi'), REDACTED_INVITE)
    .replace(new RegExp(`https?:\\/\\/[^\\s)]*(?:${INVITE_HOSTS})[^\\s)]*`, 'gi'), REDACTED_INVITE)
    .replace(/dwdstudent\d{4}/gi, REDACTED_PW)
    .replace(/(password,?\s+enter\s+")[^"]{1,40}(")/gi, `$1${REDACTED_PW}$2`);
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

async function dlAssignments(ctx, ou, outDir, base) {
  const dir = resolve(outDir, 'assignments');
  mkdirSync(dir, { recursive: true });
  const folders = await assignments(ctx, ou);
  const items = [];
  for (const f of folders) {
    const file = `assignments/${f.Id}-${slug(f.Name)}.md`;
    const md =
      `# ${f.Name}\n\n` +
      metaList({ 'Brightspace id': f.Id, Due: f.DueDate, Hidden: f.IsHidden }) +
      `\n\n## Instructions\n\n${richToMd(f.CustomInstructions, base) || '_(no instructions)_'}\n`;
    writeFileSync(resolve(outDir, file), md);
    items.push({ id: f.Id, title: f.Name, dueDate: f.DueDate || null, file });
  }
  return { count: items.length, items };
}

async function dlQuizzes(ctx, ou, outDir, base) {
  const dir = resolve(outDir, 'quizzes');
  mkdirSync(dir, { recursive: true });
  const list = await quizzes(ctx, ou);
  const items = [];
  for (const q of list) {
    // Let fetch failures propagate rather than committing a "0 questions" quiz.
    const questions = await quizQuestions(ctx, ou, q.QuizId);
    const qmd = questions
      .map((qq, i) => `### Q${i + 1}${qq.Name ? ` — ${qq.Name}` : ''}\n\n${richToMd(qq.QuestionText, base) || '_(no text)_'}`)
      .join('\n\n');
    // Quiz Description/Instructions/Header/Footer are { Text: <RichText>, IsDisplayed }.
    const block = (label, f) => {
      if (!f || f.IsDisplayed === false) return '';
      const md = richToMd(f.Text && typeof f.Text === 'object' ? f.Text : f, base);
      return md ? `## ${label}\n\n${md}\n\n` : '';
    };
    const descMd = q.Description && q.Description.IsDisplayed !== false ? richToMd(q.Description.Text, base) : '';
    const file = `quizzes/${q.QuizId}-${slug(q.Name)}.md`;
    const md =
      `# ${q.Name}\n\n` +
      metaList({
        'Brightspace id': q.QuizId,
        Start: q.StartDate,
        Due: q.DueDate,
        End: q.EndDate,
        Active: q.IsActive,
        Attempts:
          q.AttemptsAllowed && q.AttemptsAllowed.IsUnlimited
            ? 'Unlimited'
            : q.AttemptsAllowed && q.AttemptsAllowed.NumberOfAttemptsAllowed,
        Questions: questions.length,
      }) +
      '\n\n' +
      (descMd ? `## Description\n\n${descMd}\n\n` : '') +
      block('Instructions', q.Instructions) +
      block('Header', q.Header) +
      block('Footer', q.Footer) +
      `## Questions (${questions.length})\n\n${qmd || '_(no questions retrieved)_'}\n`;
    writeFileSync(resolve(outDir, file), md);
    items.push({ id: q.QuizId, title: q.Name, dueDate: q.DueDate || null, questions: questions.length, file });
  }
  return { count: items.length, items };
}

async function dlAnnouncements(ctx, ou, outDir, base) {
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
      `\n\n${richToMd(n.Body, base) || '_(no body)_'}\n`;
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
      lines.push(`${'  '.repeat(depth)}- **${sub.Title}**${sub.IsHidden ? ' _(hidden)_' : ''}`);
      for (const t of sub.Topics || []) {
        counts.topics++;
        const indent = '  '.repeat(depth + 1);
        const hid = t.IsHidden ? ' _(hidden)_' : '';
        if (/file/i.test(t.TypeIdentifier || '')) {
          try {
            const { body } = await topicFile(ctx, ou, t.TopicId);
            const fname = `${t.TopicId}-${basename(t.Url || slug(t.Title))}`.replace(/[^\w.\-]/g, '_');
            writeFileSync(resolve(filesDir, fname), body);
            counts.files++;
            lines.push(`${indent}- ${t.Title}${hid} → [files/${fname}](files/${fname})`);
          } catch (err) {
            if (err instanceof AuthExpiredError) throw err; // expired session ≠ a missing file
            process.exitCode = 1; // a content file is missing — signal a partial export
            lines.push(`${indent}- ${t.Title} _(file download failed: ${err.message})_`);
          }
        } else if (/link/i.test(t.TypeIdentifier || '')) {
          counts.links++;
          const url = absUrl(t.Url, base);
          links.push({ title: t.Title, url, hidden: !!t.IsHidden });
          lines.push(`${indent}- ${t.Title}${hid} → ${url}`);
        } else {
          lines.push(`${indent}- ${t.Title}${hid} _(${t.TypeIdentifier})_`);
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
