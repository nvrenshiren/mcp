# @dawipong/mcp-pixabay

## 0.2.3

### Patch Changes

- e6fb1e0: Read `name` and `version` from `package.json` when instantiating the MCP server, so the values reported to clients always match the published package. Previously the server hardcoded `0.1.0`, which was stale after every release.

## 0.2.2

### Patch Changes

- 8e25801: Restructure READMEs: drop the quick-start section from the root READMEs (moved into each package) and expand the package quick start to cover npm/pnpm/npx install + configs for 6 mainstream AI tools (Claude Desktop, Cursor, Claude Code CLI, Windsurf, OpenCode, Codex CLI). Docs-only — no code or API changes.

## 0.2.1

### Patch Changes

- ce332eb: Include `comments` count in compact image/video responses (previously omitted).

## 0.2.0

### Minor Changes

- bca7a6c: Initial release of `@dawipong/mcp-pixabay` — MCP server for the Pixabay free image/video API. Tools: `search_images`, `search_videos`, `get_image`, `get_video`. Includes mandatory 24-hour response cache per Pixabay ToS.
