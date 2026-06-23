# @dawipong/mcp-pixabay

[![npm](https://img.shields.io/npm/v/@dawipong/mcp-pixabay.svg)](https://www.npmjs.com/package/@dawipong/mcp-pixabay)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](../../LICENSE)
[![中文](https://img.shields.io/badge/lang-中文-red)](README.md)

> Bring the [Pixabay API](https://pixabay.com/api/docs/) into any MCP client — let your AI search free, royalty-free images and videos directly.

## ✨ Tools

| Tool | Description |
|------|-------------|
| `search_images` | Search images by query, type, orientation, category, color, etc. |
| `search_videos` | Search videos by query, video type, category, etc. |
| `get_image`     | Fetch one image by its Pixabay numeric ID |
| `get_video`     | Fetch one video by its Pixabay numeric ID |

## 🚀 Quick start

### 1. Get a free Pixabay API key

Sign up at [pixabay.com](https://pixabay.com/accounts/register/). After logging in, your key is shown at the top of the [API docs page](https://pixabay.com/api/docs/).

### 2. Install

```bash
# Global install (recommended — adds `mcp-pixabay` to your PATH)
npm install -g @dawipong/mcp-pixabay
# or
pnpm add -g @dawipong/mcp-pixabay

# Or skip the install and run directly via npx (used in the configs below)
npx -y @dawipong/mcp-pixabay --help
```

> Every config snippet below uses `npx -y @dawipong/mcp-pixabay`, so you don't need a global install. If you did install globally, swap `npx -y @dawipong/mcp-pixabay` for `mcp-pixabay`.

### 3. Wire it into your AI client

Pick your client, paste the matching snippet into its config file, **replace `your-key-here` with your Pixabay API key**, then **restart the client** so the MCP server reloads.

#### Claude Desktop

Config file:
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

**Settings → Features → Model Context Protocol → Add new global MCP server**, or edit `~/.cursor/mcp.json`:

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

> To remove: `claude mcp remove pixabay`

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

Config file:
- project: `<project>/opencode.json`
- global: `~/.config/opencode/config.json`

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

Config file: `~/.codex/config.toml` (TOML, not JSON):

```toml
[mcp_servers.pixabay]
command = "npx"
args = ["-y", "@dawipong/mcp-pixabay"]
env = { PIXABAY_API_KEY = "your-key-here" }
```

Or via one-liner:

```bash
codex mcp add pixabay --env PIXABAY_API_KEY=your-key-here -- npx -y @dawipong/mcp-pixabay
```

### 4. Use it

> "Find me 5 horizontal mountain photos."

The AI will call `search_images` with `q="mountains"`, `image_type="photo"`, `orientation="horizontal"`, `per_page=5` and surface the results.

## ⚠️ Pixabay Terms of Service — key points

| Rule | Detail |
|------|--------|
| **24h cache mandated** | This server caches every API response in-memory for 24h — repeated queries don't burn rate limit. |
| **No permanent image hot-linking** | URLs like `largeImageURL` are for temporary display; download to your own server for lasting use. |
| **Videos may be embedded** | More lenient than images — you can hot-link, though Pixabay still recommends mirroring. |
| **Credit Pixabay** | When displaying results, show the user that the assets come from Pixabay. |
| **Rate limit** | 100 requests / 60s by default; response headers expose `X-RateLimit-*`. Higher limits available on request. |
| **No mass scraping** | The API is for real human interactions, not automated bulk downloads. |

Full ToS: <https://pixabay.com/service/terms/>

## ⚙️ Environment

| Variable | Required | Description |
|----------|----------|-------------|
| `PIXABAY_API_KEY` | yes | Your Pixabay API key |

## 📋 Parameter reference

### `search_images`

| Param | Type | Notes |
|-------|------|-------|
| `q` | string | Query, URL-encoded automatically. Max 100 chars. |
| `lang` | enum | `en` / `zh` / `ja` / `de` / ... (26 langs) |
| `image_type` | enum | `all` / `photo` / `illustration` / `vector` |
| `orientation` | enum | `all` / `horizontal` / `vertical` |
| `category` | enum | `nature`, `business`, `food`, ... (20 options) |
| `min_width` / `min_height` | int | Minimum size in px |
| `colors` | string[] | Any of: `grayscale`, `transparent`, `red`, `orange`, `yellow`, `green`, `turquoise`, `blue`, `lilac`, `pink`, `white`, `gray`, `black`, `brown` |
| `editors_choice` | bool | Editor's Choice only |
| `safesearch` | bool | Family-safe content only |
| `order` | enum | `popular` (default) / `latest` |
| `page` | int | 1-based page number |
| `per_page` | int | 3–200, default 20 |

### `search_videos`

Same as images, minus `image_type` / `orientation` / `colors`, plus:

| Param | Type | Notes |
|-------|------|-------|
| `video_type` | enum | `all` / `film` / `animation` |

### `get_image` / `get_video`

| Param | Type | Notes |
|-------|------|-------|
| `id` | int | Pixabay numeric ID |

## 🔑 Full API Access

By default Pixabay does **not** return original-resolution image URLs. These response fields only appear once your account is approved for **Full API Access**:

- `fullHDURL` — max edge 1920px
- `imageURL` — original (full resolution)
- `vectorURL` — vector source (when applicable)

This server passes those fields through automatically. If you haven't been approved, they won't appear — that's expected, not a bug.

Apply via the "Request full API access" link at the bottom of the API docs page.

## 🧪 Development

```bash
# from repo root
pnpm install

# in this package
cd packages/pixabay
pnpm dev              # tsx watch
pnpm test             # node --test
pnpm build            # tsc

# debug interactively
PIXABAY_API_KEY=xxx pnpm inspect
```

## 📄 License

[MIT](../../LICENSE) © nvrenshiren
