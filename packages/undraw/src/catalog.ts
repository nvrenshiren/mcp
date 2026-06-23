import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import type { Catalog, Illustration, NextData } from "./types.js";

const UNDRAW_BASE = "https://undraw.co";
const DEFAULT_THROTTLE_MS = 60_000;
const DEFAULT_CONCURRENCY = 5;

const NEXT_DATA_RE =
  /<script[^>]*id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/;

export interface EnsureFreshOptions {
  ua: string;
  cacheDir?: string;
  throttleMs?: number;
  concurrency?: number;
  fetchImpl?: typeof fetch;
}

interface ProbeResult {
  buildId: string;
  illustrations: Illustration[];
  totalPages: number;
}

let memCatalog: Catalog | null = null;
let lastCheckAt = 0;

/** Test-only: reset the in-memory throttle state. */
export function __resetForTests(): void {
  memCatalog = null;
  lastCheckAt = 0;
}

function defaultCacheDir(): string {
  return join(homedir(), ".cache", "mcp-undraw");
}

function catalogPath(cacheDir: string): string {
  return join(cacheDir, "catalog.json");
}

export async function ensureFreshCatalog(opts: EnsureFreshOptions): Promise<Catalog> {
  const cacheDir = opts.cacheDir ?? defaultCacheDir();
  const throttleMs = opts.throttleMs ?? DEFAULT_THROTTLE_MS;
  const concurrency = opts.concurrency ?? DEFAULT_CONCURRENCY;
  const fetchImpl = opts.fetchImpl ?? fetch;

  if (memCatalog && Date.now() - lastCheckAt < throttleMs) {
    return memCatalog;
  }

  let probe: ProbeResult;
  try {
    probe = await fetchPage(1, opts.ua, fetchImpl);
  } catch (err) {
    // Probe failed — fall back to local catalog if we have one, else surface.
    const local = await readLocalCatalog(cacheDir);
    if (local) {
      memCatalog = local;
      return local;
    }
    throw err;
  }

  const local = await readLocalCatalog(cacheDir);

  if (
    local &&
    local.buildId === probe.buildId &&
    local.illustrations[0]?._id === probe.illustrations[0]?._id
  ) {
    memCatalog = local;
    lastCheckAt = Date.now();
    return local;
  }

  return await fullRefetch(probe, opts.ua, cacheDir, concurrency, fetchImpl);
}

async function fullRefetch(
  probe: ProbeResult,
  ua: string,
  cacheDir: string,
  concurrency: number,
  fetchImpl: typeof fetch,
): Promise<Catalog> {
  const remaining: number[] = [];
  for (let n = 2; n <= probe.totalPages; n++) remaining.push(n);

  const otherPages = await pMapLimit(remaining, concurrency, (n) =>
    fetchPage(n, ua, fetchImpl),
  );

  const illustrations: Illustration[] = [
    ...probe.illustrations,
    ...otherPages.flatMap((p) => p.illustrations),
  ];

  const catalog: Catalog = {
    buildId: probe.buildId,
    fetchedAt: Date.now(),
    illustrations,
  };

  await atomicWriteCatalog(cacheDir, catalog);
  memCatalog = catalog;
  lastCheckAt = Date.now();
  return catalog;
}

async function fetchPage(
  n: number,
  ua: string,
  fetchImpl: typeof fetch,
): Promise<ProbeResult> {
  const url = n === 1 ? `${UNDRAW_BASE}/illustrations` : `${UNDRAW_BASE}/illustrations/${n}`;
  const res = await fetchImpl(url, {
    headers: { "User-Agent": ua, Accept: "text/html" },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: HTTP ${res.status} ${res.statusText}`);
  }
  const html = await res.text();
  const next = extractNextData(html);
  const pp = next.props?.pageProps;
  if (!pp?.illustrations || !Array.isArray(pp.illustrations)) {
    throw new Error(`Page ${n} has no illustrations in __NEXT_DATA__`);
  }
  return {
    buildId: next.buildId,
    illustrations: pp.illustrations,
    totalPages: pp.totalPages ?? 1,
  };
}

export function extractNextData(html: string): NextData {
  const m = html.match(NEXT_DATA_RE);
  if (!m || !m[1]) {
    throw new Error("Could not find __NEXT_DATA__ script in HTML");
  }
  return JSON.parse(m[1]) as NextData;
}

async function readLocalCatalog(cacheDir: string): Promise<Catalog | null> {
  try {
    const content = await readFile(catalogPath(cacheDir), "utf8");
    const parsed = JSON.parse(content) as Catalog;
    if (!parsed.buildId || !Array.isArray(parsed.illustrations)) return null;
    return parsed;
  } catch {
    return null;
  }
}

async function atomicWriteCatalog(cacheDir: string, catalog: Catalog): Promise<void> {
  await mkdir(cacheDir, { recursive: true });
  const tmpPath = join(cacheDir, `catalog.${randomUUID()}.tmp`);
  await writeFile(tmpPath, JSON.stringify(catalog), "utf8");
  await rename(tmpPath, catalogPath(cacheDir));
}

async function pMapLimit<T, R>(
  items: readonly T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;
  const workerCount = Math.min(Math.max(1, limit), items.length);
  const workers = Array.from({ length: workerCount }, async () => {
    while (true) {
      const i = cursor++;
      if (i >= items.length) return;
      const item = items[i] as T;
      results[i] = await fn(item);
    }
  });
  await Promise.all(workers);
  return results;
}
