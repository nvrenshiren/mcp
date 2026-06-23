---
"@dawipong/mcp-pixabay": patch
---

Read `name` and `version` from `package.json` when instantiating the MCP server, so the values reported to clients always match the published package. Previously the server hardcoded `0.1.0`, which was stale after every release.
