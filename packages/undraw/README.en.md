# @dawipong/mcp-undraw

[![npm](https://img.shields.io/npm/v/@dawipong/mcp-undraw.svg)](https://www.npmjs.com/package/@dawipong/mcp-undraw)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](../../LICENSE)
[![中文](https://img.shields.io/badge/lang-中文-red)](README.md)

> Bring [unDraw](https://undraw.co/)'s 1700+ open-source SVG illustrations into any MCP client — let your AI search by keyword, recolor on the fly, and paste raw SVG straight into HTML/JSX.

## ✨ Tools

| Tool | Description |
|------|-------------|
| `search_illustrations` | Fuzzy-match by title against the local catalog — zero-latency after first fetch |
| `get_svg` | Fetch SVG by slug, optionally recolor, automatically disk-cached |

## 🚀 Quick start

**No API key required** — works out of the box.

### 1. Install

```bash
# Global
npm install -g @dawipong/mcp-undraw

# Or run via npx
npx -y @dawipong/mcp-undraw
```

### 2. Wire it into your AI client

#### Claude Desktop

Config file:
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

Same JSON pattern as above, dropped into the matching config file.

### 3. Use it

> "Find me a dashboard illustration, recolored to `#ff6600`"

The AI will:
1. Call `search_illustrations({ q: "dashboard" })` to surface candidates
2. Pick a slug, call `get_svg({ slug: "dashboard-overview_xyz", color: "#ff6600" })`
3. Return the SVG text — paste-ready for your project

## 🧠 How it works

```
First run:
  No local catalog → fetch all 43 pages from undraw.co (~6s)
  → write ~/.cache/mcp-undraw/catalog.json

Every subsequent call:
  ├─ Catalog cached < 60s ago → use in-memory
  └─ Otherwise:
       GET undraw.co/illustrations (1 request, parse __NEXT_DATA__)
       ├─ buildId AND first illustration _id match local → keep local
       └─ either differs → full refetch
```

**SVG content** is fetched from `cdn.undraw.co` (no robots restrictions there) and cached on disk at `~/.cache/mcp-undraw/svgs/` — each illustration is downloaded exactly once per machine.

## 🎨 Color customization

All unDraw illustrations share the same primary purple `#6c63ff`. The `color` parameter on `get_svg` replaces every occurrence of that hex in the SVG:

```
get_svg({ slug: "code-thinking_tqs9", color: "#22c55e" })
```

The accent palette (greys, darker purples) stays untouched.

Accepted color formats:
- `#ff6600` / `ff6600` (the `#` is optional)
- `#f60` / `f60` (3-digit shorthand auto-expanded)

## ⚙️ Environment variables (optional)

| Variable | Default | Description |
|----------|---------|-------------|
| `UNDRAW_CACHE_DIR` | `~/.cache/mcp-undraw` | Where catalog and SVGs are cached |
| `UNDRAW_USER_AGENT` | `@dawipong/mcp-undraw/<ver> (...)` | Override the request UA |

## 🤝 unDraw usage terms

All unDraw illustrations are released under an **MIT-style open license** — free for commercial and personal use, attribution not required (though appreciated).

Full license: <https://undraw.co/license>

This server's behaviour:
- **Does not** touch undraw.co's `_next/data/*.json` endpoints (which are robots-disallowed)
- Only reads `Allow: /illustrations/*` pages
- SVGs go through `cdn.undraw.co` (no robots restrictions)
- In-process 60-second throttle keeps upstream traffic minimal

## 🔬 Smart catalog sync

The big idea: **catalog always tracks upstream undraw without depending on npm release frequency**.

| Scenario | Behaviour |
|----------|-----------|
| undraw adds new illustrations | Next tool call detects the first-item drift → automatic full refetch |
| undraw redeploys (buildId changes) | Same — automatic refetch |
| Nothing changed upstream for a week | Throttled to 60s memory cache, local catalog reused |
| Network is down | Falls back to local cache, tools keep working |

So `npx -y @dawipong/mcp-undraw@latest` always sees the freshest catalog — the maintainer (me) never needs to publish a new npm version just because unDraw added a few illustrations.

## 🧪 Development

```bash
# From repo root
pnpm install

# In this package
cd packages/undraw
pnpm dev              # tsx watch
pnpm test             # node --test
pnpm build            # tsc
pnpm inspect          # MCP Inspector
```

## 📄 License

[MIT](../../LICENSE) © nvrenshiren

unDraw illustrations themselves are released under their own [open license](https://undraw.co/license).
