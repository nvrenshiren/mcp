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
| [`@dawipong/mcp-pixabay`](packages/pixabay) | Search free images & videos via the [Pixabay API](https://pixabay.com/api/docs/) | [![npm](https://img.shields.io/npm/v/@dawipong/mcp-pixabay.svg)](https://www.npmjs.com/package/@dawipong/mcp-pixabay) |
| [`@dawipong/mcp-undraw`](packages/undraw) | Fetch [unDraw](https://undraw.co/)'s 1700+ open-source SVG illustrations, with recoloring; no API key needed | [![npm](https://img.shields.io/npm/v/@dawipong/mcp-undraw.svg)](https://www.npmjs.com/package/@dawipong/mcp-undraw) |

## 🏗️ Repository layout

```
mcp/
├── packages/              # one folder per MCP server
│   └── pixabay/           # @dawipong/mcp-pixabay
│       ├── src/index.ts
│       ├── package.json
│       └── tsconfig.json
├── .changeset/
├── .github/workflows/
├── tsconfig.base.json
└── package.json
```

## ➕ Add a new server

1. Copy `packages/pixabay/` → `packages/<your-name>/`
2. Edit `package.json`: `name` → `@dawipong/mcp-<your-name>`, `bin` → `mcp-<your-name>`, new `description`
3. Implement tools in `src/index.ts`
4. Run `pnpm install` so the workspace links resolve
5. Run `pnpm changeset`, commit the resulting file with your PR

## 🧪 Debug with MCP Inspector

```bash
cd packages/pixabay
PIXABAY_API_KEY=xxx pnpm inspect
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
