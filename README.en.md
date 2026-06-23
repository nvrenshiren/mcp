<div align="center">

# mcp

**A collection of MCP (Model Context Protocol) servers for AI assistants**

[![CI](https://github.com/nvrenshiren/mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/nvrenshiren/mcp/actions/workflows/ci.yml)
[![Release](https://github.com/nvrenshiren/mcp/actions/workflows/release.yml/badge.svg)](https://github.com/nvrenshiren/mcp/actions/workflows/release.yml)
[![Node](https://img.shields.io/badge/node-%3E%3D20-3c873a)](https://nodejs.org)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![中文](https://img.shields.io/badge/lang-中文-red)](README.md)

</div>

> A monorepo of small, focused MCP servers that extend AI assistants like Claude and Cursor with extra tools. Each server ships as its own independently versioned npm package.

## ✨ Features

- 📦 **Monorepo** — pnpm workspaces; add a new server by adding a new folder
- 🚀 **Independent releases** — one npm package per server, automated by Changesets
- 🔧 **TypeScript-first** — strict TS, ESM, Node 20+
- 🧪 **CI covered** — typecheck / test / build on every push
- 📜 **Standard MCP** — built on the official `@modelcontextprotocol/sdk` with stdio transport

## 📦 Published servers

| Package | Description | Version |
|---------|-------------|---------|
| [`dawi-mcp-hello`](packages/hello) | Example server — minimal working MCP server | [![npm](https://img.shields.io/npm/v/dawi-mcp-hello.svg)](https://www.npmjs.com/package/dawi-mcp-hello) |

## 🚀 Quick start

### Use in Claude Desktop / Cursor

Add to your MCP config (`claude_desktop_config.json` or the equivalent for your client):

```json
{
  "mcpServers": {
    "hello": {
      "command": "npx",
      "args": ["-y", "dawi-mcp-hello"]
    }
  }
}
```

Restart the client and the `hello` server's tools will appear.

### Local development

```bash
pnpm install
pnpm build
pnpm typecheck
pnpm test
```

## 🏗️ Repository layout

```
mcp/
├── packages/              # one folder per MCP server
│   └── hello/             # example: dawi-mcp-hello
│       ├── src/index.ts
│       ├── package.json
│       └── tsconfig.json
├── .changeset/
├── .github/workflows/
├── tsconfig.base.json
└── package.json
```

## ➕ Add a new server

1. Copy `packages/hello/` → `packages/<your-name>/`
2. Edit `package.json`: `name` → `dawi-mcp-<your-name>`, matching `bin`, new `description`
3. Implement tools in `src/index.ts`
4. Run `pnpm install` so the workspace links resolve
5. Run `pnpm changeset`, commit the resulting file with your PR

## 🧪 Debug with MCP Inspector

```bash
cd packages/hello
pnpm build
npx @modelcontextprotocol/inspector node dist/index.js
```

## 📚 Tech stack

- [Model Context Protocol](https://modelcontextprotocol.io/)
- [@modelcontextprotocol/sdk](https://github.com/modelcontextprotocol/typescript-sdk)
- [pnpm workspaces](https://pnpm.io/workspaces)
- [Changesets](https://github.com/changesets/changesets)
- [TypeScript 5.7](https://www.typescriptlang.org/) + [Zod](https://zod.dev/)

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Bug reports and proposals go in [Issues](https://github.com/nvrenshiren/mcp/issues).

## 📄 License

[MIT](LICENSE) © nvrenshiren

## 🙏 Acknowledgments

- [Anthropic](https://www.anthropic.com/) for designing and open-sourcing MCP
- The MCP community
