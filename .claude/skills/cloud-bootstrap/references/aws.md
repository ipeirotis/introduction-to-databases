# AWS Reference

## User Prerequisites (First-Time Setup)

The user's AWS account needs **IAM full access** or at minimum:
- `iam:CreateGroup`, `iam:CreateUser`, `iam:AddUserToGroup`
- `iam:CreateAccessKey`
- `iam:AttachGroupPolicy` / `iam:PutGroupPolicy`

## Team Member Prerequisites (Adding to Existing Setup)

The user's AWS account needs:
- `iam:CreateUser`, `iam:AddUserToGroup`
- `iam:CreateAccessKey`

## Multi-User Strategy

AWS allows only **2 access keys per IAM user**, which is too few for team sharing. Instead, this skill creates:
- An **IAM group** (`claude-agents`) with the shared policies attached
- A **separate IAM user per team member** (`claude-agent-<sanitized-email>`) added to that group

Each team member gets their own IAM user and access key, but all users inherit the same permissions from the group. The `.cloud-config.json` `service_account` field stores the group name.

## CLI Installation

The Claude Code on the Web sandbox may not have `aws` pre-installed. Use this script to install it:

```bash
if ! command -v aws &> /dev/null; then
  for dir in /home/user/bin /usr/local/bin /home/user/aws-cli/v2/current/bin; do
    if [ -x "$dir/aws" ]; then export PATH="$dir:$PATH"; break; fi
  done
fi
if ! command -v aws &> /dev/null; then
  if curl -sSL "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o /tmp/awscliv2.zip 2>/dev/null && \
     unzip -q /tmp/awscliv2.zip -d /tmp && \
     /tmp/aws/install --install-dir /home/user/aws-cli --bin-dir /home/user/bin; then
    export PATH="/home/user/bin:$PATH"
  else
    echo "WARNING: AWS CLI install failed."
  fi
  rm -rf /tmp/awscliv2.zip /tmp/aws
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
if [ "$PROVIDER" != "aws" ]; then exit 0; fi

USER_EMAIL=$(git config user.email 2>/dev/null || true)
ENC_FILE=".cloud-credentials.${USER_EMAIL}.enc"
if [ -z "$USER_EMAIL" ] || [ ! -f "$ENC_FILE" ]; then exit 0; fi

KEY="${AWS_CREDENTIALS_KEY:-$CLOUD_CREDENTIALS_KEY}"
if [ -z "$KEY" ]; then exit 0; fi

# --- Install aws CLI if missing ---
if ! command -v aws &> /dev/null; then
  for dir in /home/user/bin /usr/local/bin /home/user/aws-cli/v2/current/bin; do
    if [ -x "$dir/aws" ]; then export PATH="$dir:$PATH"; break; fi
  done
fi
if ! command -v aws &> /dev/null; then
  if curl -sSL "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o /tmp/awscliv2.zip 2>/dev/null && \
     unzip -q /tmp/awscliv2.zip -d /tmp && \
     /tmp/aws/install --install-dir /home/user/aws-cli --bin-dir /home/user/bin; then
    export PATH="/home/user/bin:$PATH"
  else
    echo "WARNING: AWS CLI install failed — skipping AWS auth."
    rm -rf /tmp/awscliv2.zip /tmp/aws
    exit 0
  fi
  rm -rf /tmp/awscliv2.zip /tmp/aws
fi

# --- Decrypt credentials (restrictive permissions + guaranteed cleanup) ---
trap 'rm -f /tmp/credentials.json' EXIT
if ! (umask 077 && echo "$KEY" | openssl enc -d -aes-256-cbc -pbkdf2 \
  -pass stdin -in "$ENC_FILE" -out /tmp/credentials.json 2>/dev/null); then
  echo "WARNING: Failed to decrypt credentials — check AWS_CREDENTIALS_KEY or .enc file integrity."
  exit 0
fi

export AWS_ACCESS_KEY_ID=$(jq -r .access_key_id /tmp/credentials.json)
export AWS_SECRET_ACCESS_KEY=$(jq -r .secret_access_key /tmp/credentials.json)
export AWS_DEFAULT_REGION=$(jq -r '.region // empty' /tmp/credentials.json)

# Persist env vars for the session via CLAUDE_ENV_FILE. Persist the aws CLI
# bin dir too: if it was just installed under /home/user/bin, later session
# shells would otherwise have valid AWS_* vars but still hit "aws: command
# not found".
if [ -n "$CLAUDE_ENV_FILE" ]; then
  echo "export AWS_ACCESS_KEY_ID='$AWS_ACCESS_KEY_ID'" >> "$CLAUDE_ENV_FILE"
  echo "export AWS_SECRET_ACCESS_KEY='$AWS_SECRET_ACCESS_KEY'" >> "$CLAUDE_ENV_FILE"
  echo "export AWS_DEFAULT_REGION='$AWS_DEFAULT_REGION'" >> "$CLAUDE_ENV_FILE"
  AWS_BIN="$(dirname "$(command -v aws)")"
  grep -qxF "export PATH=\"$AWS_BIN:\$PATH\"" "$CLAUDE_ENV_FILE" 2>/dev/null || \
    echo "export PATH=\"$AWS_BIN:\$PATH\"" >> "$CLAUDE_ENV_FILE"
fi

echo "AWS credentials activated for $USER_EMAIL"
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

**Note:** AWS credentials are environment variables, so the hook uses `$CLAUDE_ENV_FILE` to persist them for the entire session.

## Bootstrap Token Command

Tell the user to run locally:

```bash
aws sts get-session-token --duration-seconds 3600
```

This returns `AccessKeyId`, `SecretAccessKey`, and `SessionToken`, valid for 1 hour.

Alternatively, if the user has the AWS CLI configured, they can provide their temporary credentials directly:

```bash
# Simpler: just provide the existing credentials context
aws sts get-caller-identity   # to verify they're logged in
```

Then ask them to provide the output of:
```bash
echo '{"access_key":"'$AWS_ACCESS_KEY_ID'","secret_key":"'$AWS_SECRET_ACCESS_KEY'","session_token":"'$AWS_SESSION_TOKEN'"}'
```

## API Approach

Use the AWS CLI (`aws`) if available in the environment. Otherwise, use signed API calls with the temporary credentials.

## First-Time Setup: Create Group and First User

```bash
# Export bootstrap credentials
export AWS_ACCESS_KEY_ID="..."
export AWS_SECRET_ACCESS_KEY="..."
export AWS_SESSION_TOKEN="..."

# Sanitize email for use as IAM user name (replace @ and . with -)
USER_EMAIL=$(git config user.email)
SANITIZED_EMAIL=$(echo "$USER_EMAIL" | sed 's/[@.]/-/g')

# Create the shared group
aws iam create-group --group-name claude-agents

# Create the user and add to group
aws iam create-user --user-name "claude-agent-${SANITIZED_EMAIL}"
aws iam add-user-to-group \
  --group-name claude-agents \
  --user-name "claude-agent-${SANITIZED_EMAIL}"

# Create access key
aws iam create-access-key \
  --user-name "claude-agent-${SANITIZED_EMAIL}" > credentials.json
```

Reformat `credentials.json` to a clean structure before encrypting:

```bash
cat credentials.json | jq --arg region "$AWS_REGION" '{
  access_key_id: .AccessKey.AccessKeyId,
  secret_access_key: .AccessKey.SecretAccessKey,
  region: $region
}' > credentials_clean.json
mv credentials_clean.json credentials.json
```

**Important:** Ask the user which AWS region to use and set `AWS_REGION` before running the above command (e.g., `AWS_REGION="us-east-1"`). The chosen region is persisted in the encrypted credentials and in `.cloud-config.json`.

**For `.cloud-config.json`:** set `service_account` to `claude-agents` (the group name).

## Add Team Member: Create New User in Existing Group

```bash
USER_EMAIL=$(git config user.email)
SANITIZED_EMAIL=$(echo "$USER_EMAIL" | sed 's/[@.]/-/g')

# Use the configured group (stored in service_account at setup; provider-aware
# in multi-provider mode), not a hard-coded name, or the new user won't inherit
# the repo's permissions.
GROUP_NAME=$(jq -r '(if .providers then (.providers[] | select(.provider=="aws") | .service_account) else .service_account end) // "claude-agents"' .cloud-config.json 2>/dev/null)

# Create user and add to the existing group
aws iam create-user --user-name "claude-agent-${SANITIZED_EMAIL}"
aws iam add-user-to-group \
  --group-name "$GROUP_NAME" \
  --user-name "claude-agent-${SANITIZED_EMAIL}"

# Create access key
aws iam create-access-key \
  --user-name "claude-agent-${SANITIZED_EMAIL}" > credentials.json

# Reformat — read region from existing config. In multi-provider mode the
# region lives inside the matching providers[] entry, not at the top level.
AWS_REGION=$(jq -r '(if .providers then (.providers[] | select(.provider=="aws") | .region) else .region end) // "us-east-1"' .cloud-config.json 2>/dev/null)
cat credentials.json | jq --arg region "$AWS_REGION" '{
  access_key_id: .AccessKey.AccessKeyId,
  secret_access_key: .AccessKey.SecretAccessKey,
  region: $region
}' > credentials_clean.json
mv credentials_clean.json credentials.json
```

## Grant Roles (Attach Policies to Group)

Policies are attached to the **group**, not individual users. This way all team members share the same permissions.

For AWS managed policies:

```bash
aws iam attach-group-policy \
  --group-name claude-agents \
  --policy-arn arn:aws:iam::aws:policy/POLICY_NAME
```

For inline policies (more granular):

```bash
aws iam put-group-policy \
  --group-name claude-agents \
  --policy-name descriptive-name \
  --policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Action": ["s3:GetObject", "s3:PutObject"],
      "Resource": "arn:aws:s3:::BUCKET_NAME/*"
    }]
  }'
```

Prefer inline policies scoped to specific resources over broad managed policies.

## Activate (Subsequent Sessions)

After decrypting credentials to `/tmp/credentials.json`:

```bash
export AWS_ACCESS_KEY_ID=$(jq -r .access_key_id /tmp/credentials.json)
export AWS_SECRET_ACCESS_KEY=$(jq -r .secret_access_key /tmp/credentials.json)
export AWS_DEFAULT_REGION=$(jq -r .region /tmp/credentials.json)
rm -f /tmp/credentials.json

# Persist for the rest of the session, not just this shell. SessionStart and
# one-off snippets run in short-lived subprocesses, so later AWS CLI commands
# in new shells would otherwise lose these exports. $CLAUDE_ENV_FILE is the
# harness mechanism for exporting env to the whole session.
if [ -n "$CLAUDE_ENV_FILE" ]; then
  {
    echo "export AWS_ACCESS_KEY_ID='$AWS_ACCESS_KEY_ID'"
    echo "export AWS_SECRET_ACCESS_KEY='$AWS_SECRET_ACCESS_KEY'"
    echo "export AWS_DEFAULT_REGION='$AWS_DEFAULT_REGION'"
  } >> "$CLAUDE_ENV_FILE"
fi

# Verify
aws sts get-caller-identity
```

**Note:** Unlike GCP, AWS credentials are exported as environment variables, not activated via a CLI command. Persisting them to `$CLAUDE_ENV_FILE` keeps them available across the session's shells (the SessionStart hook does this too); otherwise they only live for the current shell.

## Verify (Smoke Test)

After activating credentials, run this lightweight check to confirm they work:

```bash
aws sts get-caller-identity
```

If this fails, the credentials may be expired or revoked. Re-run the **Authenticate** flow or ask the user to check the IAM user.

## User Management

List users in the group:

```bash
aws iam get-group --group-name claude-agents
```

Remove a team member (if they leave):

```bash
SANITIZED_EMAIL=$(echo "departed-user@example.com" | sed 's/[@.]/-/g')

# Delete their access keys
for KEY_ID in $(aws iam list-access-keys --user-name "claude-agent-${SANITIZED_EMAIL}" --query 'AccessKeyMetadata[].AccessKeyId' --output text); do
  aws iam delete-access-key --user-name "claude-agent-${SANITIZED_EMAIL}" --access-key-id "$KEY_ID"
done

# Remove from group and delete user
aws iam remove-user-from-group \
  --group-name claude-agents \
  --user-name "claude-agent-${SANITIZED_EMAIL}"
aws iam delete-user --user-name "claude-agent-${SANITIZED_EMAIL}"
```

Also remove the corresponding `.cloud-credentials.<email>.enc` file from the repo.

## Common Policies Reference

| Need | Managed Policy |
|------|---------------|
| Deploy Lambda | `AWSLambda_FullAccess` (or scoped inline) |
| Manage S3 | `AmazonS3FullAccess` (prefer inline with bucket scope) |
| Manage DynamoDB | `AmazonDynamoDBFullAccess` |
| Deploy via CloudFormation | `AWSCloudFormationFullAccess` |
| Manage SQS | `AmazonSQSFullAccess` |
| Manage SNS | `AmazonSNSFullAccess` |
| Read CloudWatch logs | `CloudWatchLogsReadOnlyAccess` |
| Manage API Gateway | `AmazonAPIGatewayAdministrator` |
| Manage ECS/Fargate | `AmazonECS_FullAccess` |
| Manage Secrets Manager | `SecretsManagerReadWrite` |

**Prefer inline policies scoped to specific resources over these broad managed policies.**
