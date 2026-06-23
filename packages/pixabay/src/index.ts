#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { PixabayClient, type ImageHit, type VideoHit } from "./pixabay.js";

const pkg = JSON.parse(
  readFileSync(fileURLToPath(new URL("../package.json", import.meta.url)), "utf8"),
) as { name: string; version: string };

const IMAGE_CATEGORIES = [
  "backgrounds", "fashion", "nature", "science", "education", "feelings",
  "health", "people", "religion", "places", "animals", "industry", "computer",
  "food", "sports", "transportation", "travel", "buildings", "business", "music",
] as const;

const VIDEO_CATEGORIES = IMAGE_CATEGORIES;

const COLORS = [
  "grayscale", "transparent", "red", "orange", "yellow", "green", "turquoise",
  "blue", "lilac", "pink", "white", "gray", "black", "brown",
] as const;

const LANGS = [
  "cs", "da", "de", "en", "es", "fr", "id", "it", "hu", "nl", "no", "pl", "pt",
  "ro", "sk", "fi", "sv", "tr", "vi", "th", "bg", "ru", "el", "ja", "ko", "zh",
] as const;

function compactImage(hit: ImageHit) {
  const base = {
    id: hit.id,
    pageURL: hit.pageURL,
    type: hit.type,
    tags: hit.tags,
    previewURL: hit.previewURL,
    webformatURL: hit.webformatURL,
    largeImageURL: hit.largeImageURL,
    width: hit.imageWidth,
    height: hit.imageHeight,
    views: hit.views,
    downloads: hit.downloads,
    likes: hit.likes,
    comments: hit.comments,
    user: hit.user,
  };
  return {
    ...base,
    ...(hit.fullHDURL ? { fullHDURL: hit.fullHDURL } : {}),
    ...(hit.imageURL ? { imageURL: hit.imageURL } : {}),
    ...(hit.vectorURL ? { vectorURL: hit.vectorURL } : {}),
  };
}

function compactVideo(hit: VideoHit) {
  return {
    id: hit.id,
    pageURL: hit.pageURL,
    tags: hit.tags,
    duration: hit.duration,
    videos: hit.videos,
    views: hit.views,
    downloads: hit.downloads,
    likes: hit.likes,
    comments: hit.comments,
    user: hit.user,
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

export function createServer(apiKey: string = process.env.PIXABAY_API_KEY ?? ""): McpServer {
  const server = new McpServer({
    name: pkg.name,
    version: pkg.version,
  });

  let _client: PixabayClient | null = null;
  const getClient = (): PixabayClient => {
    if (!_client) _client = new PixabayClient(apiKey);
    return _client;
  };

  server.registerTool(
    "search_images",
    {
      title: "Search images on Pixabay",
      description:
        "Search Pixabay's free image library. Returns compact results: id, page URL, type, tags, preview/web/large image URLs, dimensions, stats. fullHDURL/imageURL/vectorURL are returned only for accounts approved for full API access. Per Pixabay ToS: do not permanently hot-link image URLs — download to your server. Always credit Pixabay when displaying results.",
      inputSchema: {
        q: z.string().max(100).optional().describe("Search query, URL-encoded automatically. Max 100 chars."),
        lang: z.enum(LANGS).optional().describe("Query language. Default: en"),
        image_type: z.enum(["all", "photo", "illustration", "vector"]).optional(),
        orientation: z.enum(["all", "horizontal", "vertical"]).optional(),
        category: z.enum(IMAGE_CATEGORIES).optional(),
        min_width: z.number().int().nonnegative().optional(),
        min_height: z.number().int().nonnegative().optional(),
        colors: z
          .array(z.enum(COLORS))
          .optional()
          .describe("Filter by colors (comma-joined automatically)."),
        editors_choice: z.boolean().optional(),
        safesearch: z.boolean().optional().describe("Restrict to images suitable for all ages."),
        order: z.enum(["popular", "latest"]).optional(),
        page: z.number().int().positive().optional(),
        per_page: z.number().int().min(3).max(200).optional().describe("3-200, default 20."),
      },
    },
    async (input) => {
      try {
        const { colors, ...rest } = input;
        const res = await getClient().searchImages({
          ...rest,
          colors: colors?.join(","),
        });
        return jsonResult({
          total: res.total,
          totalHits: res.totalHits,
          hits: res.hits.map(compactImage),
        });
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  server.registerTool(
    "search_videos",
    {
      title: "Search videos on Pixabay",
      description:
        "Search Pixabay's free video library. Returns compact results with four video-quality URLs (large/medium/small/tiny) plus per-rendition thumbnails. Videos may be embedded directly per ToS, though Pixabay recommends mirroring them to your own server. Always credit Pixabay when displaying results.",
      inputSchema: {
        q: z.string().max(100).optional(),
        lang: z.enum(LANGS).optional(),
        video_type: z.enum(["all", "film", "animation"]).optional(),
        category: z.enum(VIDEO_CATEGORIES).optional(),
        min_width: z.number().int().nonnegative().optional(),
        min_height: z.number().int().nonnegative().optional(),
        editors_choice: z.boolean().optional(),
        safesearch: z.boolean().optional(),
        order: z.enum(["popular", "latest"]).optional(),
        page: z.number().int().positive().optional(),
        per_page: z.number().int().min(3).max(200).optional(),
      },
    },
    async (input) => {
      try {
        const res = await getClient().searchVideos(input);
        return jsonResult({
          total: res.total,
          totalHits: res.totalHits,
          hits: res.hits.map(compactVideo),
        });
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  server.registerTool(
    "get_image",
    {
      title: "Get one Pixabay image by ID",
      description: "Fetch a single image by its numeric Pixabay ID. Returns null if not found.",
      inputSchema: {
        id: z.number().int().positive().describe("Pixabay image ID"),
      },
    },
    async ({ id }) => {
      try {
        const hit = await getClient().getImage(id);
        return jsonResult(hit ? compactImage(hit) : null);
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  server.registerTool(
    "get_video",
    {
      title: "Get one Pixabay video by ID",
      description: "Fetch a single video by its numeric Pixabay ID. Returns null if not found.",
      inputSchema: {
        id: z.number().int().positive().describe("Pixabay video ID"),
      },
    },
    async ({ id }) => {
      try {
        const hit = await getClient().getVideo(id);
        return jsonResult(hit ? compactVideo(hit) : null);
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
  console.error("@dawipong/mcp-pixabay running on stdio");
}

const isDirectRun = import.meta.url === `file://${process.argv[1]}`;
if (isDirectRun) {
  main().catch((err) => {
    console.error("Fatal:", err);
    process.exit(1);
  });
}
