// `brightspace audit` — read-only audit of the configured course shell.
//
// Walks the Brightspace course and lists what's posted: assignments, quizzes,
// content modules, and announcements. Prints a JSON report. Never writes to
// Brightspace.
//
// The per-section readers below are a best-effort first pass: they navigate to
// the documented D2L list pages and scrape the grid generically (by column
// header, see ../d2l.mjs). They degrade to status "unrecognized" instead of
// crashing when the DOM doesn't match, and `--debug` dumps the raw HTML to
// .auth/debug/ so the selectors can be tightened against the live course.

import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadConfig } from '../config.mjs';
import { launchAuthenticatedContext } from '../auth.mjs';
import {
  courseUrls,
  gotoAuthed,
  scrapeGridTable,
  cellByHeader,
  AuthExpiredError,
} from '../d2l.mjs';

export async function run(flags) {
  if (flags.help) {
    console.log(`brightspace audit [--offering <path>] [--headed] [--debug]
       [--sections assignments,quizzes,content,announcements]

Walks the configured Brightspace course shell and prints a JSON report of its
contents. Read-only. --debug saves each page's raw HTML to .auth/debug/ to
help refine selectors.`);
    return;
  }

  const config = loadConfig(flags);
  if (!config.brightspace.courseId) {
    throw new Error(
      `brightspace.course_id is not set in ${config.offeringRel}/offering.yaml. ` +
        `Set it or pass --course-id <id>.`
    );
  }

  const sections = (flags.sections || 'assignments,quizzes,content,announcements')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const readers = {
    assignments: auditAssignments,
    quizzes: auditQuizzes,
    content: auditContent,
    announcements: auditAnnouncements,
  };

  const { browser, context } = await launchAuthenticatedContext(config);
  try {
    const page = await context.newPage();
    const urls = courseUrls(config);
    console.log(`Auditing ${config.brightspace.label} (${urls.home})`);

    const report = {
      offering: config.offeringRel,
      courseId: config.brightspace.courseId,
      sections: {},
    };

    for (const section of sections) {
      const reader = readers[section];
      if (!reader) {
        console.warn(`Skipping unknown section: ${section}`);
        continue;
      }
      try {
        report.sections[section] = await reader(page, config, urls);
      } catch (err) {
        if (err instanceof AuthExpiredError) throw err; // bubble up, stop early
        report.sections[section] = { status: 'error', reason: String(err?.message || err) };
      }
    }

    console.log(JSON.stringify(report, null, 2));
    summarize(report);
  } finally {
    await browser.close();
  }
}

// --- helpers ----------------------------------------------------------------

function dumpDebug(html, config, section) {
  if (!config.debug) return null;
  mkdirSync(config.debugDir, { recursive: true });
  const file = resolve(config.debugDir, `${section}.html`);
  writeFileSync(file, html, 'utf8');
  return file;
}

// Run a grid-backed section: navigate, scrape the table, map each row with the
// supplied `mapRow`, and degrade gracefully (with an optional HTML dump) when
// no rows are recognized.
async function auditGridSection(page, config, url, section, mapRow) {
  await gotoAuthed(page, url);
  await page.waitForLoadState('networkidle').catch(() => {});
  const { headers, rows } = await scrapeGridTable(page);

  if (!rows.length) {
    const debugFile = dumpDebug(await page.content(), config, section);
    return {
      status: 'unrecognized',
      note:
        'No data rows recognized on the page. This usually means the D2L ' +
        'layout differs from the generic grid scrape and the selectors need ' +
        'tuning against the live course.',
      headersSeen: headers,
      ...(debugFile ? { debugHtml: debugFile } : {}),
    };
  }

  const items = rows.map(mapRow).filter((it) => it.title);
  return { status: 'ok', count: items.length, items };
}

// --- section readers --------------------------------------------------------

async function auditAssignments(page, config, urls) {
  return auditGridSection(page, config, urls.assignments, 'assignments', (row) => ({
    title: row.title,
    dueDate: cellByHeader(row, /due/i),
    points: cellByHeader(row, /score|points|grade|out of/i),
    submissions: cellByHeader(row, /submission|completed|users/i),
    visibility: cellByHeader(row, /publish|visib|hidden|availab/i),
  }));
}

async function auditQuizzes(page, config, urls) {
  return auditGridSection(page, config, urls.quizzes, 'quizzes', (row) => ({
    title: row.title,
    dueDate: cellByHeader(row, /due/i),
    attempts: cellByHeader(row, /attempt/i),
    points: cellByHeader(row, /score|points|out of/i),
    visibility: cellByHeader(row, /publish|visib|hidden|availab/i),
  }));
}

async function auditAnnouncements(page, config, urls) {
  return auditGridSection(page, config, urls.announcements, 'announcements', (row) => ({
    title: row.title,
    posted: cellByHeader(row, /date|posted|start/i),
    visibility: cellByHeader(row, /publish|visib|hidden|availab/i),
  }));
}

// Content (Lessons) is a single-page app, not a grid table, so it gets its own
// reader. Best-effort: pull module/topic titles from the rendered table of
// contents. Falls back to "unrecognized" + an HTML dump when the SPA structure
// doesn't match — this is the most likely section to need live tuning.
async function auditContent(page, config, urls) {
  await gotoAuthed(page, urls.content);
  await page.waitForLoadState('networkidle').catch(() => {});
  // Give the content SPA a moment to render its tree.
  await page
    .waitForSelector('[role="treeitem"], .d2l-le-TreeAccordion, a[href*="/content/"]', {
      timeout: 10000,
    })
    .catch(() => {});

  const items = await page.evaluate(() => {
    const clean = (el) => (el?.textContent || '').replace(/\s+/g, ' ').trim();
    const out = [];
    const seen = new Set();
    const nodes = document.querySelectorAll(
      '[role="treeitem"], .d2l-textblock, a[href*="/content/"]'
    );
    for (const n of nodes) {
      const t = clean(n);
      if (t && t.length <= 200 && !seen.has(t)) {
        seen.add(t);
        out.push(t);
      }
    }
    return out;
  });

  if (!items.length) {
    const debugFile = dumpDebug(await page.content(), config, 'content');
    return {
      status: 'unrecognized',
      note:
        'Could not extract a content tree. The Lessons SPA likely renders ' +
        'differently than expected; tune selectors against the live course.',
      ...(debugFile ? { debugHtml: debugFile } : {}),
    };
  }
  return { status: 'ok', count: items.length, modules: items };
}

// --- output -----------------------------------------------------------------

function summarize(report) {
  console.error('\n--- summary ---');
  for (const [section, data] of Object.entries(report.sections)) {
    if (data.status === 'ok') {
      console.error(`  ${section}: ${data.count ?? (data.modules?.length || 0)} item(s)`);
    } else {
      console.error(`  ${section}: ${data.status}${data.reason ? ` (${data.reason})` : ''}`);
    }
  }
  console.error('Note: section readers are a best-effort first pass; verify');
  console.error('counts against the live course and report any "unrecognized".');
}
