#!/bin/bash
# SessionStart hook for Claude Code on the Web.
# Installs Node deps and Playwright Chromium for tools/brightspace/ so the
# Brightspace CLI is runnable inside web sessions, and a Python venv with the
# BigQuery client for tools/bq/.
#
# Idempotent: npm install is a no-op on a warm cache, and Playwright's
# `install` reuses already-downloaded browsers.
set -euo pipefail

# Only run in the Claude Code on the Web remote environment. Locally,
# developers manage their own node_modules.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

# --- BigQuery helper (tools/bq/) ---------------------------------------------
# Provisioned first and non-fatally: it is independent of the Brightspace
# tooling below, and a failure in either one must not take out the other.
echo "session-start: provisioning BigQuery helper venv (~/.venv-bq)..."
VENV="$HOME/.venv-bq"
# A venv whose creation was interrupted can have bin/python but no bin/pip;
# treat anything short of a usable interpreter *and* pip as absent and rebuild.
if [ ! -x "$VENV/bin/python" ] || [ ! -x "$VENV/bin/pip" ]; then
  rm -rf "$VENV"
fi
if {
  { [ -x "$VENV/bin/python" ] || python3 -m venv "$VENV"; } &&
  "$VENV/bin/pip" install --quiet --disable-pip-version-check google-cloud-bigquery
}; then
  echo "session-start: BigQuery helper venv ready."
else
  echo "WARNING: BigQuery helper venv setup failed; tools/bq/bq-query will fall back to system python3."
fi

# --- Brightspace tooling (tools/brightspace/) --------------------------------
TOOL_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}/tools/brightspace"

if [ ! -f "$TOOL_DIR/package.json" ]; then
  echo "session-start: $TOOL_DIR/package.json not found; skipping."
  exit 0
fi

cd "$TOOL_DIR"

echo "session-start: installing tools/brightspace npm deps..."
npm install --no-audit --no-fund --loglevel=error

echo "session-start: installing Playwright Chromium..."
npx --yes playwright install chromium

echo "session-start: done."
