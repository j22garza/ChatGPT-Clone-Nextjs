import type { NextApiRequest, NextApiResponse } from "next";
import { searchWeb } from "@/app/utils/webSearch";

export type ProviderResult = {
  name: string;
  url: string;
  snippet?: string;
  phone?: string;
  email?: string;
  address?: string;
};

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const EMAIL_REGEX = /[a-zA-Z0.9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_REGEX = /(\+52\s?)?(\(\d{2,3}\)\s?)?\d{2,4}[\s.-]?\d{2,4}[\s.-]?\d{2,4}(\s?\d{2,4})?|\d{10,11}/g;
const MAILTO_REGEX = /href\s*=\s*["']mailto:([^"'\s]+)["']/gi;
const TEL_REGEX = /href\s*=\s*["']tel:([^"'\s]+)["']/gi;

function extractEmails(html: string): string[] {
  const set = new Set<string>();
  let m: RegExpExecArray | null;
  const re1 = new RegExp(EMAIL_REGEX.source, "g");
  while ((m = re1.exec(html)) !== null) set.add(m[0].toLowerCase());
  while ((m = MAILTO_REGEX.exec(html)) !== null) set.add(m[1].toLowerCase().replace(/^mailto:/i, ""));
  return Array.from(set).filter((e) => !/example|test@|@domain\.com|\.png|\.jpg|wixpress|sentry|google|facebook|twitter/i.test(e)).slice(0, 3);
}

function extractPhones(html: string): string[] {
  const set = new Set<string>();
  let m: RegExpExecArray | null;
  const re1 = new RegExp(TEL_REGEX.source, "gi");
  while ((m = re1.exec(html)) !== null) {
    const tel = m[1].replace(/\s/g, "").replace(/^\+52/, "").trim();
    if (tel.length >= 10) set.add(tel);
  }
  const re2 = new RegExp(PHONE_REGEX.source, "g");
  while ((m = re2.exec(html)) !== null) {
    const tel = m[0].replace(/\D/g, "");
    if (tel.length >= 10) set.add(tel.slice(-10));
  }
  return Array.from(set).slice(0, 2);
}

async function scrapeContact(url: string, title: string): Promise<Partial<ProviderResult>> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return { name: title, url };
    const html = await res.text();
    const slice = html.slice(0, 80000);
    const emails = extractEmails(slice);
    const phones = extractPhones(slice);
    return {
      name: title || new URL(url).hostname.replace(/^www\./, ""),
      url,
      email: emails[0],
      phone: phones[0] ? (phones[0].length === 10 ? `+52 ${phones[0].slice(0, 2)} ${phones[0].slice(2, 5)} ${phones[0].slice(5)}` : phones[0]) : undefined,
    };
  } catch {
    return { name: title, url };
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ providers: ProviderResult[]; error?: string }>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ providers: [], error: "Método no permitido" });
  }

  const { query: searchQuery, location, type } = (req.body || {}) as {
    query?: string;
    location?: string;
    type?: string;
  };

  const q = [searchQuery || "proveedores EHS seguridad industrial", type, location]
    .filter(Boolean)
    .join(" ");
  const fullQuery = `${q} México certificado autorizado distribuidor`.trim();

  try {
    const results = await searchWeb(fullQuery, { advanced: true, maxResults: 8 });
    const toScrape = results.slice(0, 5).map((r) => ({
      title: r.title,
      url: r.url,
      content: r.content,
    }));

    const raw = await Promise.all(
      toScrape.map((r) =>
        scrapeContact(r.url ?? "", r.title ?? "").then((p) => ({
          ...p,
          snippet: r.content?.slice(0, 160),
        }))
      )
    );
    const providers: ProviderResult[] = raw.map((p) => ({
      name: p.name ?? "Proveedor",
      url: p.url ?? "",
      snippet: p.snippet,
      phone: p.phone,
      email: p.email,
      address: p.address,
    }));

    return res.status(200).json({ providers });
  } catch (err) {
    console.error("[searchProviders]", err);
    return res.status(200).json({
      providers: [],
      error: "Error al buscar proveedores. Intenta más tarde.",
    });
  }
}
