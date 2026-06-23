# dawi-mcp-hello

[![npm](https://img.shields.io/npm/v/dawi-mcp-hello.svg)](https://www.npmjs.com/package/dawi-mcp-hello)
[![npm downloads](https://img.shields.io/npm/dm/dawi-mcp-hello.svg)](https://www.npmjs.com/package/dawi-mcp-hello)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](../../LICENSE)

> 一个最小可用的 MCP 服务,作为模板和参考实现。新增服务时直接复制这个包改名。

## 提供的工具

| 工具 | 说明 |
|------|------|
| `greet` | 给指定名字打招呼 |
| `echo`  | 原样返回输入内容 |

## 安装与使用

### Claude Desktop / Cursor

在 MCP 配置里加:

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

重启客户端,问 AI:`让 hello 服务跟我打个招呼,我叫小明`。

### 全局安装

```bash
npm install -g dawi-mcp-hello
dawi-mcp-hello   # 直接启动 stdio 服务,用 MCP 客户端连接
```

## 用 Inspector 调试

```bash
npx @modelcontextprotocol/inspector npx -y dawi-mcp-hello
```

## 本地开发

```bash
# 在仓库根目录
pnpm install
pnpm --filter dawi-mcp-hello dev   # tsx watch
pnpm --filter dawi-mcp-hello test
pnpm --filter dawi-mcp-hello build
```

## 作为模板新增服务

```bash
cp -r packages/hello packages/your-name
# 编辑 packages/your-name/package.json:
#   name        → dawi-mcp-your-name
#   bin 的 key  → dawi-mcp-your-name
#   description → 你的描述
# 编辑 src/index.ts,改 server name + 注册你的工具
pnpm install
```

## License

[MIT](../../LICENSE)
