import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "../src/index.js";

describe("@dawipong/mcp-hello", () => {
  it("creates a server instance without throwing", () => {
    const server = createServer();
    assert.ok(server, "server should be defined");
  });
});
