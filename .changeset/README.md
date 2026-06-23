# Changesets

本仓库用 [Changesets](https://github.com/changesets/changesets) 管理版本和 changelog。

## 工作流

1. 改完代码后运行 `pnpm changeset`,选择影响的包和升级类型 (patch/minor/major),写一句变更描述。
2. 提交生成的 `.changeset/*.md` 文件随 PR 一起合并到 master。
3. master 上 CI 会自动:
   - 检测到 changeset → 创建 / 更新 "Version Packages" PR
   - 该 PR 合并后 → 自动 `changeset publish` 发到 npm

详见 [Changesets 文档](https://github.com/changesets/changesets/blob/main/docs/intro-to-using-changesets.md)。
