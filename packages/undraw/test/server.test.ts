import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createServer } from "../src/index.js";
import { searchTitles } from "../src/search.js";
import { normalizeHex, getSvg } from "../src/svg.js";
import { __resetForTests, ensureFreshCatalog, extractNextData } from "../src/catalog.js";
import type { Illustration } from "../src/types.js";

const SAMPLE: Illustration[] = [
  {
    _id: "1",
    title: "Travel Everywhere",
    newSlug: "travel-everywhere_sxzj",
    media: "https://cdn.undraw.co/illustration/travel-everywhere_sxzj.svg",
  },
  {
    _id: "2",
    title: "Code Thinking",
    newSlug: "code-thinking_tqs9",
    media: "https://cdn.undraw.co/illustration/code-thinking_tqs9.svg",
  },
  {
    _id: "3",
    title: "Dashboard Overview",
    newSlug: "dashboard-overview_xyz",
    media: "https://cdn.undraw.co/illustration/dashboard-overview_xyz.svg",
  },
];

function htmlWithNextData(data: unknown): string {
  return `<html><head><script id="__NEXT_DATA__" type="application/json">${JSON.stringify(data)}</script></head><body></body></html>`;
}

describe("@dawipong/mcp-undraw", () => {
  it("creates a server instance", () => {
    const server = createServer("test-ua/0.0.0");
    assert.ok(server, "server should be defined");
  });

  describe("searchTitles", () => {
    it("returns top items when query is empty", () => {
      const hits = searchTitles(SAMPLE, "", 2);
      assert.equal(hits.length, 2);
    });

    it("matches by exact phrase, sorted by score", () => {
      const hits = searchTitles(SAMPLE, "dashboard", 10);
      assert.equal(hits.length, 1);
      assert.equal(hits[0]?.newSlug, "dashboard-overview_xyz");
    });

    it("matches by individual word", () => {
      const hits = searchTitles(SAMPLE, "code", 10);
      assert.equal(hits.length, 1);
      assert.equal(hits[0]?.title, "Code Thinking");
    });

    it("respects the limit", () => {
      const hits = searchTitles(SAMPLE, "e", 2);
      assert.ok(hits.length <= 2);
    });
  });

  describe("normalizeHex", () => {
    it("accepts 6-digit hex with hash", () => {
      assert.equal(normalizeHex("#ff6600"), "ff6600");
    });
    it("accepts 6-digit hex without hash", () => {
      assert.equal(normalizeHex("ff6600"), "ff6600");
    });
    it("expands 3-digit shorthand", () => {
      assert.equal(normalizeHex("#f60"), "ff6600");
    });
    it("rejects invalid hex", () => {
      assert.throws(() => normalizeHex("not-a-color"), /Invalid hex color/);
    });
  });

  describe("extractNextData", () => {
    it("parses __NEXT_DATA__ script content", () => {
      const html = htmlWithNextData({ buildId: "abc", props: { pageProps: { totalPages: 5 } } });
      const data = extractNextData(html);
      assert.equal(data.buildId, "abc");
      assert.equal(data.props.pageProps.totalPages, 5);
    });

    it("throws when __NEXT_DATA__ is absent", () => {
      assert.throws(() => extractNextData("<html></html>"), /Could not find __NEXT_DATA__/);
    });
  });

  describe("ensureFreshCatalog", () => {
    it("falls back to local cache when probe fails", async () => {
      __resetForTests();
      const cacheDir = mkdtempSync(join(tmpdir(), "mcp-undraw-test-"));
      const local = { buildId: "cached", fetchedAt: 0, illustrations: SAMPLE };
      writeFileSync(join(cacheDir, "catalog.json"), JSON.stringify(local), "utf8");

      const fetchImpl: typeof fetch = async () => {
        throw new Error("network down");
      };

      const got = await ensureFreshCatalog({ ua: "t", cacheDir, fetchImpl });
      assert.equal(got.buildId, "cached");
      assert.equal(got.illustrations.length, 3);
    });

    it("uses local cache when buildId and first item match", async () => {
      __resetForTests();
      const cacheDir = mkdtempSync(join(tmpdir(), "mcp-undraw-test-"));
      const local = { buildId: "BID1", fetchedAt: 0, illustrations: SAMPLE };
      writeFileSync(join(cacheDir, "catalog.json"), JSON.stringify(local), "utf8");

      let fetchCount = 0;
      const fetchImpl: typeof fetch = async () => {
        fetchCount++;
        return new Response(
          htmlWithNextData({
            buildId: "BID1",
            props: { pageProps: { illustrations: SAMPLE, totalPages: 1 } },
          }),
          { status: 200 },
        );
      };

      const got = await ensureFreshCatalog({ ua: "t", cacheDir, fetchImpl, throttleMs: 0 });
      assert.equal(got.buildId, "BID1");
      assert.equal(fetchCount, 1, "only the probe page should be fetched");
    });

    it("triggers full refetch on buildId mismatch", async () => {
      __resetForTests();
      const cacheDir = mkdtempSync(join(tmpdir(), "mcp-undraw-test-"));
      const stale = { buildId: "OLD", fetchedAt: 0, illustrations: SAMPLE };
      writeFileSync(join(cacheDir, "catalog.json"), JSON.stringify(stale), "utf8");

      const fresh: Illustration[] = [
        { _id: "new1", title: "New Thing", newSlug: "new-thing_x", media: "https://cdn.undraw.co/illustration/new-thing_x.svg" },
        ...SAMPLE,
      ];

      const fetchImpl: typeof fetch = async (url) => {
        const u = String(url);
        if (u === "https://undraw.co/illustrations") {
          return new Response(
            htmlWithNextData({
              buildId: "NEW",
              props: { pageProps: { illustrations: fresh, totalPages: 1 } },
            }),
            { status: 200 },
          );
        }
        throw new Error(`unexpected URL: ${u}`);
      };

      const got = await ensureFreshCatalog({ ua: "t", cacheDir, fetchImpl, throttleMs: 0 });
      assert.equal(got.buildId, "NEW");
      assert.equal(got.illustrations[0]?._id, "new1");
    });
  });

  describe("getSvg", () => {
    it("fetches, caches, and recolors", async () => {
      const cacheDir = mkdtempSync(join(tmpdir(), "mcp-undraw-svg-"));
      let fetchCount = 0;
      const fetchImpl: typeof fetch = async () => {
        fetchCount++;
        return new Response(
          '<svg xmlns="http://www.w3.org/2000/svg"><rect fill="#6c63ff"/><rect fill="#3f3d56"/></svg>',
          { status: 200, headers: { "Content-Type": "image/svg+xml" } },
        );
      };
      const url = "https://cdn.undraw.co/illustration/test_abc.svg";

      const colored = await getSvg(url, "#ff6600", { ua: "t", cacheDir, fetchImpl });
      assert.ok(colored.includes("#ff6600"), "primary color replaced");
      assert.ok(colored.includes("#3f3d56"), "secondary palette untouched");
      assert.equal(fetchCount, 1);

      const second = await getSvg(url, undefined, { ua: "t", cacheDir, fetchImpl });
      assert.ok(second.includes("#6c63ff"), "second call returns cached SVG with original color");
      assert.equal(fetchCount, 1, "second call hits disk cache, not network");
    });
  });
});
