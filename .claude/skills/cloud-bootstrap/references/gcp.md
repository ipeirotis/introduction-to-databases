# GCP Reference

## User Prerequisites (First-Time Setup)

The user's GCP account needs **Owner** or **Service Account Admin + Project IAM Admin** roles on the project.

## Team Member Prerequisites (Adding to Existing Setup)

The user's GCP account needs **Service Account Key Admin** on the project (or on the specific service account). This is a narrower permission than what the first user needs.

## Key Limits

GCP allows **10 keys per service account**. This means up to 10 team members can each have their own key. If you hit this limit, you can list and delete unused keys (see "Key Management" below).

## Bootstrap Token Command

Tell the user to run in [Google Cloud Shell](https://console.cloud.google.com) (click the ">_" terminal icon in the Cloud Console) or on their local machine if they have `gcloud` installed:

```bash
gcloud config set project PROJECT_ID
gcloud auth print-access-token
```

This produces a token valid for ~1 hour.

## CLI Installation

The Claude Code on the Web sandbox does not have `gcloud` pre-installed. Use this script to install it:

```bash
if ! command -v gcloud &> /dev/null; then
  # Check common install paths first
  for dir in /home/user/google-cloud-sdk/bin /usr/lib/google-cloud-sdk/bin /usr/local/google-cloud-sdk/bin; do
    if [ -x "$dir/gcloud" ]; then export PATH="$dir:$PATH"; break; fi
  done
fi
if ! command -v gcloud &> /dev/null; then
  INSTALLER=$(curl -sSL https://sdk.cloud.google.com 2>/dev/null) || true
  if [ -z "$INSTALLER" ] || ! echo "$INSTALLER" | bash -s -- --disable-prompts --install-dir=/home/user; then
    echo "WARNING: gcloud SDK install failed."
  else
    export PATH="/home/user/google-cloud-sdk/bin:$PATH"
  fi
fi
```

### SessionStart Hook

After setup completes, create a SessionStart hook that installs the CLI **and** authenticates automatically. Create `.claude/hooks/cloud-auth.sh`:

```bash
#!/bin/bash
set -e

# --- Auto-authenticate if credentials exist ---
CONFIG=".cloud-config.json"
if [ ! -f "$CONFIG" ]; then exit 0; fi

PROVIDER=$(jq -r .provider "$CONFIG" 2>/dev/null) || exit 0
if [ "$PROVIDER" != "gcp" ]; then exit 0; fi

USER_EMAIL=$(git config user.email 2>/dev/null || true)
ENC_FILE=".cloud-credentials.${USER_EMAIL}.enc"
if [ -z "$USER_EMAIL" ] || [ ! -f "$ENC_FILE" ]; then exit 0; fi

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
# The decrypted key must persist for the whole session so that Python Google
# client libraries (which read GOOGLE_APPLICATION_CREDENTIALS / ADC, not the
# gcloud CLI auth store) can authenticate. It lives only in the ephemeral
# sandbox, never in the repo (the repo only ever holds the encrypted .enc).
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
# SessionStart runs in a short-lived subprocess; without persisting these,
# later commands in the session would not find gcloud or have ADC set.
# $CLAUDE_ENV_FILE is the harness mechanism for exporting env to the session
# (the same approach this skill's AWS hook uses for its credentials).
if [ -n "$CLAUDE_ENV_FILE" ]; then
  GCLOUD_BIN="$(dirname "$(command -v gcloud)")"
  grep -qxF "export PATH=\"$GCLOUD_BIN:\$PATH\"" "$CLAUDE_ENV_FILE" 2>/dev/null || \
    echo "export PATH=\"$GCLOUD_BIN:\$PATH\"" >> "$CLAUDE_ENV_FILE"
  grep -qxF "export GOOGLE_APPLICATION_CREDENTIALS=\"$ADC_KEY\"" "$CLAUDE_ENV_FILE" 2>/dev/null || \
    echo "export GOOGLE_APPLICATION_CREDENTIALS=\"$ADC_KEY\"" >> "$CLAUDE_ENV_FILE"
fi

echo "GCP credentials activated for $USER_EMAIL (gcloud CLI + Python ADC)"
```

Then add to `.claude/settings.json` (create the file and directories if needed):

```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "bash \"$CLAUDE_PROJECT_DIR/.claude/hooks/cloud-auth.sh\"",
            "timeout": 300
          }
        ]
      }
    ]
  }
}
```

If `.claude/settings.json` already exists, merge the `SessionStart` hook into the existing `hooks` object. Commit both `.claude/hooks/cloud-auth.sh` and `.claude/settings.json`.

## API Base

All API calls use `curl -H "Authorization: Bearer $TOKEN"` against `https://` endpoints.

## Create Service Account

```bash
# Create the service account
curl -X POST \
  "https://iam.googleapis.com/v1/projects/$PROJECT_ID/serviceAccounts" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "accountId": "claude-agent",
    "serviceAccount": {
      "displayName": "Claude Code Agent"
    }
  }'
```

The service account email will be: `claude-agent@$PROJECT_ID.iam.gserviceaccount.com`

## Grant Roles

For each role:

```bash
# Get current IAM policy
curl -X POST \
  "https://cloudresourcemanager.googleapis.com/v1/projects/$PROJECT_ID:getIamPolicy" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'

# Set updated policy with new binding added
curl -X POST \
  "https://cloudresourcemanager.googleapis.com/v1/projects/$PROJECT_ID:setIamPolicy" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "policy": {
      "bindings": [
        ... existing bindings ...,
        {
          "role": "roles/ROLE_NAME",
          "members": ["serviceAccount:claude-agent@'$PROJECT_ID'.iam.gserviceaccount.com"]
        }
      ]
    }
  }'
```

**Important:** Merge new bindings with existing ones. Do not overwrite the entire policy.

## Create Key

This command works for both first-time setup and adding new team members. Each call creates a new, independent key for the same service account.

```bash
# Resolve the project and service account from config (provider-aware: in
# multi-provider repos these live inside the matching providers[] entry).
# add-team-member/rotation reuse this snippet with no first-time vars in scope,
# so PROJECT_ID must be resolved here too, not assumed.
PROJECT_ID="${PROJECT_ID:-$(jq -r '(if .providers then (.providers[] | select(.provider=="gcp") | .project_id) else .project_id end) // empty' .cloud-config.json 2>/dev/null)}"
SA_EMAIL="${SA_EMAIL:-$(jq -r '(if .providers then (.providers[] | select(.provider=="gcp") | .service_account) else .service_account end) // empty' .cloud-config.json 2>/dev/null)}"
SA_EMAIL="${SA_EMAIL:-claude-agent@$PROJECT_ID.iam.gserviceaccount.com}"

curl -X POST \
  "https://iam.googleapis.com/v1/projects/$PROJECT_ID/serviceAccounts/$SA_EMAIL/keys" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"keyAlgorithm": "KEY_ALG_RSA_2048"}' \
  | jq -r '.privateKeyData' | base64 -d > credentials.json
```

## Key Management

List existing keys (useful if approaching the 10-key limit). Resolve the
configured service account first (do not hard-code `claude-agent`):

```bash
PROJECT_ID="${PROJECT_ID:-$(jq -r '(if .providers then (.providers[] | select(.provider=="gcp") | .project_id) else .project_id end) // empty' .cloud-config.json 2>/dev/null)}"
SA_EMAIL="${SA_EMAIL:-$(jq -r '(if .providers then (.providers[] | select(.provider=="gcp") | .service_account) else .service_account end) // empty' .cloud-config.json 2>/dev/null)}"
SA_EMAIL="${SA_EMAIL:-claude-agent@$PROJECT_ID.iam.gserviceaccount.com}"
curl -X GET \
  "https://iam.googleapis.com/v1/projects/$PROJECT_ID/serviceAccounts/$SA_EMAIL/keys" \
  -H "Authorization: Bearer $TOKEN"
```

Delete a specific key (if a team member leaves or a key is compromised):

```bash
curl -X DELETE \
  "https://iam.googleapis.com/v1/projects/$PROJECT_ID/serviceAccounts/$SA_EMAIL/keys/KEY_ID" \
  -H "Authorization: Bearer $TOKEN"
```

Also remove the corresponding `.cloud-credentials.<email>.enc` file from the repo.

## Activate (Subsequent Sessions)

Decrypt to a session-stable, private path and keep it for the session so Python
Google client libraries (which use Application Default Credentials, not the
gcloud CLI auth store) can authenticate too:

```bash
# Decrypt directly to the session ADC path so this snippet is self-contained
# (don't assume SessionStart already left a file behind). KEY/ENC_FILE come
# from the Authenticate workflow.
ADC_KEY="/tmp/gcp-adc-credentials.json"   # decrypted here, never committed
(umask 077 && echo "$KEY" | openssl enc -d -aes-256-cbc -pbkdf2 \
  -pass stdin -in "$ENC_FILE" -out "$ADC_KEY")
gcloud auth activate-service-account --key-file="$ADC_KEY"
# Provider-aware project: in multi-provider repos project_id is in providers[].
gcloud config set project "$(jq -r '(if .providers then (.providers[] | select(.provider=="gcp") | .project_id) else .project_id end)' .cloud-config.json)"
export GOOGLE_APPLICATION_CREDENTIALS="$ADC_KEY"
# If running outside the same shell, persist via $CLAUDE_ENV_FILE (see hook).
```

Do **not** delete the decrypted key while the session is using it for ADC; it
lives only in the ephemeral sandbox and is never written to the repo.

## Verify (Smoke Test)

After activating credentials, run this lightweight check to confirm they work:

```bash
# Provider-aware: in multi-provider repos project_id is in the providers[] entry.
gcloud projects describe "$(jq -r '(if .providers then (.providers[] | select(.provider=="gcp") | .project_id) else .project_id end)' .cloud-config.json)" --format="value(projectId)"
```

If this fails with a permission error, the credentials may be expired or revoked. Re-run the **Authenticate** flow or ask the user to check the service account.

## Common Roles Reference

| Need | Role |
|------|------|
| Deploy Cloud Functions | `roles/cloudfunctions.developer` |
| Manage Cloud Run | `roles/run.developer` |
| Read/write GCS buckets | `roles/storage.objectAdmin` |
| Manage Pub/Sub | `roles/pubsub.editor` |
| Query BigQuery | `roles/bigquery.dataEditor` + `roles/bigquery.jobUser` |
| Deploy App Engine | `roles/appengine.deployer` |
| Manage Cloud SQL | `roles/cloudsql.editor` |
| View logs | `roles/logging.viewer` |
| Manage secrets | `roles/secretmanager.secretAccessor` |
