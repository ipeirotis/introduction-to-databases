// `brightspace courses` — list the signed-in user's course shells.
//
// Helps you find the course_id to put in offering.yaml. Read-only.

import { loadConfig } from '../config.mjs';
import { openApi, enrollments, AuthExpiredError } from '../api.mjs';

export async function run(flags) {
  if (flags.help) {
    console.log(`brightspace courses [--filter <substring>] [--insecure]

Lists every course offering you're enrolled in, with its id (the number to use
as brightspace.course_id). --filter narrows by name/code, e.g.
  brightspace courses --filter databases`);
    return;
  }

  const config = loadConfig(flags);
  const filter = String(flags.filter || '').toLowerCase();
  const ctx = await openApi(config);
  try {
    const items = await enrollments(ctx);
    const rows = items
      .map((it) => ({
        id: it.OrgUnit.Id,
        name: it.OrgUnit.Name,
        code: it.OrgUnit.Code,
      }))
      .filter((r) => !filter || `${r.name} ${r.code}`.toLowerCase().includes(filter))
      .sort((a, b) => a.id - b.id);

    console.log(`${rows.length} course(s)${filter ? ` matching "${flags.filter}"` : ''}:`);
    for (const r of rows) {
      console.log(`  ${String(r.id).padEnd(8)} ${r.name}${r.code ? `  [${r.code}]` : ''}`);
    }
    console.log(
      `\nSet brightspace.course_id in ${config.offeringRel}/offering.yaml to the id you want to audit.`
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) {
      console.error(`✗ ${err.message}`);
      process.exitCode = 1;
      return;
    }
    throw err;
  } finally {
    await ctx.dispose();
  }
}
