#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { GhCliError, ghJson, ghText } from "./gh.js";
import { filterLogs } from "./logs.js";

const pkg = JSON.parse(
  readFileSync(fileURLToPath(new URL("../package.json", import.meta.url)), "utf8"),
) as { name: string; version: string };

const RepoSchema = z
  .string()
  .regex(/^[A-Za-z0-9][A-Za-z0-9._-]*\/[A-Za-z0-9][A-Za-z0-9._-]*$/, "Format: owner/repo");

const PR_VIEW_FIELDS =
  "number,title,body,state,isDraft,author,baseRefName,headRefName,headRefOid,mergedAt,mergedBy,closedAt,createdAt,updatedAt,url,labels,reviewDecision,statusCheckRollup,comments,additions,deletions,changedFiles";

const PR_LIST_FIELDS =
  "number,title,state,isDraft,author,headRefName,createdAt,updatedAt,mergedAt,url,labels";

const RUN_LIST_FIELDS =
  "databaseId,name,displayTitle,event,status,conclusion,headSha,headBranch,workflowName,createdAt,updatedAt,startedAt,url";

const RUN_VIEW_FIELDS =
  "databaseId,name,displayTitle,event,status,conclusion,headSha,headBranch,workflowName,createdAt,updatedAt,startedAt,jobs,url";

const ISSUE_VIEW_FIELDS =
  "number,title,body,state,author,assignees,labels,createdAt,updatedAt,closedAt,comments,url";

const ISSUE_LIST_FIELDS =
  "number,title,state,author,labels,createdAt,updatedAt,closedAt,url";

function jsonResult(data: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
  };
}

function errorResult(err: unknown) {
  if (err instanceof GhCliError) {
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            { error: err.code, message: err.message, stderr: err.stderr },
            null,
            2,
          ),
        },
      ],
      isError: true,
    };
  }
  const message = err instanceof Error ? err.message : String(err);
  return {
    content: [{ type: "text" as const, text: `Error: ${message}` }],
    isError: true,
  };
}

export function createServer(): McpServer {
  const server = new McpServer({
    name: pkg.name,
    version: pkg.version,
  });

  server.registerTool(
    "gh_pr_view",
    {
      title: "View a GitHub pull request",
      description:
        "Fetch full metadata for a single PR: title/body, state, merge info, head/base refs, statusCheckRollup (CI status), labels, comments count, additions/deletions. Returns structured JSON via `gh pr view --json`.",
      inputSchema: {
        repo: RepoSchema.describe("Repository in owner/name format, e.g. 'nvrenshiren/mcp'"),
        number: z.number().int().positive().describe("Pull request number"),
      },
    },
    async ({ repo, number }) => {
      try {
        const data = await ghJson([
          "pr",
          "view",
          String(number),
          "--repo",
          repo,
          "--json",
          PR_VIEW_FIELDS,
        ]);
        return jsonResult(data);
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  server.registerTool(
    "gh_pr_list",
    {
      title: "List GitHub pull requests",
      description:
        "List PRs in a repo with filters. Returns compact records (number, title, state, author, branch, timestamps, url, labels).",
      inputSchema: {
        repo: RepoSchema,
        state: z
          .enum(["open", "closed", "merged", "all"])
          .optional()
          .describe("Default: open"),
        limit: z.number().int().min(1).max(100).optional().describe("Default 20, max 100"),
        author: z.string().optional().describe("Filter by author username"),
        label: z.string().optional().describe("Filter by label name"),
        base: z.string().optional().describe("Filter by base branch"),
        head: z.string().optional().describe("Filter by head branch"),
      },
    },
    async ({ repo, state, limit, author, label, base, head }) => {
      try {
        const args = [
          "pr",
          "list",
          "--repo",
          repo,
          "--json",
          PR_LIST_FIELDS,
          "--limit",
          String(limit ?? 20),
        ];
        if (state) args.push("--state", state);
        if (author) args.push("--author", author);
        if (label) args.push("--label", label);
        if (base) args.push("--base", base);
        if (head) args.push("--head", head);
        const data = await ghJson(args);
        return jsonResult(data);
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  server.registerTool(
    "gh_run_list",
    {
      title: "List GitHub Actions runs",
      description:
        "List recent workflow runs in a repo with filters. Returns compact records (databaseId, status, conclusion, workflow, branch, sha, timestamps, url). Use databaseId with gh_run_view / gh_run_log.",
      inputSchema: {
        repo: RepoSchema,
        workflow: z.string().optional().describe("Workflow filename (e.g. 'release.yml') or name"),
        branch: z.string().optional(),
        status: z
          .enum(["queued", "in_progress", "completed", "success", "failure", "cancelled"])
          .optional(),
        event: z
          .enum(["push", "pull_request", "workflow_dispatch", "schedule", "release"])
          .optional(),
        limit: z.number().int().min(1).max(100).optional().describe("Default 10"),
      },
    },
    async ({ repo, workflow, branch, status, event, limit }) => {
      try {
        const args = [
          "run",
          "list",
          "--repo",
          repo,
          "--json",
          RUN_LIST_FIELDS,
          "--limit",
          String(limit ?? 10),
        ];
        if (workflow) args.push("--workflow", workflow);
        if (branch) args.push("--branch", branch);
        if (status) args.push("--status", status);
        if (event) args.push("--event", event);
        const data = await ghJson(args);
        return jsonResult(data);
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  server.registerTool(
    "gh_run_view",
    {
      title: "View a GitHub Actions run",
      description:
        "Show details for one workflow run: top-level status/conclusion plus full jobs[] with each step's name, conclusion, and duration. Use this to find which step failed before pulling logs.",
      inputSchema: {
        repo: RepoSchema,
        run_id: z.number().int().positive().describe("Run databaseId from gh_run_list"),
      },
    },
    async ({ repo, run_id }) => {
      try {
        const data = await ghJson([
          "run",
          "view",
          String(run_id),
          "--repo",
          repo,
          "--json",
          RUN_VIEW_FIELDS,
        ]);
        return jsonResult(data);
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  server.registerTool(
    "gh_run_log",
    {
      title: "Read GitHub Actions run logs",
      description:
        "Fetch raw log lines for a workflow run, with filters to keep output manageable. Each line is prefixed `<jobName>\\t<stepName>\\t<timestamp> <message>`. Always pass at least one of `grep`, `head`, or `tail` for large runs — full logs can be megabytes. Use `failed_only: true` to only stream failed jobs.",
      inputSchema: {
        repo: RepoSchema,
        run_id: z.number().int().positive(),
        job: z.string().optional().describe("Filter to job name matching this regex (case-insensitive)"),
        step: z.string().optional().describe("Filter to step name matching this regex"),
        grep: z.string().optional().describe("Filter to lines matching this regex"),
        head: z.number().int().positive().max(2000).optional().describe("Keep only first N matching lines"),
        tail: z.number().int().positive().max(2000).optional().describe("Keep only last N matching lines"),
        failed_only: z
          .boolean()
          .optional()
          .describe("Use `gh run view --log-failed` to limit to failed steps only"),
      },
    },
    async ({ repo, run_id, job, step, grep, head, tail, failed_only }) => {
      try {
        const args = ["run", "view", String(run_id), "--repo", repo];
        args.push(failed_only ? "--log-failed" : "--log");
        const raw = await ghText(args);
        const result = filterLogs(raw, { job, step, grep, head, tail });
        return jsonResult(result);
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  server.registerTool(
    "gh_issue_view",
    {
      title: "View a GitHub issue",
      description: "Fetch full metadata for a single issue (title, body, state, labels, assignees, comments).",
      inputSchema: {
        repo: RepoSchema,
        number: z.number().int().positive(),
      },
    },
    async ({ repo, number }) => {
      try {
        const data = await ghJson([
          "issue",
          "view",
          String(number),
          "--repo",
          repo,
          "--json",
          ISSUE_VIEW_FIELDS,
        ]);
        return jsonResult(data);
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  server.registerTool(
    "gh_issue_list",
    {
      title: "List GitHub issues",
      description: "List issues in a repo with filters.",
      inputSchema: {
        repo: RepoSchema,
        state: z.enum(["open", "closed", "all"]).optional().describe("Default: open"),
        limit: z.number().int().min(1).max(100).optional().describe("Default 20"),
        author: z.string().optional(),
        assignee: z.string().optional(),
        label: z.string().optional(),
      },
    },
    async ({ repo, state, limit, author, assignee, label }) => {
      try {
        const args = [
          "issue",
          "list",
          "--repo",
          repo,
          "--json",
          ISSUE_LIST_FIELDS,
          "--limit",
          String(limit ?? 20),
        ];
        if (state) args.push("--state", state);
        if (author) args.push("--author", author);
        if (assignee) args.push("--assignee", assignee);
        if (label) args.push("--label", label);
        const data = await ghJson(args);
        return jsonResult(data);
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  server.registerTool(
    "gh_api",
    {
      title: "Call any GitHub REST/GraphQL endpoint",
      description:
        "Escape hatch — invoke `gh api <endpoint>` with optional fields and HTTP method. For anything not covered by the dedicated tools (e.g. branches, releases, commits, comparisons, search). Read-only by default; only GET is allowed unless `method` is set explicitly. Response is parsed as JSON when possible.",
      inputSchema: {
        endpoint: z
          .string()
          .min(1)
          .describe(
            "REST path like 'repos/owner/name/branches' or GraphQL via 'graphql'. Do not URL-encode — gh handles it.",
          ),
        method: z.enum(["GET", "HEAD"]).optional().describe("Default GET. Only safe methods allowed in v0.1."),
        fields: z
          .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
          .optional()
          .describe("Query parameters / body fields, passed as -f key=value to gh"),
      },
    },
    async ({ endpoint, method, fields }) => {
      try {
        const args = ["api", endpoint];
        if (method) args.push("-X", method);
        if (fields) {
          for (const [k, v] of Object.entries(fields)) {
            args.push("-f", `${k}=${String(v)}`);
          }
        }
        const text = await ghText(args);
        try {
          return jsonResult(JSON.parse(text));
        } catch {
          return jsonResult({ raw: text });
        }
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  return server;
}

async function main(): Promise<void> {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`${pkg.name}@${pkg.version} running on stdio`);
}

const isDirectRun = import.meta.url === pathToFileURL(process.argv[1] ?? "").href;
if (isDirectRun) {
  main().catch((err) => {
    console.error("Fatal:", err);
    process.exit(1);
  });
}
