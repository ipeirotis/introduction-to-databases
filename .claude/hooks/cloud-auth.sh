#!/bin/bash
set -e

# Auto-authenticate to GCP at session start if encrypted credentials exist.
# Installed by the cloud-bootstrap skill (references/gcp.md), with one local
# addition: a single-user fallback for the credential filename (see below).

# Hooks may run from any cwd; resolve repo-relative paths from the project root.
if [ -n "$CLAUDE_PROJECT_DIR" ]; then cd "$CLAUDE_PROJECT_DIR" || exit 0; fi

CONFIG=".cloud-config.json"
if [ ! -f "$CONFIG" ]; then exit 0; fi

PROVIDER=$(jq -r .provider "$CONFIG" 2>/dev/null) || exit 0
if [ "$PROVIDER" != "gcp" ]; then exit 0; fi

USER_EMAIL=$(git config user.email 2>/dev/null || true)
ENC_FILE=".cloud-credentials.${USER_EMAIL}.enc"

# Single-user fallback: in ephemeral web sessions git user.email may not match
# the address the credential was filed under (e.g. it is noreply@anthropic.com
# here while the file is .cloud-credentials.ipeirotis@gmail.com.enc). If the
# per-user file is absent but exactly one credential file exists, use it.
if [ ! -f "$ENC_FILE" ]; then
  shopt -s nullglob
  matches=( .cloud-credentials.*.enc )
  shopt -u nullglob
  if [ "${#matches[@]}" -eq 1 ]; then ENC_FILE="${matches[0]}"; fi
fi
if [ ! -f "$ENC_FILE" ]; then exit 0; fi

KEY="${GCP_CREDENTIALS_KEY:-$CLOUD_CREDENTIALS_KEY}"
if [ -z "$KEY" ]; then exit 0; fi

# --- Install gcloud if missing ---
if ! command -v gcloud &> /dev/null; then
  for dir in /home/user/google-cloud-sdk/bin /usr/lib/google-cloud-sdk/bin /usr/local/google-cloud-sdk/bin; do
    if [ -x "$dir/gcloud" ]; then export PATH="$dir:$PATH"; break; fi
  done
fi
if ! command -v gcloud &> /dev/null; then
  INSTALLER=$(curl -sSL https://sdk.cloud.google.com 2>/dev/null) || true
  if [ -z "$INSTALLER" ] || ! echo "$INSTALLER" | bash -s -- --disable-prompts --install-dir=/home/user; then
    echo "WARNING: gcloud SDK install failed — skipping GCP auth."
    exit 0
  fi
  export PATH="/home/user/google-cloud-sdk/bin:$PATH"
fi

# --- Decrypt credentials to a session-stable, private location ---
ADC_KEY="/tmp/gcp-adc-credentials.json"
if ! (umask 077 && echo "$KEY" | openssl enc -d -aes-256-cbc -pbkdf2 \
  -pass stdin -in "$ENC_FILE" -out "$ADC_KEY" 2>/dev/null); then
  echo "WARNING: Failed to decrypt credentials — check GCP_CREDENTIALS_KEY or .enc file integrity."
  rm -f "$ADC_KEY"
  exit 0
fi

if ! gcloud auth activate-service-account --key-file="$ADC_KEY" 2>/dev/null; then
  echo "WARNING: gcloud auth failed — credentials may be revoked."
  rm -f "$ADC_KEY"
  exit 0
fi
gcloud config set project "$(jq -r .project_id "$CONFIG" 2>/dev/null)" 2>/dev/null || true

# --- Populate Application Default Credentials for Python client libraries ---
export GOOGLE_APPLICATION_CREDENTIALS="$ADC_KEY"

# --- Persist gcloud PATH + ADC env for the rest of the session ---
if [ -n "$CLAUDE_ENV_FILE" ]; then
  GCLOUD_BIN="$(dirname "$(command -v gcloud)")"
  grep -qxF "export PATH=\"$GCLOUD_BIN:\$PATH\"" "$CLAUDE_ENV_FILE" 2>/dev/null || \
    echo "export PATH=\"$GCLOUD_BIN:\$PATH\"" >> "$CLAUDE_ENV_FILE"
  grep -qxF "export GOOGLE_APPLICATION_CREDENTIALS=\"$ADC_KEY\"" "$CLAUDE_ENV_FILE" 2>/dev/null || \
    echo "export GOOGLE_APPLICATION_CREDENTIALS=\"$ADC_KEY\"" >> "$CLAUDE_ENV_FILE"
fi

echo "GCP credentials activated for $USER_EMAIL (gcloud CLI + Python ADC)"
