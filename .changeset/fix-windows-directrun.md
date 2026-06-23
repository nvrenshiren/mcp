---
"@dawipong/mcp-pixabay": patch
---

fix(pixabay): 修复 Windows 上 `main()` 不执行的 bug

`isDirectRun` 检查用 `import.meta.url === \`file://${process.argv[1]}\`` 字符串拼接,在 Windows 上路径分隔符不匹配(`import.meta.url` 用正斜杠 + `file:///`,`process.argv[1]` 用反斜杠),导致 `main()` 永远不跑,server 启动后立即退出,客户端连不上。改用 `pathToFileURL(process.argv[1]).href` 跨平台比较。
