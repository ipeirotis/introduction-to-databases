# Permission Escalation

If any cloud API call fails with 403, "access denied", or equivalent:

1. **Stop.** Do not retry or attempt workarounds.
2. Tell the user:
   - The exact error message
   - The specific role or permission needed
   - Why it is needed
3. Ask the user to:
   - Grant the role to the service account
   - Provide a new bootstrap token if IAM changes require it
4. After the user confirms, retry the operation.
5. Update `.cloud-config.json` roles array and the CLAUDE.md Cloud Credentials section to reflect the new role.

**Never modify IAM policies yourself.**
