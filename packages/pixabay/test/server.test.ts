import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "../src/index.js";
import { PixabayClient } from "../src/pixabay.js";

describe("@dawipong/mcp-pixabay", () => {
  it("creates a server instance with a dummy key", () => {
    const server = createServer("test-key");
    assert.ok(server, "server should be defined");
  });

  it("PixabayClient throws when API key is missing", () => {
    assert.throws(() => new PixabayClient(""), /PIXABAY_API_KEY/);
  });

  it("PixabayClient builds the request URL with all params", async () => {
    let capturedUrl = "";
    const fakeFetch = async (url: string | URL | Request) => {
      capturedUrl = typeof url === "string" ? url : url.toString();
      return new Response(JSON.stringify({ total: 0, totalHits: 0, hits: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    };

    const client = new PixabayClient("k", fakeFetch as typeof fetch);
    await client.searchImages({
      q: "red flower",
      image_type: "photo",
      per_page: 5,
      safesearch: true,
    });

    assert.match(capturedUrl, /^https:\/\/pixabay\.com\/api\/\?/);
    assert.match(capturedUrl, /q=red\+flower/);
    assert.match(capturedUrl, /image_type=photo/);
    assert.match(capturedUrl, /per_page=5/);
    assert.match(capturedUrl, /safesearch=true/);
    assert.match(capturedUrl, /key=k/);
  });

  it("PixabayClient caches identical requests", async () => {
    let calls = 0;
    const fakeFetch = async () => {
      calls++;
      return new Response(JSON.stringify({ total: 1, totalHits: 1, hits: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    };

    const client = new PixabayClient("k", fakeFetch as typeof fetch);
    await client.searchImages({ q: "cat" });
    await client.searchImages({ q: "cat" });
    assert.equal(calls, 1, "second identical call should hit cache");

    await client.searchImages({ q: "dog" });
    assert.equal(calls, 2, "different query should miss cache");
  });

  it("PixabayClient surfaces non-2xx responses as errors", async () => {
    const fakeFetch = async () =>
      new Response("rate limited", { status: 429, statusText: "Too Many Requests" });

    const client = new PixabayClient("k", fakeFetch as typeof fetch);
    await assert.rejects(() => client.searchImages({ q: "x" }), /429/);
  });
});
