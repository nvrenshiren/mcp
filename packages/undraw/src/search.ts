import type { Illustration } from "./types.js";

export function searchTitles(
  items: readonly Illustration[],
  query: string,
  limit: number,
): Illustration[] {
  const q = query.toLowerCase().trim();
  if (!q) return items.slice(0, limit);
  const words = q.split(/\s+/).filter((w) => w.length > 0);

  const scored = items
    .map((it) => {
      const title = it.title.toLowerCase();
      const slug = it.newSlug.toLowerCase();
      let score = 0;

      if (title.includes(q)) score += 100;
      if (slug.includes(q)) score += 30;

      const titleHasAllWords = words.every((w) => title.includes(w));
      if (titleHasAllWords) score += 50;

      for (const w of words) {
        if (title.includes(w)) score += 10;
        if (slug.includes(w)) score += 3;
      }
      return { item: it, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored.map((x) => x.item);
}
