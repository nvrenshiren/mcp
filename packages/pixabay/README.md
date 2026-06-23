# @dawipong/mcp-pixabay

[![npm](https://img.shields.io/npm/v/@dawipong/mcp-pixabay.svg)](https://www.npmjs.com/package/@dawipong/mcp-pixabay)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](../../LICENSE)
[![English](https://img.shields.io/badge/lang-English-orange)](README.en.md)

> 把 [Pixabay API](https://pixabay.com/api/docs/) 接进任何 MCP 客户端 — 让 AI 直接搜免费的图片和视频。

## ✨ 工具一览

| Tool | 说明 |
|------|------|
| `search_images` | 按关键词 / 类型 / 方向 / 分类 / 颜色等条件搜图 |
| `search_videos` | 按关键词 / 视频类型 / 分类等条件搜视频 |
| `get_image`     | 按 Pixabay 数字 ID 取单张图 |
| `get_video`     | 按 Pixabay 数字 ID 取单条视频 |

## 🚀 快速开始

### 1. 拿一个免费 Pixabay API key

到 [pixabay.com](https://pixabay.com/accounts/register/) 注册账号,登录后在 [API 文档页](https://pixabay.com/api/docs/) 顶部能看到你的 key。

### 2. 安装

```bash
# 全局安装(推荐 — 会把 mcp-pixabay 命令注册到 PATH)
npm install -g @dawipong/mcp-pixabay
# 或
pnpm add -g @dawipong/mcp-pixabay

# 不装也行,直接 npx 跑(下面的 AI 工具配置默认走 npx)
npx -y @dawipong/mcp-pixabay --help
```

> 下面所有 AI 工具配置示例都用 `npx -y @dawipong/mcp-pixabay` — **不用先全局安装**。如果你已经全局装,可以把 `npx -y @dawipong/mcp-pixabay` 换成 `mcp-pixabay`。

### 3. 接入 AI 工具

任选你常用的客户端,把对应片段加进配置文件,**把 `your-key-here` 替换成你的 Pixabay API key**,然后**重启客户端**让 MCP server 重新加载。

#### Claude Desktop

配置文件:
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "pixabay": {
      "command": "npx",
      "args": ["-y", "@dawipong/mcp-pixabay"],
      "env": {
        "PIXABAY_API_KEY": "your-key-here"
      }
    }
  }
}
```

#### Cursor

**Settings → Features → Model Context Protocol → Add new global MCP server**,或编辑 `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "pixabay": {
      "command": "npx",
      "args": ["-y", "@dawipong/mcp-pixabay"],
      "env": {
        "PIXABAY_API_KEY": "your-key-here"
      }
    }
  }
}
```

#### Claude Code (CLI)

```bash
claude mcp add pixabay \
  -e PIXABAY_API_KEY=your-key-here \
  -- npx -y @dawipong/mcp-pixabay
```

> 想删:`claude mcp remove pixabay`

#### Windsurf

`~/.codeium/windsurf/mcp_config.json`:

```json
{
  "mcpServers": {
    "pixabay": {
      "command": "npx",
      "args": ["-y", "@dawipong/mcp-pixabay"],
      "env": {
        "PIXABAY_API_KEY": "your-key-here"
      }
    }
  }
}
```

#### OpenCode

配置文件:
- 项目级: `<project>/opencode.json`
- 全局: `~/.config/opencode/config.json`

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "pixabay": {
      "type": "local",
      "command": ["npx", "-y", "@dawipong/mcp-pixabay"],
      "environment": {
        "PIXABAY_API_KEY": "your-key-here"
      }
    }
  }
}
```

#### Codex CLI (OpenAI)

配置文件:`~/.codex/config.toml`(TOML 不是 JSON):

```toml
[mcp_servers.pixabay]
command = "npx"
args = ["-y", "@dawipong/mcp-pixabay"]
env = { PIXABAY_API_KEY = "your-key-here" }
```

或一行命令:

```bash
codex mcp add pixabay --env PIXABAY_API_KEY=your-key-here -- npx -y @dawipong/mcp-pixabay
```

### 4. 用起来

> "帮我找 5 张横构图的山景照片。"

AI 会调用 `search_images`,带上 `q="mountains"`, `image_type="photo"`, `orientation="horizontal"`, `per_page=5`,然后把结果说给你听。

## ⚠️ Pixabay 使用条款要点

| 规则 | 说明 |
|------|------|
| **24h 强制缓存** | 本服务默认对所有 API 响应做 24 小时内存缓存 — 重复查询不消耗速率额度 |
| **图片不能永久 hotlink** | `largeImageURL` 等 URL 只能临时显示;长期使用请下载到自己服务器 |
| **视频可以直接嵌入** | 比图片宽松,但 Pixabay 仍**建议**镜像到自己服务器 |
| **必须标明来源** | 展示搜索结果时要向用户表明这些素材来自 Pixabay |
| **速率限制** | 默认 100 req / 60s,响应头里有 `X-RateLimit-*`;有需要可申请放宽 |
| **禁止系统性批量下载** | API 是给真人交互用的,别拿来爬库 |

完整条款:<https://pixabay.com/service/terms/>

## ⚙️ 环境变量

| 变量 | 必填 | 说明 |
|------|------|------|
| `PIXABAY_API_KEY` | ✅ | 你的 Pixabay API key |

## 📋 参数参考

### `search_images`

| 参数 | 类型 | 备注 |
|------|------|------|
| `q` | string | 搜索词,自动 URL 编码,最长 100 字符 |
| `lang` | enum | `en` / `zh` / `ja` / `de` / ... 共 26 种 |
| `image_type` | enum | `all` / `photo` / `illustration` / `vector` |
| `orientation` | enum | `all` / `horizontal` / `vertical` |
| `category` | enum | `nature`, `business`, `food` 等 20 项 |
| `min_width` / `min_height` | int | 最小像素 |
| `colors` | string[] | `grayscale`, `transparent`, `red`, `orange`, `yellow`, `green`, `turquoise`, `blue`, `lilac`, `pink`, `white`, `gray`, `black`, `brown` 多选 |
| `editors_choice` | bool | 仅 Editor's Choice |
| `safesearch` | bool | 全年龄安全内容 |
| `order` | enum | `popular`(默认) / `latest` |
| `page` | int | 页码,从 1 开始 |
| `per_page` | int | 3–200,默认 20 |

### `search_videos`

与图片相同,去掉 `image_type` / `orientation` / `colors`,新增:

| 参数 | 类型 | 备注 |
|------|------|------|
| `video_type` | enum | `all` / `film` / `animation` |

### `get_image` / `get_video`

| 参数 | 类型 | 备注 |
|------|------|------|
| `id` | int | Pixabay 数字 ID |

## 🔑 关于 Full API Access

Pixabay 默认账号拿不到原图 URL。响应里这几个字段只有**申请通过 Full API Access** 后才会出现:

- `fullHDURL` — 最大边 1920px
- `imageURL` — 原图(完整分辨率)
- `vectorURL` — 矢量原文件(如适用)

本服务会自动透传这些字段,但如果你没申请通过,它们就不会出现 — 这不是 bug。

申请地址在 API 文档页面底部("Request full API access")。

## 🧪 开发 & 调试

```bash
# 仓库根目录装依赖
pnpm install

# 包目录里
cd packages/pixabay
pnpm dev              # tsx watch
pnpm test             # node --test
pnpm build            # tsc

# 用 MCP Inspector 调试
PIXABAY_API_KEY=xxx pnpm inspect
```

## 📄 License

[MIT](../../LICENSE) © nvrenshiren
