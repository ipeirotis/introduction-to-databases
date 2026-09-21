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
READ_ONLY = re.compile(r"^\s*(--[^\n]*\n\s*)*(SELECT|WITH)\b", re.IGNORECASE)


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
    if not READ_ONLY.match(sql):
        sys.exit("refused: only SELECT / WITH statements are allowed by this helper")
    bq, c = client()
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
