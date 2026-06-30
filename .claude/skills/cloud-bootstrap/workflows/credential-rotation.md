# Credential Rotation

Use this when credentials need to be replaced (e.g., age warning, suspected compromise, policy requirement). This replaces the current user's encrypted key without affecting other team members.

1. Read `.cloud-config.json` to determine the provider. Read the provider reference file.
2. Ask the user for a bootstrap token (same as during setup).

> **Order matters: create and verify the replacement BEFORE revoking the old key.**
> For routine rotations, never delete the current provider-side key first. If the
> create/encrypt/commit step then fails (bootstrap token expired, passphrase
> missing, provider error), the committed encrypted credential would point at a
> revoked key and lock the user out until they repeat privileged onboarding.
> **Exception:** for a suspected/known compromise, revoke the old key immediately
> (skip to step 6 first), accepting the brief lockout, since containment wins.

3. **Record the OLD key identifier first**, before creating or overwriting anything. The old key id often lives only in the current credential material, so capture it now or it becomes unrecoverable once the `.enc` is replaced:
   - **GCP:** decrypt the existing `ENC_FILE` and read `OLD_KEY_ID=$(... | jq -r .private_key_id)` (or list keys via "Key Management" and note the current one).
   - **AWS:** `OLD_KEY_ID` is the existing `access_key_id` (decrypt the current `ENC_FILE` to read it).
   - **Azure:** list the app's existing secret `keyId`s now (see "Secret Management") and note which one to remove.
   Save it as `OLD_KEY_ID` for the revoke step.
4. Create a **new key** using the same commands as the "Create Key" / "Create Access Key" / "Add Client Secret" section in the provider reference.
   - **AWS caveat:** the add-team-member snippet calls `aws iam create-user` first, but during rotation the user already exists, so that call errors. For an AWS rotation, **skip `create-user`/`add-user-to-group`** and only create a new access key for the existing user:
     ```bash
     SANITIZED_EMAIL=$(echo "$(git config user.email)" | sed 's/[@.]/-/g')
     aws iam create-access-key --user-name "claude-agent-${SANITIZED_EMAIL}" > credentials.json
     # then reformat (access_key_id/secret_access_key/region) as in aws.md
     ```
     (AWS allows up to 2 access keys per user, so the new key can be created before the old one is revoked in step 9.)
5. Verify the new key works (run the provider's "Verify (Smoke Test)") before touching the old one.
6. Re-encrypt with the user's passphrase. Use the multi-provider naming convention if the config has a `providers` array:
   ```bash
   USER_EMAIL=$(git config user.email)
   if jq -e '.providers' .cloud-config.json >/dev/null 2>&1; then
     # PROVIDER must already be set from step 1 (read from .cloud-config.json)
     if [ -z "$PROVIDER" ] || [ "$PROVIDER" = "null" ]; then
       echo "ERROR: Could not determine provider for credential filename."
       exit 1
     fi
     ENC_FILE=".cloud-credentials.${PROVIDER}.${USER_EMAIL}.enc"
   else
     PROVIDER=$(jq -r .provider .cloud-config.json 2>/dev/null)
     ENC_FILE=".cloud-credentials.${USER_EMAIL}.enc"
   fi
   echo "$KEY" | openssl enc -aes-256-cbc -pbkdf2 -salt \
     -pass stdin \
     -in credentials.json -out "$ENC_FILE"
   rm -f credentials.json
   ```
   **Note:** `PROVIDER` is derived in step 1 when reading `.cloud-config.json`. In single-provider mode it comes from the top-level `provider` field; in multi-provider mode it is the specific provider whose credentials are being rotated.
7. **Do not reset the shared top-level `created_at`** in `.cloud-config.json` — that field is repo-wide, so bumping it makes every other team member's still-old `.cloud-credentials.*.enc` look freshly rotated and suppresses their 180-day age warning. Credential age is tracked **per file** via each `.enc` file's git commit time (the Authenticate age check uses that), so committing the rotated file in the next step updates only this user's age. (If you maintain optional per-file age metadata, update only this credential's entry — never the shared timestamp.)
8. Commit the updated encrypted credentials file.
9. **Now revoke the OLD key on the provider side** using the `OLD_KEY_ID` captured in step 3 (only after the replacement is verified and committed):
   - **GCP:** List keys (see "Key Management" in gcp.md), identify the current user's *previous* key, delete it.
   - **AWS:** Delete the old access key: `aws iam delete-access-key --user-name "claude-agent-${SANITIZED_EMAIL}" --access-key-id OLD_KEY_ID`
   - **Azure:** Remove the *previous* client secret (see "Secret Management" in azure.md).
