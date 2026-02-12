/**
 * Búsqueda web: Tavily (si tienes API key) o SearX público (sin tarjeta ni key).
 * SearX son instancias públicas que devuelven JSON; 100% gratis, sin registro.
 */

export interface SearchResult {
  title: string;
  content?: string;
  url: string;
}

async function searchTavily(
  query: string,
  options?: { advanced?: boolean; maxResults?: number }
): Promise<SearchResult[]> {
  const key = process.env.TAVILY_API_KEY;
  if (!key) return [];

  try {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: key,
        query,
        search_depth: options?.advanced ? "advanced" : "basic",
        max_results: options?.maxResults ?? 5,
      }),
    });
    if (!res.ok) return [];

    const data = (await res.json()) as { results?: { title?: string; content?: string; url?: string }[] };
    return (data.results || []).map((r) => ({
      title: r.title ?? "",
      content: r.content,
      url: r.url ?? "",
    }));
  } catch {
    return [];
  }
}

const SEARX_INSTANCES = [
  "https://search.bus-hit.me",
  "https://searx.be",
];

async function searchSearX(query: string, maxResults = 8): Promise<SearchResult[]> {
  const q = encodeURIComponent(query);
  for (const base of SEARX_INSTANCES) {
    try {
      const url = `${base}/search?q=${q}&format=json`;
      const res = await fetch(url, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) continue;

      const data = (await res.json()) as {
        results?: { title?: string; url?: string; content?: string }[];
      };
      const results = (data.results ?? []).slice(0, maxResults);
      return results.map((r) => ({
        title: r.title ?? "",
        content: r.content,
        url: r.url ?? "",
      }));
    } catch {
      continue;
    }
  }
  return [];
}

/**
 * Busca en web: Tavily (si TAVILY_API_KEY está definida); si no, SearX público (sin key ni tarjeta).
 */
export async function searchWeb(
  query: string,
  options?: { advanced?: boolean; maxResults?: number }
): Promise<SearchResult[]> {
  const maxResults = options?.maxResults ?? 6;

  if (process.env.TAVILY_API_KEY) {
    const results = await searchTavily(query, {
      advanced: options?.advanced ?? true,
      maxResults,
    });
    if (results.length > 0) return results;
  }

  return searchSearX(query, maxResults);
}

/**
 * Formato para inyectar en el prompt del LLM.
 */
export function formatSearchResultsForPrompt(results: SearchResult[]): string {
  if (results.length === 0) return "";
  return results
    .map(
      (r, i) =>
        `[Fuente ${i + 1}]: ${r.title}\n${r.content ?? ""}\nURL: ${r.url}`
    )
    .join("\n\n");
}
