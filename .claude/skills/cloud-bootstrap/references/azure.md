# Azure Reference

## User Prerequisites (First-Time Setup)

The user needs **Owner** or **User Access Administrator + Contributor** role on the Azure subscription, plus **Application Administrator** in Entra ID (formerly Azure AD) to create service principals.

## Team Member Prerequisites (Adding to Existing Setup)

The user needs **Application Administrator** (or **Cloud Application Administrator**) in Entra ID to add a client secret to the existing app registration. No subscription-level role is needed since roles are already assigned to the service principal.

## Key Limits

Azure allows **unlimited client secrets per app registration**. Each team member gets their own client secret for the same application/service principal. No practical team size limit.

## CLI Installation

The Claude Code on the Web sandbox may not have `az` pre-installed. Use this script to install it:

```bash
if ! command -v az &> /dev/null; then
  for dir in /usr/bin /usr/local/bin /home/user/bin; do
    if [ -x "$dir/az" ]; then export PATH="$dir:$PATH"; break; fi
  done
fi
if ! command -v az &> /dev/null; then
  if ! curl -sSL https://aka.ms/InstallAzureCLIDeb | sudo bash; then
    echo "WARNING: Azure CLI install failed."
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
if [ "$PROVIDER" != "azure" ]; then exit 0; fi

USER_EMAIL=$(git config user.email 2>/dev/null || true)
ENC_FILE=".cloud-credentials.${USER_EMAIL}.enc"
if [ -z "$USER_EMAIL" ] || [ ! -f "$ENC_FILE" ]; then exit 0; fi

KEY="${AZURE_CREDENTIALS_KEY:-$CLOUD_CREDENTIALS_KEY}"
if [ -z "$KEY" ]; then exit 0; fi

# --- Install az CLI if missing ---
if ! command -v az &> /dev/null; then
  for dir in /usr/bin /usr/local/bin /home/user/bin; do
    if [ -x "$dir/az" ]; then export PATH="$dir:$PATH"; break; fi
  done
fi
if ! command -v az &> /dev/null; then
  if ! curl -sSL https://aka.ms/InstallAzureCLIDeb | sudo bash; then
    echo "WARNING: Azure CLI install failed — skipping Azure auth."
    exit 0
  fi
fi

# --- Decrypt credentials (restrictive permissions + guaranteed cleanup) ---
trap 'rm -f /tmp/credentials.json' EXIT
if ! (umask 077 && echo "$KEY" | openssl enc -d -aes-256-cbc -pbkdf2 \
  -pass stdin -in "$ENC_FILE" -out /tmp/credentials.json 2>/dev/null); then
  echo "WARNING: Failed to decrypt credentials — check AZURE_CREDENTIALS_KEY or .enc file integrity."
  exit 0
fi

if ! az login --service-principal \
  --username "$(jq -r .appId /tmp/credentials.json)" \
  --password "$(jq -r .password /tmp/credentials.json)" \
  --tenant "$(jq -r .tenant /tmp/credentials.json)" 2>/dev/null; then
  echo "WARNING: az login failed — credentials may be revoked."
  exit 0
fi
az account set --subscription "$(jq -r .project_id "$CONFIG" 2>/dev/null)" 2>/dev/null || true

# Persist the resolved az CLI path for the rest of the session. Without this,
# later shells can have a valid cached Azure login but still hit
# "az: command not found" (the AWS/GCP hooks persist their CLI paths the same way).
if [ -n "$CLAUDE_ENV_FILE" ] && command -v az &>/dev/null; then
  AZ_BIN="$(dirname "$(command -v az)")"
  grep -qxF "export PATH=\"$AZ_BIN:\$PATH\"" "$CLAUDE_ENV_FILE" 2>/dev/null || \
    echo "export PATH=\"$AZ_BIN:\$PATH\"" >> "$CLAUDE_ENV_FILE"
fi

echo "Azure credentials activated for $USER_EMAIL"
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

## Bootstrap Token Command

Tell the user to run locally:

```bash
az login
az account set --subscription SUBSCRIPTION_ID

# ARM token — for resource management and role assignments
ARM_TOKEN=$(az account get-access-token --query accessToken -o tsv)

# Graph token — for app registrations, service principals, client secrets
GRAPH_TOKEN=$(az account get-access-token --resource-type ms-graph --query accessToken -o tsv)
```

Both tokens are valid for ~1 hour. **Important:** ARM tokens are NOT valid for Microsoft Graph API calls, and vice versa. Use the correct token for each endpoint.

## API Approach

Use the Azure CLI (`az`) if available. Otherwise, use REST API calls with the appropriate token:
- **ARM operations** (role assignments, subscriptions): `curl -H "Authorization: Bearer $ARM_TOKEN"` against `https://management.azure.com`
- **Graph operations** (app registrations, service principals, secrets): `curl -H "Authorization: Bearer $GRAPH_TOKEN"` against `https://graph.microsoft.com`

## Create Service Principal

```bash
# Using Azure CLI with the bootstrap token context
az ad sp create-for-rbac \
  --name claude-agent \
  --skip-assignment \
  > credentials.json
```

This returns `appId`, `password` (client secret), and `tenant`. The credentials file is already in the right format.

If `az` is not available, use the Microsoft Graph API (requires `$GRAPH_TOKEN`):

```bash
# Step 1: Create application
curl -X POST "https://graph.microsoft.com/v1.0/applications" \
  -H "Authorization: Bearer $GRAPH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"displayName": "claude-agent"}' \
  > app.json

APP_ID=$(jq -r .appId app.json)
OBJECT_ID=$(jq -r .id app.json)

# Step 2: Create service principal
curl -X POST "https://graph.microsoft.com/v1.0/servicePrincipals" \
  -H "Authorization: Bearer $GRAPH_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"appId\": \"$APP_ID\"}"

# Step 3: Add client secret
curl -X POST "https://graph.microsoft.com/v1.0/applications/$OBJECT_ID/addPassword" \
  -H "Authorization: Bearer $GRAPH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"passwordCredential": {"displayName": "claude-code"}}' \
  > secret.json

# Step 4: Assemble credentials
# The tenant ID is required for every future `az login --tenant ...`. This REST
# path is used precisely when `az` is unavailable, so do NOT persist a
# placeholder: collect the real tenant ID from the user before writing
# credentials.json, otherwise the encrypted credential will fail every session.
# Honor a tenant the user already supplied; only probe `az` as a fallback (it
# will be empty in the no-`az` REST path, so don't let it clobber a real value).
TENANT_ID="${TENANT_ID:-$(az account show --query tenantId -o tsv 2>/dev/null || true)}"
if [ -z "$TENANT_ID" ]; then
  echo "ERROR: Tenant ID not available. Ask the user for their Azure tenant ID"
  echo "       and set TENANT_ID before assembling credentials.json."
  exit 1
fi
jq -n \
  --arg appId "$APP_ID" \
  --arg password "$(jq -r .secretText secret.json)" \
  --arg tenant "$TENANT_ID" \
  '{appId: $appId, password: $password, tenant: $tenant}' \
  > credentials.json

rm -f app.json secret.json
```

If the tenant ID is not available, stop and ask the user for it before writing `credentials.json` — never persist a placeholder.

## Grant Roles

Roles are assigned to the **service principal**, so they apply to all team members automatically. No per-user role assignment needed.

```bash
# APP_ID is the service principal's appId. During first-time setup it comes from
# the credentials you just created; in later sessions read it from config.
APP_ID="${APP_ID:-$(jq -r '.appId // .service_account' credentials.json 2>/dev/null)}"
[ -z "$APP_ID" ] || [ "$APP_ID" = "null" ] && APP_ID=$(jq -r .service_account .cloud-config.json)

SUBSCRIPTION_ID=$(jq -r .project_id .cloud-config.json)
SP_OBJECT_ID=$(az ad sp show --id "$APP_ID" --query id -o tsv)

az role assignment create \
  --assignee-object-id "$SP_OBJECT_ID" \
  --assignee-principal-type ServicePrincipal \
  --role "ROLE_NAME" \
  --scope "/subscriptions/$SUBSCRIPTION_ID"
```

Or via REST API (requires `$ARM_TOKEN` and `$GRAPH_TOKEN`):

```bash
# Resolve the service principal's object id from its appId before assigning a
# role. The role assignment's principalId must be this SP object id, not the
# appId, or the assignment is created against an empty/incorrect principal.
APP_ID="${APP_ID:-$(jq -r '.appId // .service_account' credentials.json 2>/dev/null)}"
[ -z "$APP_ID" ] || [ "$APP_ID" = "null" ] && APP_ID=$(jq -r .service_account .cloud-config.json)
SUBSCRIPTION_ID=$(jq -r .project_id .cloud-config.json)
SP_OBJECT_ID=$(curl -s "https://graph.microsoft.com/v1.0/servicePrincipals?\$filter=appId eq '$APP_ID'" \
  -H "Authorization: Bearer $GRAPH_TOKEN" | jq -r '.value[0].id')

# URL-encode the query: role names contain spaces (e.g. "Storage Blob Data
# Contributor"), which curl rejects if substituted raw into the URL. Let curl
# encode the params via -G/--data-urlencode.
ROLE_DEFINITION_ID=$(curl -s -G \
  "https://management.azure.com/subscriptions/$SUBSCRIPTION_ID/providers/Microsoft.Authorization/roleDefinitions" \
  --data-urlencode "api-version=2022-04-01" \
  --data-urlencode "\$filter=roleName eq 'ROLE_NAME'" \
  -H "Authorization: Bearer $ARM_TOKEN" | jq -r '.value[0].id')

curl -X PUT \
  "https://management.azure.com/subscriptions/$SUBSCRIPTION_ID/providers/Microsoft.Authorization/roleAssignments/$(uuidgen)?api-version=2022-04-01" \
  -H "Authorization: Bearer $ARM_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"properties\": {
      \"roleDefinitionId\": \"$ROLE_DEFINITION_ID\",
      \"principalId\": \"$SP_OBJECT_ID\",
      \"principalType\": \"ServicePrincipal\"
    }
  }"
```

Prefer scoping roles to specific resource groups rather than the entire subscription.

## Add Client Secret for Existing App (Team Members)

When a new team member joins, create a new client secret for the existing app. Read the `appId` from `.cloud-config.json` (stored as `service_account`).

```bash
# Get the app's object ID from its appId (requires $GRAPH_TOKEN). In
# multi-provider mode the appId is stored as service_account inside the matching
# providers[] entry, not at the top level.
APP_ID=$(jq -r 'if .providers then (.providers[] | select(.provider=="azure") | .service_account) else .service_account end' .cloud-config.json)
OBJECT_ID=$(curl -s -G "https://graph.microsoft.com/v1.0/applications" \
  --data-urlencode "\$filter=appId eq '$APP_ID'" \
  -H "Authorization: Bearer $GRAPH_TOKEN" | jq -r '.value[0].id')

USER_EMAIL=$(git config user.email)

# Add a new client secret labeled with the user's email
curl -X POST "https://graph.microsoft.com/v1.0/applications/$OBJECT_ID/addPassword" \
  -H "Authorization: Bearer $GRAPH_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"passwordCredential\": {\"displayName\": \"claude-code-${USER_EMAIL}\"}}" \
  > secret.json

# Assemble credentials (appId and tenant are the same for all team members).
# Read tenant provider-aware; never persist a placeholder — stop and ask if absent.
TENANT_ID=$(jq -r '(if .providers then (.providers[] | select(.provider=="azure") | .tenant) else .tenant end) // empty' .cloud-config.json 2>/dev/null)
if [ -z "$TENANT_ID" ]; then
  echo "ERROR: Azure tenant ID not found in .cloud-config.json — ask the user and set TENANT_ID."
  exit 1
fi
jq -n \
  --arg appId "$APP_ID" \
  --arg password "$(jq -r .secretText secret.json)" \
  --arg tenant "$TENANT_ID" \
  '{appId: $appId, password: $password, tenant: $tenant}' \
  > credentials.json

rm -f secret.json
```

**Note:** The `.cloud-config.json` for Azure should also store `tenant` alongside the other fields.

## Secret Management

List client secrets for the app (requires `$GRAPH_TOKEN`):

```bash
curl -s "https://graph.microsoft.com/v1.0/applications/$OBJECT_ID" \
  -H "Authorization: Bearer $GRAPH_TOKEN" | jq '.passwordCredentials[] | {displayName, keyId, endDateTime}'
```

Remove a specific client secret (if a team member leaves):

```bash
curl -X POST "https://graph.microsoft.com/v1.0/applications/$OBJECT_ID/removePassword" \
  -H "Authorization: Bearer $GRAPH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"keyId": "KEY_ID_TO_REMOVE"}'
```

Also remove the corresponding `.cloud-credentials.<email>.enc` file from the repo.

## Activate (Subsequent Sessions)

After decrypting credentials to `/tmp/credentials.json`:

```bash
az login --service-principal \
  --username "$(jq -r .appId /tmp/credentials.json)" \
  --password "$(jq -r .password /tmp/credentials.json)" \
  --tenant "$(jq -r .tenant /tmp/credentials.json)"

# Provider-aware subscription: in multi-provider repos the subscription id is in
# the matching providers[] entry, not at top-level .project_id.
az account set --subscription "$(jq -r '(if .providers then (.providers[] | select(.provider=="azure") | .project_id) else .project_id end)' .cloud-config.json)"

rm -f /tmp/credentials.json
```

## Verify (Smoke Test)

After activating credentials, run this lightweight check to confirm they work:

```bash
az account show --query "{name:name, id:id}" -o json
```

If this fails, the credentials may be expired or the client secret may have been revoked. Re-run the **Authenticate** flow or ask the user to check the service principal.

## Common Roles Reference

| Need | Role |
|------|------|
| Deploy Functions | `Website Contributor` |
| Manage Storage | `Storage Blob Data Contributor` |
| Manage Cosmos DB | `Cosmos DB Operator` |
| Deploy Container Apps | `Contributor` (scoped to resource group) |
| Manage Service Bus | `Azure Service Bus Data Owner` |
| Read logs | `Log Analytics Reader` |
| Manage Key Vault secrets | `Key Vault Secrets Officer` |
| Deploy via ARM/Bicep | `Contributor` (scoped to resource group) |
| Manage SQL databases | `SQL DB Contributor` |

**Prefer scoping roles to specific resource groups over subscription-wide assignments.**
