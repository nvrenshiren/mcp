# @dawipong/mcp-github

[![npm](https://img.shields.io/npm/v/@dawipong/mcp-github.svg)](https://www.npmjs.com/package/@dawipong/mcp-github)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](../../LICENSE)
[![中文](https://img.shields.io/badge/lang-中文-red)](README.md)

> Wraps the [`gh` CLI](https://cli.github.com/) as an MCP server — let your AI read GitHub PRs / Issues / Actions runs / **workflow logs** with **structured JSON output**, read-only by design.

## Why this exists

I (Claude) scoped this myself after running into it repeatedly: without this MCP, looking up PR state or workflow logs meant scraping the GitHub web UI (a SPA, frequently returns stale/wrong data). This MCP lets the AI stop pestering you with "what failed in step N of run X?" — it can just look.

## ✨ Tools

| Tool | Description |
|------|-------------|
| `gh_pr_view` | Full metadata for one PR (state / merge / checks / labels / comments) |
| `gh_pr_list` | List PRs filtered by state / author / label / branch |
| `gh_run_list` | List workflow runs filtered by workflow / branch / status / event |
| `gh_run_view` | Show every job + step of one run (find which step failed) |
| `gh_run_log` ⭐ | **Read workflow logs** with job / step / grep / head / tail filters |
| `gh_issue_view` / `gh_issue_list` | Issue equivalents |
| `gh_api` | Escape hatch — call any `gh api <endpoint>` (GET / HEAD only) |

## ⚙️ Prerequisites

1. **Install `gh`** — `scoop install gh` (Win) / `brew install gh` (mac) / `apt install gh` (Linux)
2. **Login** — `gh auth login`, scopes need `repo` + `workflow` (defaults cover both)

## 🚀 Wire into your AI client

### Claude Desktop

Config file:
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@dawipong/mcp-github@latest"]
    }
  }
}
```

### Cursor

`~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@dawipong/mcp-github@latest"]
    }
  }
}
```

### Claude Code (CLI)

```bash
claude mcp add github -- npx -y @dawipong/mcp-github@latest
```

### Other clients (Windsurf / OpenCode / Codex)

Same JSON pattern as above. **No environment variables needed** — auth goes through your local `gh` CLI keyring.

## 🛡️ Security design

- **Read-only** — v0.1 only exposes read operations: no merge / close / comment / push. Future v0.2 may add write ops with explicit confirmation gates
- **`execFile`, no shell** — commands invoked via `child_process.execFile`, **preventing command injection**
- **Whitelisted subcommands** — no generic "run any gh subcommand" interface; only `pr` / `run` / `issue` / `api` are exposed
- **`gh_api` is GET/HEAD only** — write API calls can't sneak in via the escape hatch

## 📋 Parameter reference

### `gh_run_log` (the key feature)

Workflow logs can be megabytes — **always pass at least one filter**:

| Param | Description |
|-------|-------------|
| `repo` | `owner/name` |
| `run_id` | `databaseId` from `gh_run_list` |
| `job` | Regex, filter by job name (case-insensitive) |
| `step` | Regex, filter by step name |
| `grep` | Regex, match against whole line |
| `head` | Keep only first N lines (max 2000) |
| `tail` | Keep only last N lines (max 2000) |
| `failed_only` | Use `gh run view --log-failed`, only failed steps |

When both `head` and `tail` are set, both ends are kept (like `head` + `tail` concatenated).

Each line is formatted: `<jobName>\t<stepName>\t<timestamp> <message>`.

## 💡 Typical AI workflow

> "How did that release run I just pushed go?"

The AI will:
1. `gh_run_list({ repo: "you/repo", workflow: "release.yml", limit: 1 })` → get `databaseId` + status
2. If `conclusion === "failure"` → `gh_run_view` to find which job's which step failed
3. Pull `gh_run_log({ ..., job: "...", failed_only: true, tail: 50 })`
4. Report the actual error back to you

**You never have to open the GitHub web UI.**

## 🧪 Development

```bash
# From repo root
pnpm install

# In this package
cd packages/github
pnpm dev              # tsx watch
pnpm test             # node --test
pnpm build            # tsc
pnpm inspect          # MCP Inspector
```

## 📄 License

[MIT](../../LICENSE) © nvrenshiren

The `gh` CLI itself is developed by [GitHub](https://cli.github.com/) and released under MIT.
