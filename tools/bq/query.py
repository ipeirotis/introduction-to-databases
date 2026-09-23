#!/usr/bin/env python3
"""Read-only BigQuery helper for this repo.

Runs against the course project (``nyu-datasets``) using the Application
Default Credentials that ``.claude/hooks/cloud-auth.sh`` sets up at session
start. The service account is read-only (dataViewer + jobUser), and this
script additionally refuses anything that is not a SELECT/WITH statement, so
it can be allow-listed for Claude Code sessions without exposing writes.

Usage:
  tools/bq/bq-query tables <dataset>
  tools/bq/bq-query schema <dataset>.<table>
  tools/bq/bq-query sql "SELECT ..." [--max-rows N] [--csv]
  echo "SELECT ..." | tools/bq/bq-query sql - [--max-rows N] [--csv]
"""
import argparse
import csv
import re
import sys

PROJECT = "nyu-datasets"
READ_ONLY = re.compile(r"^\s*(SELECT|WITH)\b", re.IGNORECASE)


def strip_literals_and_comments(sql):
    """Blank out string literals and comments in one left-to-right pass.

    A single scan that tracks the current lexical state (line comment, block
    comment, quoted or triple-quoted literal) so that a quote inside a comment
    or a comment marker inside a string cannot mislead the check. Two
    independent regex passes could be tricked (e.g. quotes placed in two line
    comments that a literal regex then joins into one "string").
    """
    out = []
    i, n = 0, len(sql)
    while i < n:
        ch = sql[i]
        two = sql[i : i + 2]
        three = sql[i : i + 3]
        if two == "--" or ch == "#":
            j = sql.find("\n", i)
            i = n if j == -1 else j  # keep the newline itself
            out.append(" ")
        elif two == "/*":
            j = sql.find("*/", i + 2)
            i = n if j == -1 else j + 2
            out.append(" ")
        elif three in ("'''", '"""'):
            j = sql.find(three, i + 3)
            i = n if j == -1 else j + 3
            out.append("''")
        elif ch in ("'", '"', "`"):
            j = i + 1
            while j < n and sql[j] != ch:
                j += 2 if (sql[j] == "\\" and ch != "`") else 1
            i = j + 1 if j < n else n
            out.append("''")
        else:
            out.append(ch)
            i += 1
    return "".join(out)


def is_single_read_only_statement(sql):
    """Client-side check: one SELECT/WITH statement, no other semicolons.

    BigQuery accepts multi-statement scripts, so the first keyword alone is
    not enough. This is a cheap first filter; ``cmd_sql`` also asks BigQuery
    itself (dry run) what statement type it parsed, which is authoritative.
    """
    code = strip_literals_and_comments(sql)
    if not READ_ONLY.match(code):
        return False
    return ";" not in code.rstrip().rstrip(";")


def client():
    try:
        from google.cloud import bigquery
    except ImportError:
        sys.exit(
            "google-cloud-bigquery is not installed. Run the session-start hook "
            "or: python3 -m venv ~/.venv-bq && ~/.venv-bq/bin/pip install google-cloud-bigquery"
        )
    return bigquery, bigquery.Client(project=PROJECT)


def cmd_tables(args):
    _, c = client()
    for t in c.list_tables(args.dataset):
        tbl = c.get_table(t.reference)
        print(f"{t.table_id}\t{tbl.table_type}\t{tbl.num_rows} rows")


def cmd_schema(args):
    _, c = client()
    tbl = c.get_table(f"{PROJECT}.{args.table}")
    print(f"{args.table}  ({tbl.num_rows} rows)")
    for f in tbl.schema:
        desc = f"  -- {f.description}" if f.description else ""
        print(f"  {f.name:30s} {f.field_type:10s} {f.mode}{desc}")


def cmd_sql(args):
    sql = sys.stdin.read() if args.query == "-" else args.query
    if not is_single_read_only_statement(sql):
        sys.exit("refused: only a single SELECT / WITH statement is allowed by this helper")
    bq, c = client()
    # Authoritative check: let BigQuery parse it (dry run executes nothing) and
    # refuse anything it does not classify as a plain SELECT, e.g. SCRIPT for
    # multi-statement input or DDL/DML types.
    dry = c.query(sql, job_config=bq.QueryJobConfig(dry_run=True, use_query_cache=False))
    if dry.statement_type != "SELECT":
        sys.exit(f"refused: BigQuery parsed this as {dry.statement_type}, not a single SELECT")
    job = c.query(sql, job_config=bq.QueryJobConfig(maximum_bytes_billed=10 * 1024**3))
    rows = job.result(max_results=args.max_rows)
    cols = [f.name for f in rows.schema]
    if args.csv:
        w = csv.writer(sys.stdout)
        w.writerow(cols)
        for r in rows:
            w.writerow(list(r.values()))
    else:
        print(" | ".join(cols))
        print("-" * max(20, min(120, sum(len(x) + 3 for x in cols))))
        for r in rows:
            print(" | ".join("NULL" if v is None else str(v) for v in r.values()))
        print(f"[{rows.total_rows} rows total, showing up to {args.max_rows}]")


def main():
    p = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
    )
    sub = p.add_subparsers(dest="cmd", required=True)
    s = sub.add_parser("tables", help="list tables in a dataset")
    s.add_argument("dataset")
    s.set_defaults(fn=cmd_tables)
    s = sub.add_parser("schema", help="show a table's columns")
    s.add_argument("table", help="dataset.table")
    s.set_defaults(fn=cmd_schema)
    s = sub.add_parser("sql", help="run a SELECT / WITH query")
    s.add_argument("query", help='SQL text, or "-" to read it from stdin')
    s.add_argument("--max-rows", type=int, default=50)
    s.add_argument("--csv", action="store_true")
    s.set_defaults(fn=cmd_sql)
    args = p.parse_args()
    args.fn(args)


if __name__ == "__main__":
    main()
