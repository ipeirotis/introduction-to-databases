// `brightspace audit` — read-only audit of the configured course shell.
//
// Lists what's posted on Brightspace — assignments, quizzes, content modules,
// and announcements — by reading the D2L JSON API (see ../api.mjs). Prints a
// JSON report plus a short summary. Never writes to Brightspace.

import { loadConfig } from '../config.mjs';
import {
  openApi,
  assignments,
  quizzes,
  contentToc,
  news,
  AuthExpiredError,
} from '../api.mjs';

export async function run(flags) {
  if (flags.help) {
    console.log(`brightspace audit [--offering <path>] [--insecure]
       [--sections assignments,quizzes,content,announcements]

Reads the configured Brightspace course via the D2L API and prints a JSON
report of its contents. Read-only.`);
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

  const sections = (flags.sections || 'assignments,quizzes,content,announcements')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const ctx = await openApi(config);
  try {
    const report = { offering: config.offeringRel, courseId: ou, sections: {} };

    for (const section of sections) {
      try {
        switch (section) {
          case 'assignments':
            report.sections.assignments = mapAssignments(await assignments(ctx, ou));
            break;
          case 'quizzes':
            report.sections.quizzes = mapQuizzes(await quizzes(ctx, ou));
            break;
          case 'content':
            report.sections.content = mapContent(await contentToc(ctx, ou));
            break;
          case 'announcements':
            report.sections.announcements = mapNews(await news(ctx, ou));
            break;
          default:
            console.warn(`Skipping unknown section: ${section}`);
        }
      } catch (err) {
        if (err instanceof AuthExpiredError) throw err; // stop early; session dead
        process.exitCode = 1; // a requested section failed — signal non-zero exit
        report.sections[section] = { status: 'error', reason: String(err?.message || err) };
      }
    }

    console.log(JSON.stringify(report, null, 2));
    summarize(report);
  } finally {
    await ctx.dispose();
  }
}

// --- field mappers ----------------------------------------------------------

function mapAssignments(folders) {
  const items = (folders || []).map((f) => ({
    id: f.Id,
    title: f.Name,
    dueDate: f.DueDate || null,
    hidden: f.IsHidden,
    submissions: f.TotalUsersWithSubmissions,
    totalUsers: f.TotalUsers,
    attachments: (f.Attachments || []).length,
  }));
  return { status: 'ok', count: items.length, items };
}

function mapQuizzes(list) {
  const items = (list || []).map((q) => ({
    id: q.QuizId,
    title: q.Name,
    dueDate: q.DueDate || null,
    startDate: q.StartDate || null,
    endDate: q.EndDate || null,
    active: q.IsActive,
    attempts: q.AttemptsAllowed && q.AttemptsAllowed.NumberOfAttemptsAllowed,
  }));
  return { status: 'ok', count: items.length, items };
}

function mapNews(list) {
  const items = (list || []).map((n) => ({
    id: n.Id,
    title: n.Title,
    posted: n.StartDate || n.CreatedDate || null,
    hidden: n.IsHidden,
    published: n.IsPublished,
  }));
  return { status: 'ok', count: items.length, items };
}

function mapContent(toc) {
  let moduleCount = 0;
  let topicCount = 0;
  const walk = (m) =>
    (m.Modules || []).map((sub) => {
      moduleCount++;
      const topics = (sub.Topics || []).map((t) => {
        topicCount++;
        return { title: t.Title, type: t.TypeIdentifier, hidden: t.IsHidden, url: t.Url || null };
      });
      return { title: sub.Title, hidden: sub.IsHidden, topics, modules: walk(sub) };
    });
  const modules = walk(toc || {});
  return { status: 'ok', moduleCount, topicCount, modules };
}

// --- output -----------------------------------------------------------------

function summarize(report) {
  console.error('\n--- summary ---');
  for (const [section, data] of Object.entries(report.sections)) {
    if (data.status !== 'ok') {
      console.error(`  ${section}: ${data.status}${data.reason ? ` (${data.reason})` : ''}`);
    } else if (section === 'content') {
      console.error(`  content: ${data.moduleCount} module(s), ${data.topicCount} topic(s)`);
    } else {
      console.error(`  ${section}: ${data.count} item(s)`);
    }
  }
}
