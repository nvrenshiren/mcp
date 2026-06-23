#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { ensureFreshCatalog } from "./catalog.js";
import { searchTitles } from "./search.js";
import { getSvg } from "./svg.js";
import type { Illustration } from "./types.js";

const pkg = JSON.parse(
  readFileSync(fileURLToPath(new URL("../package.json", import.meta.url)), "utf8"),
) as { name: string; version: string };

const DEFAULT_UA = `${pkg.name}/${pkg.version} (https://github.com/nvrenshiren/mcp)`;

function compactItem(it: Illustration) {
  return {
    slug: it.newSlug,
    title: it.title,
    media: it.media,
  };
}

function jsonResult(data: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
  };
}

function errorResult(err: unknown) {
  const message = err instanceof Error ? err.message : String(err);
  return {
    content: [{ type: "text" as const, text: `Error: ${message}` }],
    isError: true,
  };
}

export function createServer(ua: string = process.env.UNDRAW_USER_AGENT ?? DEFAULT_UA): McpServer {
  const server = new McpServer({
    name: pkg.name,
    version: pkg.version,
  });

  const ensureOpts = {
    ua,
    cacheDir: process.env.UNDRAW_CACHE_DIR,
  };

  server.registerTool(
    "search_illustrations",
    {
      title: "Search unDraw illustrations",
      description:
        "Search the unDraw open-source illustration library by title keyword. Returns compact results { slug, title, media URL }. The local catalog auto-refreshes when undraw.co publishes new illustrations (drift detected by Next.js buildId or first-item change). Search itself is local — zero network roundtrip after the freshness check.",
      inputSchema: {
        q: z
          .string()
          .min(1)
          .max(100)
          .describe("Search query — matched against illustration title (and slug). Case-insensitive."),
        limit: z.number().int().min(1).max(100).optional().describe("Max results. Default 20."),
      },
    },
    async ({ q, limit }) => {
      try {
        const catalog = await ensureFreshCatalog(ensureOpts);
        const hits = searchTitles(catalog.illustrations, q, limit ?? 20);
        return jsonResult({
          buildId: catalog.buildId,
          total: hits.length,
          totalInCatalog: catalog.illustrations.length,
          hits: hits.map(compactItem),
        });
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  server.registerTool(
    "get_svg",
    {
      title: "Get unDraw SVG by slug",
      description:
        "Fetch SVG content for a specific illustration by its slug (use search_illustrations to discover slugs). Optionally recolor: unDraw's signature purple #6c63ff is replaced with the given hex color throughout the SVG. SVGs are fetched once from cdn.undraw.co and cached on disk; subsequent calls with same slug serve from disk. Returns the raw SVG text — paste it into any HTML/JSX file.",
      inputSchema: {
        slug: z
          .string()
          .min(1)
          .describe("Illustration slug, e.g. 'travel-everywhere_sxzj'"),
        color: z
          .string()
          .regex(/^#?[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/)
          .optional()
          .describe(
            "Hex color (e.g. '#ff6600' or 'f60') to replace the default purple #6c63ff. The '#' is optional. 3-digit shorthand expanded to 6.",
          ),
      },
    },
    async ({ slug, color }) => {
      try {
        const catalog = await ensureFreshCatalog(ensureOpts);
        const item = catalog.illustrations.find((it) => it.newSlug === slug);
        if (!item) {
          return errorResult(
            new Error(
              `Slug not found in catalog: '${slug}'. Use search_illustrations first to discover valid slugs.`,
            ),
          );
        }
        const svg = await getSvg(item.media, color, {
          ua,
          cacheDir: process.env.UNDRAW_CACHE_DIR
            ? `${process.env.UNDRAW_CACHE_DIR}/svgs`
            : undefined,
        });
        return {
          content: [{ type: "text" as const, text: svg }],
        };
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
