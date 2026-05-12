// `brightspace audit` — read-only audit of the configured course shell.
//
// STATUS: scaffold. The Playwright navigation + Brightspace selectors
// still need to be filled in for each section (assignments, quizzes,
// content, announcements). Tracked in TASKS.md under "Tooling".

import { loadConfig } from '../config.mjs';
import { launchAuthenticatedContext } from '../auth.mjs';

export async function run(flags) {
  if (flags.help) {
    console.log(`brightspace audit [--offering <path>] [--headed]
       [--sections assignments,quizzes,content,announcements]

Walks the configured Brightspace course shell and prints a report of its
contents, then diffs against the repo. Read-only.`);
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

  const { browser, context } = await launchAuthenticatedContext(config);
  try {
    const page = await context.newPage();
    const courseHome = `${config.brightspace.baseUrl}/d2l/home/${config.brightspace.courseId}`;
    console.log(`Auditing ${config.brightspace.label} (${courseHome})`);
    await page.goto(courseHome, { waitUntil: 'domcontentloaded' });

    const report = { offering: config.offeringRel, sections: {} };

    for (const section of sections) {
      switch (section) {
        case 'assignments':
          report.sections.assignments = await auditAssignments(page, config);
          break;
        case 'quizzes':
          report.sections.quizzes = await auditQuizzes(page, config);
          break;
        case 'content':
          report.sections.content = await auditContent(page, config);
          break;
        case 'announcements':
          report.sections.announcements = await auditAnnouncements(page, config);
          break;
        default:
          console.warn(`Skipping unknown section: ${section}`);
      }
    }

    console.log(JSON.stringify(report, null, 2));
  } finally {
    await browser.close();
  }
}

// Each auditor returns a list of { title, dueDate?, visibility?, ... }.
// Implementations are intentionally left as TODOs — the Brightspace DOM
// changes often enough that selectors should be written against the live
// course, not guessed from documentation.

async function auditAssignments(_page, _config) {
  // TODO: navigate to /d2l/lms/dropbox/admin/folders_manage.d2l?ou=<courseId>
  // and scrape the folder list (title, due date, points, visibility).
  return { status: 'not_implemented' };
}

async function auditQuizzes(_page, _config) {
  // TODO: navigate to /d2l/lms/quizzing/admin/quizzes_manage.d2l?ou=<courseId>
  // and scrape the quiz list.
  return { status: 'not_implemented' };
}

async function auditContent(_page, _config) {
  // TODO: navigate to /d2l/le/content/<courseId>/Home and walk the module
  // tree (title, type, hidden/visible).
  return { status: 'not_implemented' };
}

async function auditAnnouncements(_page, _config) {
  // TODO: navigate to /d2l/lms/news/main.d2l?ou=<courseId> and list
  // announcements (title, posted date, body length).
  return { status: 'not_implemented' };
}
