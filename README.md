<div align="center">

# mcp

**面向 AI 助手的 MCP (Model Context Protocol) 服务集合**

[![CI](https://github.com/nvrenshiren/mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/nvrenshiren/mcp/actions/workflows/ci.yml)
[![Release](https://github.com/nvrenshiren/mcp/actions/workflows/release.yml/badge.svg)](https://github.com/nvrenshiren/mcp/actions/workflows/release.yml)
[![Node](https://img.shields.io/badge/node-%3E%3D20-3c873a)](https://nodejs.org)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![English](https://img.shields.io/badge/lang-English-orange)](README.en.md)

</div>

> 一个 monorepo,装着一组小而专的 MCP 服务,给 Claude、Cursor 等 AI 助手扩展能力用。每个服务独立打包、独立发布到 npm。

## ✨ 特性

- 📦 **Monorepo** — pnpm workspaces 管理,新增服务只需新建子目录
- 🚀 **独立发布** — 每个服务一个 npm 包,通过 Changesets 自动化版本与发布
- 🔧 **TypeScript 优先** — 严格 TS、ESM、Node 20+
- 🧪 **CI 全覆盖** — typecheck / test / build 全自动
- 📜 **标准 MCP** — 基于官方 `@modelcontextprotocol/sdk`,stdio 传输,即插即用

## 📦 已发布的服务

| 包名 | 说明 | 版本 |
|------|------|------|
| [`@dawipong/mcp-pixabay`](packages/pixabay) | 调 [Pixabay API](https://pixabay.com/api/docs/) 搜免费图片/视频 | [![npm](https://img.shields.io/npm/v/@dawipong/mcp-pixabay.svg)](https://www.npmjs.com/package/@dawipong/mcp-pixabay) |

## 🏗️ 仓库结构

```
mcp/
├── packages/              # 所有 MCP 服务,一个目录一个服务
│   └── pixabay/           # @dawipong/mcp-pixabay
│       ├── src/index.ts   # MCP server 入口
│       ├── package.json   # 独立 npm 包元信息
│       └── tsconfig.json
├── .changeset/            # Changesets 版本管理
├── .github/workflows/     # CI / Release pipeline
├── tsconfig.base.json     # 所有子包共享的 TS 配置
└── package.json           # workspace root
```

## ➕ 新增一个服务

1. 复制 `packages/pixabay/` 改名,例如 `packages/translate/`
2. 改 `package.json`:`name` 设成 `@dawipong/mcp-translate`,`bin` 设成 `mcp-translate`,`description` 改掉
3. 在 `src/index.ts` 写你的工具
4. 跑 `pnpm install` 让 workspace 链接生效
5. `pnpm changeset` 起一次 changeset,提交 PR

## 🧪 测试 & 调试

```bash
# 单包构建后用 MCP Inspector 调试
cd packages/pixabay
PIXABAY_API_KEY=xxx pnpm inspect
```

## 📚 技术栈

- [Model Context Protocol](https://modelcontextprotocol.io/) — Anthropic 提出的 AI 工具协议
- [@modelcontextprotocol/sdk](https://github.com/modelcontextprotocol/typescript-sdk) — 官方 TS SDK
- [pnpm workspaces](https://pnpm.io/workspaces) — Monorepo 包管理
- [Changesets](https://github.com/changesets/changesets) — 版本与发布自动化
- [TypeScript 5.7](https://www.typescriptlang.org/) + [Zod](https://zod.dev/) — 类型与运行时校验

## 🤝 参与贡献

参见 [CONTRIBUTING.md](CONTRIBUTING.md)。Bug 报告与新服务提案请用 [Issues](https://github.com/nvrenshiren/mcp/issues)。

## 📄 License

[MIT](LICENSE) © nvrenshiren

## 🙏 致谢

- [Anthropic](https://www.anthropic.com/) — 设计并开源了 MCP 协议
- 所有 MCP 社区贡献者
