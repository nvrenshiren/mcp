# @dawipong/mcp-github

[![npm](https://img.shields.io/npm/v/@dawipong/mcp-github.svg)](https://www.npmjs.com/package/@dawipong/mcp-github)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](../../LICENSE)
[![English](https://img.shields.io/badge/lang-English-orange)](README.en.md)

> 把 [`gh` CLI](https://cli.github.com/) 包成 MCP server,让 AI 直接读 GitHub PR / Issue / Actions runs / **workflow 日志**,**结构化 JSON 输出**,read-only 安全。

## ✨ 工具一览

| Tool | 说明 |
|------|------|
| `gh_pr_view` | 查单个 PR 的全部元数据(state / merge / checks / labels / comments) |
| `gh_pr_list` | 列 PR,可按 state / author / label / branch 过滤 |
| `gh_run_list` | 列 workflow runs,可按 workflow / branch / status / event 过滤 |
| `gh_run_view` | 看某次 run 的所有 job + step 状态(找哪一步失败) |
| `gh_run_log` ⭐ | **读 workflow 日志**,支持 job / step / grep / head / tail 过滤 |
| `gh_issue_view` / `gh_issue_list` | issue 等价工具 |
| `gh_api` | 兜底,直接调任意 `gh api <endpoint>`(只允许 GET / HEAD) |

## ⚙️ 前置条件

1. **安装 `gh` CLI** — `scoop install gh` (Win) / `brew install gh` (mac) / `apt install gh` (Linux)
2. **登录** — `gh auth login`,scopes 需要 `repo` + `workflow`(默认勾选就有)

## 🚀 接入 AI 工具

### Claude Desktop

配置文件:
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

### 其他客户端(Windsurf / OpenCode / Codex)

跟上面 JSON 格式一致,放到对应的配置文件即可。**不需要任何环境变量** — auth 全部走本地 `gh` CLI 的 keyring。

## 🛡️ 安全设计

- **read-only** — v0.1 只暴露读操作,**不能** merge / close / comment / push。后续 v0.2 加 write 操作时会有明确确认机制
- **execFile 不走 shell** — 命令通过 `child_process.execFile` 直接调用,**避免命令注入**
- **白名单子命令** — 不暴露通用"运行任意 gh subcommand"的接口,只白名单 `pr` / `run` / `issue` / `api`
- **`gh_api` 只允许 GET/HEAD** — 写 API 操作不能通过这个兜底入口偷偷走

## 📋 详细参数

### `gh_run_log`(重点)

workflow 日志可能几 MB,**必须传过滤参数**:

| 参数 | 说明 |
|------|------|
| `repo` | `owner/name` |
| `run_id` | 从 `gh_run_list` 拿的 `databaseId` |
| `job` | regex,过滤 job 名(case-insensitive) |
| `step` | regex,过滤 step 名 |
| `grep` | regex,在整行上匹配 |
| `head` | 只保留前 N 行(最大 2000) |
| `tail` | 只保留后 N 行(最大 2000) |
| `failed_only` | 用 `gh run view --log-failed`,只看失败的 step |

`head` + `tail` 同时传时,会保留开头 + 结尾两段(类似 `head` + `tail` 拼接)。

日志每行格式:`<jobName>\t<stepName>\t<timestamp> <message>`。

## 💡 典型 AI 使用流程

> "刚 push 那次 release 的 Actions 跑得怎样?"

AI 会:
1. `gh_run_list({ repo: "你/repo", workflow: "release.yml", limit: 1 })` → 拿到 `databaseId` + 总状态
2. 如果 `conclusion === "failure"` → `gh_run_view` 看哪个 job 哪个 step 挂了
3. 针对那个 step 调 `gh_run_log({ ..., job: "step的job名", failed_only: true, tail: 50 })`
4. 把错误原因直接告诉你

**全程不用你打开 GitHub 网页**。

## 🧪 开发 & 调试

```bash
# 仓库根目录
pnpm install

# 包目录
cd packages/github
pnpm dev              # tsx watch
pnpm test             # node --test
pnpm build            # tsc
pnpm inspect          # 用 MCP Inspector 调试
```

## 📄 License

[MIT](../../LICENSE) © nvrenshiren

`gh` CLI 本身由 [GitHub](https://cli.github.com/) 开发并以 MIT 协议开源。
