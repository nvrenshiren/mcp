import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "../src/index.js";
import { GhCliError, ghJson, ghText, type ExecImpl } from "../src/gh.js";
import { filterLogs } from "../src/logs.js";

describe("@dawipong/mcp-github", () => {
  it("creates a server instance", () => {
    const server = createServer();
    assert.ok(server, "server should be defined");
  });

  describe("gh wrapper", () => {
    it("ghText returns stdout on success", async () => {
      const fakeExec: ExecImpl = async () => ({ stdout: "hello world\n", stderr: "" });
      const out = await ghText(["pr", "list"], { execImpl: fakeExec });
      assert.equal(out, "hello world\n");
    });

    it("ghJson parses JSON output", async () => {
      const fakeExec: ExecImpl = async () => ({ stdout: '{"a":1,"b":[2,3]}', stderr: "" });
      const out = await ghJson<{ a: number; b: number[] }>(["api", "x"], { execImpl: fakeExec });
      assert.deepEqual(out, { a: 1, b: [2, 3] });
    });

    it("translates ENOENT to GH_NOT_FOUND", async () => {
      const fakeExec: ExecImpl = async () => {
        const err = new Error("spawn gh ENOENT") as Error & { code: string };
        err.code = "ENOENT";
        throw err;
      };
      await assert.rejects(
        () => ghText(["pr", "list"], { execImpl: fakeExec }),
        (err: unknown) => err instanceof GhCliError && err.code === "GH_NOT_FOUND",
      );
    });

    it("translates auth errors to GH_NOT_AUTHED", async () => {
      const fakeExec: ExecImpl = async () => {
        const err = new Error("Command failed") as Error & { stderr: string };
        err.stderr = "error: You are not logged into any GitHub hosts. Run gh auth login.";
        throw err;
      };
      await assert.rejects(
        () => ghText(["pr", "list"], { execImpl: fakeExec }),
        (err: unknown) => err instanceof GhCliError && err.code === "GH_NOT_AUTHED",
      );
    });

    it("translates other errors to GH_API_ERROR with stderr surfaced", async () => {
      const fakeExec: ExecImpl = async () => {
        const err = new Error("Command failed") as Error & { stderr: string };
        err.stderr = "GraphQL: Could not resolve to a Repository\n";
        throw err;
      };
      await assert.rejects(
        () => ghText(["pr", "view", "1"], { execImpl: fakeExec }),
        (err: unknown) =>
          err instanceof GhCliError &&
          err.code === "GH_API_ERROR" &&
          err.message.includes("Could not resolve"),
      );
    });

    it("ghJson throws GH_UNKNOWN on malformed JSON", async () => {
      const fakeExec: ExecImpl = async () => ({ stdout: "not json", stderr: "" });
      await assert.rejects(
        () => ghJson(["api", "x"], { execImpl: fakeExec }),
        (err: unknown) => err instanceof GhCliError && err.code === "GH_UNKNOWN",
      );
    });
  });

  describe("filterLogs", () => {
    const sample = [
      "Release to npm\tSet up job\t2026-06-23T19:18:23Z Included Software: ...",
      "Release to npm\tCheckout\t2026-06-23T19:18:25Z [command]git remote add origin",
      "Release to npm\tCreate Release PR or publish to npm\t2026-06-23T19:18:40Z 🦋 success packages published",
      "Release to npm\tCreate Release PR or publish to npm\t2026-06-23T19:18:41Z 🦋 info Publishing 0.2.0",
      "Build\tSetup pnpm\t2026-06-23T19:18:30Z Setting up pnpm",
    ].join("\n");

    it("returns everything when no filter", () => {
      const r = filterLogs(sample, {});
      assert.equal(r.total_matching, 5);
      assert.equal(r.returned, 5);
      assert.equal(r.truncated, false);
    });

    it("filters by job (case-insensitive)", () => {
      const r = filterLogs(sample, { job: "release to npm" });
      assert.equal(r.total_matching, 4);
      assert.equal(r.lines.every((l) => l.startsWith("Release to npm")), true);
    });

    it("filters by step", () => {
      const r = filterLogs(sample, { step: "Checkout" });
      assert.equal(r.total_matching, 1);
      assert.match(r.lines[0] ?? "", /git remote add/);
    });

    it("filters by grep on whole line", () => {
      const r = filterLogs(sample, { grep: "Publishing|success" });
      assert.equal(r.total_matching, 2);
    });

    it("combines filters", () => {
      const r = filterLogs(sample, { job: "release", grep: "success" });
      assert.equal(r.total_matching, 1);
    });

    it("respects head", () => {
      const r = filterLogs(sample, { head: 2 });
      assert.equal(r.returned, 2);
      assert.equal(r.total_matching, 5);
      assert.equal(r.truncated, true);
    });

    it("respects tail", () => {
      const r = filterLogs(sample, { tail: 2 });
      assert.equal(r.returned, 2);
      assert.match(r.lines[1] ?? "", /pnpm/);
    });

    it("head + tail keeps both ends when log is large", () => {
      const r = filterLogs(sample, { head: 1, tail: 1 });
      assert.equal(r.returned, 2);
      assert.match(r.lines[0] ?? "", /Set up job/);
      assert.match(r.lines[1] ?? "", /pnpm/);
    });

    it("falls back to literal match when grep is invalid regex", () => {
      const r = filterLogs(sample, { grep: "[invalid(" });
      assert.equal(r.total_matching, 0);
    });
  });
});
