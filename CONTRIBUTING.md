# Contributing

感谢愿意贡献。本仓库是面向 AI 的 MCP 服务集合 — 每个服务一个独立 npm 包。

## 开发环境

- Node.js >= 20 (推荐用 `nvm use` 读 `.nvmrc`)
- pnpm >= 9

```bash
git clone https://github.com/nvrenshiren/mcp.git
cd mcp
pnpm install
```

## 常用命令

```bash
pnpm build       # 构建所有服务
pnpm typecheck   # 类型检查
pnpm test        # 跑测试
pnpm changeset   # 起一个 changeset (改完代码必做)
```

## 提交流程

1. **开 issue 或讨论** — 大改动先聊,避免白做
2. **从 `master` 拉新分支** — 命名建议 `feat/<name>` / `fix/<name>` / `docs/<name>`
3. **写代码 + 测试** — 新服务必须有 `src/index.ts`、`package.json`、`README.md`、至少一个测试用例
4. **加 changeset** — `pnpm changeset`,描述用户视角的变更
5. **提 PR** — 用仓库 PR 模板,勾完 checklist

## Commit message 约定

用 [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(hello): add streaming response support
fix(translate): handle empty input gracefully
docs: update README quick start
chore(deps): bump @modelcontextprotocol/sdk to 1.30
```

类型: `feat` / `fix` / `docs` / `refactor` / `test` / `chore` / `ci`。

## 代码风格

- TypeScript 严格模式 — 不要 `any`、不要 `// @ts-ignore`,有特殊情况注释原因
- ESM only — 用 `import` 不用 `require`
- 文件 / 变量命名 kebab-case + camelCase
- 不写多余注释 — 命名表达意图,注释只写"为什么"

## 新增一个 MCP 服务

参考 [README.md#新增一个服务](README.md#-新增一个服务)。命名规则:

- 目录: `packages/<name>/` (短小、kebab-case)
- npm 包名: `dawi-mcp-<name>`
- bin 命令名: 同 npm 包名
- 必须导出 stdio MCP server,入口写在 `src/index.ts`

## 发布

不需要手动 npm publish。流程是:

1. PR 带 changeset 合并到 `master`
2. CI 自动开 / 更新 "Version Packages" PR
3. 合并该 PR 后 release workflow 自动 `pnpm changeset publish` 到 npm

## License

提交即视为同意以 [MIT](LICENSE) 协议授权代码。
