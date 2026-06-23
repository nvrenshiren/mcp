import { mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

const UNDRAW_DEFAULT_HEX = "6c63ff";

export interface GetSvgOptions {
  ua: string;
  cacheDir?: string;
  fetchImpl?: typeof fetch;
}

function defaultSvgCacheDir(): string {
  return join(homedir(), ".cache", "mcp-undraw", "svgs");
}

export async function getSvg(
  media: string,
  color: string | undefined,
  opts: GetSvgOptions,
): Promise<string> {
  const cacheDir = opts.cacheDir ?? defaultSvgCacheDir();
  const fetchImpl = opts.fetchImpl ?? fetch;
  const filename = sanitizeFilename(media);
  const cachedPath = join(cacheDir, filename);

  let svg: string;
  try {
    svg = await readFile(cachedPath, "utf8");
  } catch {
    const res = await fetchImpl(media, {
      headers: { "User-Agent": opts.ua, Accept: "image/svg+xml,*/*" },
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch SVG ${media}: HTTP ${res.status} ${res.statusText}`);
    }
    svg = await res.text();
    if (!svg.includes("<svg")) {
      throw new Error(`Response is not an SVG (got: ${svg.slice(0, 60)}...)`);
    }
    await mkdir(cacheDir, { recursive: true });
    await writeFile(cachedPath, svg, "utf8");
  }

  if (color) {
    const hex = normalizeHex(color);
    if (hex !== UNDRAW_DEFAULT_HEX) {
      svg = svg.replace(/#6c63ff/gi, `#${hex}`);
    }
  }

  return svg;
}

export function normalizeHex(color: string): string {
  let c = color.trim();
  if (c.startsWith("#")) c = c.slice(1);
  if (!/^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/.test(c)) {
    throw new Error(`Invalid hex color: ${color}`);
  }
  if (c.length === 3) {
    c = c
      .split("")
      .map((ch) => ch + ch)
      .join("");
  }
  return c.toLowerCase();
}

function sanitizeFilename(url: string): string {
  const last = url.split("/").pop() ?? "unknown.svg";
  return last.replace(/[^a-zA-Z0-9._-]/g, "_");
}
