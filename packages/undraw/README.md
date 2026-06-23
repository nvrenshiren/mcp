# @dawipong/mcp-undraw

[![npm](https://img.shields.io/npm/v/@dawipong/mcp-undraw.svg)](https://www.npmjs.com/package/@dawipong/mcp-undraw)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](../../LICENSE)
[![English](https://img.shields.io/badge/lang-English-orange)](README.en.md)

> 把 [unDraw](https://undraw.co/) 1700+ 张开源 SVG 插画接进任何 MCP 客户端 — AI 可以按关键词搜图、自定义颜色、直接拿到 SVG 文本贴进你的 HTML/JSX。

## ✨ 工具一览

| Tool | 说明 |
|------|------|
| `search_illustrations` | 按 title 关键词模糊搜索,本地查询零延迟 |
| `get_svg` | 按 slug 拿 SVG 内容,可选自定义主色,自动磁盘缓存 |

## 🚀 快速开始

**不需要任何 API key** — 直接接入即用。

### 1. 安装

```bash
# 全局安装
npm install -g @dawipong/mcp-undraw

# 或不装直接 npx
npx -y @dawipong/mcp-undraw
```

### 2. 接入 AI 工具

#### Claude Desktop

配置文件:
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "undraw": {
      "command": "npx",
      "args": ["-y", "@dawipong/mcp-undraw@latest"]
    }
  }
}
```

#### Cursor

`~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "undraw": {
      "command": "npx",
      "args": ["-y", "@dawipong/mcp-undraw@latest"]
    }
  }
}
```

#### Claude Code (CLI)

```bash
claude mcp add undraw -- npx -y @dawipong/mcp-undraw@latest
```

#### Windsurf / OpenCode / Codex

跟上面的 JSON 配置一样,放进对应配置文件即可。

### 3. 用起来

> "帮我找一张 dashboard 主题的插画,主色换成 `#ff6600`"

AI 会:
1. 调 `search_illustrations({ q: "dashboard" })` → 拿到一堆候选
2. 挑一个 slug,调 `get_svg({ slug: "dashboard-overview_xyz", color: "#ff6600" })`
3. 返回的 SVG 字符串可以直接复制粘贴进你的项目

## 🧠 工作原理

```
首次启动:
  本地无 catalog → 拉 undraw.co 全部 43 页 (~6 秒) → 写本地 ~/.cache/mcp-undraw/catalog.json

后续每次调用:
  ├─ 60 秒内有 catalog → 直接用内存中的 catalog
  └─ 超过 60 秒:
       GET undraw.co/illustrations (1 个请求,解析 __NEXT_DATA__)
       ├─ buildId + 第 1 张图 _id 都一致 → 继续用本地
       └─ 任一不一致 → 全量重拉
```

**SVG 内容** 走 `cdn.undraw.co`(robots.txt 完全无限制),磁盘缓存到 `~/.cache/mcp-undraw/svgs/`,每张图终身只下载一次。

## 🎨 颜色自定义

unDraw 所有插画的主色是统一的紫色 `#6c63ff`。`get_svg` 的 `color` 参数会全文 string-replace 这个色值。例如:

```
get_svg({ slug: "code-thinking_tqs9", color: "#22c55e" })
```

返回的 SVG 里所有 `#6c63ff` 都换成 `#22c55e`,辅助色(灰/深紫)保持不变。

支持的格式:
- `#ff6600` / `ff6600`(都行,`#` 可省)
- `#f60` / `f60`(3 位简写自动展开)

## ⚙️ 环境变量(可选)

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `UNDRAW_CACHE_DIR` | `~/.cache/mcp-undraw` | catalog 和 SVG 缓存目录 |
| `UNDRAW_USER_AGENT` | `@dawipong/mcp-undraw/<ver> (...)` | 自定义 UA |

## 🤝 关于 unDraw 的使用条款

unDraw 的所有插画都是 **MIT-style 开放 license**:免费商用、个人项目随便用、无需归属(Attribution 不强制但欢迎)。

完整 license:<https://undraw.co/license>

本服务的实现:
- **不访问** undraw.co 被 robots.txt 禁止的 `_next/data/*.json` 端点
- 只读 `Allow: /illustrations/*` 范围内的页面
- SVG 走 `cdn.undraw.co`(无 robots 限制)
- 进程内 60 秒节流,避免对源站频繁打扰

## 🔬 智能 catalog 同步策略

最大的特点:**catalog 永远跟随 undraw 上游,但不依赖 npm 发版频率**。

| 场景 | 行为 |
|------|------|
| undraw 加了几张新图 | 你下次调任何工具时,本地探测到 first item 变了 → 自动全量重拉 |
| undraw 重新部署(buildId 变) | 同上,自动重拉 |
| catalog 一周没变化 | 60 秒内不重复查,正常用本地 |
| 网络挂了 | 自动降级用本地缓存,不阻塞工具 |

意味着 **`npx -y @dawipong/mcp-undraw@latest` 永远拿到最新插画**,我作者不需要为内容更新发新 npm 版本。

## 🧪 开发 & 调试

```bash
# 仓库根目录
pnpm install

# 包目录
cd packages/undraw
pnpm dev              # tsx watch
pnpm test             # node --test
pnpm build            # tsc
pnpm inspect          # 用 MCP Inspector 调试
```

## 📄 License

[MIT](../../LICENSE) © nvrenshiren

unDraw illustrations themselves are released under their own [open license](https://undraw.co/license).
