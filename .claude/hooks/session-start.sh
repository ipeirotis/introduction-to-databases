#!/bin/bash
# SessionStart hook for Claude Code on the Web.
# Installs Node deps and Playwright Chromium for tools/brightspace/ so the
# Brightspace CLI is runnable inside web sessions.
#
# Idempotent: npm install is a no-op on a warm cache, and Playwright's
# `install` reuses already-downloaded browsers.
set -euo pipefail

# Only run in the Claude Code on the Web remote environment. Locally,
# developers manage their own node_modules.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

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
