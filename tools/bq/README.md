# tools/bq — read-only BigQuery helper

Thin wrapper around the BigQuery Python client for querying the course
datasets in `nyu-datasets` from a Claude Code web session. It uses the
Application Default Credentials that `.claude/hooks/cloud-auth.sh` activates
at session start (read-only service account) and refuses anything that is not
a `SELECT`/`WITH` statement.

```
tools/bq/bq-query tables carconnect_teaching
tools/bq/bq-query schema carconnect_teaching.listings
tools/bq/bq-query sql "SELECT COUNT(*) FROM \`nyu-datasets.imdb.title_basics\`"
echo "SELECT 1" | tools/bq/bq-query sql - --csv
```

`.claude/hooks/session-start.sh` creates `~/.venv-bq` with
`google-cloud-bigquery` installed; the wrapper falls back to the system
`python3` if that venv is missing.

The helper and the read-only `bq` / `gcloud` inspection commands are
allow-listed in `.claude/settings.json`, so the auto-mode permission
classifier does not block routine read-only queries in web sessions.
