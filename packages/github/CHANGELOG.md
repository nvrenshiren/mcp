# @dawipong/mcp-github

## 0.2.1

### Patch Changes

- b7931b5: Trim README of internals-focused sections so the published npm pages stay focused on user-facing setup and usage:

  - `@dawipong/mcp-undraw`: drop "工作原理" and "智能 catalog 同步策略" sections from the Chinese README.
  - `@dawipong/mcp-github`: drop "Why this exists" / "为什么写它" from both Chinese and English READMEs.

## 0.2.0

### Minor Changes

- 0bbeea7: Initial release of `@dawipong/mcp-github` — MCP server wrapping the `gh` CLI. Read-only tools: `gh_pr_view`, `gh_pr_list`, `gh_run_list`, `gh_run_view`, `gh_run_log` (with job/step/grep/head/tail/failed_only filters), `gh_issue_view`, `gh_issue_list`, and `gh_api` (GET/HEAD escape hatch). Uses `execFile` (no shell) for safety. Auth handled entirely by local `gh` keyring — no env vars needed.
