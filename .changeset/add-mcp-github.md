---
"@dawipong/mcp-github": minor
---

Initial release of `@dawipong/mcp-github` — MCP server wrapping the `gh` CLI. Read-only tools: `gh_pr_view`, `gh_pr_list`, `gh_run_list`, `gh_run_view`, `gh_run_log` (with job/step/grep/head/tail/failed_only filters), `gh_issue_view`, `gh_issue_list`, and `gh_api` (GET/HEAD escape hatch). Uses `execFile` (no shell) for safety. Auth handled entirely by local `gh` keyring — no env vars needed.
