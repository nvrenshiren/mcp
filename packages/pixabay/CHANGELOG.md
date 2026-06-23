# @dawipong/mcp-pixabay

## 0.2.4

### Patch Changes

- 8667fd2: fix(pixabay): 修复 Windows 上 `main()` 不执行的 bug

  `isDirectRun` 检查用 `import.meta.url === \`file://${process.argv[1]}\`` 字符串拼接,在 Windows 上路径分隔符不匹配(`import.meta.url`用正斜杠 +`file:///`,`process.argv[1]`用反斜杠),导致`main()`永远不跑,server 启动后立即退出,客户端连不上。改用`pathToFileURL(process.argv[1]).href` 跨平台比较。

## 0.2.3

### 补丁更新

- e6fb1e0: 实例化 MCP server 时从 `package.json` 读取 `name` 和 `version`,确保向客户端自报的值跟发布的包一致。之前硬编码 `0.1.0`,每次发版后都会过时。

## 0.2.2

### 补丁更新

- 8e25801: 重构 README:删掉根 README 的「快速开始」一节(下沉到各包),扩充包级快速开始,加上 npm/pnpm/npx 安装命令 + 6 个主流 AI 工具配置(Claude Desktop、Cursor、Claude Code CLI、Windsurf、OpenCode、Codex CLI)。纯文档改动,无代码或 API 变更。

## 0.2.1

### 补丁更新

- ce332eb: 在精简的图片/视频响应里补上 `comments` 字段(之前漏掉了)。

## 0.2.0

### 小版本更新

- bca7a6c: 首次发布 `@dawipong/mcp-pixabay` —— 接入 Pixabay 免费图片/视频 API 的 MCP server。提供工具 `search_images`、`search_videos`、`get_image`、`get_video`。按 Pixabay ToS 要求内置 24 小时强制响应缓存。
