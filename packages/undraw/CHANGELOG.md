# @dawipong/mcp-undraw

## 0.2.1

### Patch Changes

- b7931b5: Trim README of internals-focused sections so the published npm pages stay focused on user-facing setup and usage:

  - `@dawipong/mcp-undraw`: drop "工作原理" and "智能 catalog 同步策略" sections from the Chinese README.
  - `@dawipong/mcp-github`: drop "Why this exists" / "为什么写它" from both Chinese and English READMEs.

## 0.2.0

### Minor Changes

- 0c1a789: Initial release of `@dawipong/mcp-undraw` — MCP server for searching and fetching free SVG illustrations from [unDraw](https://undraw.co/). Tools: `search_illustrations`, `get_svg`. Auto-syncs catalog with upstream via Next.js buildId + first-item drift detection, no API key required, in-memory 60s throttle, disk-cached SVGs, optional hex recoloring.
