"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import type { ProviderResult } from "../../pages/api/searchProviders";

const proseCard =
  "prose prose-invert prose-sm max-w-none [&>p]:mb-2 [&>ul]:my-2 [&>ol]:my-2 [&>li]:my-0.5 text-gray-200 leading-relaxed";

type Props = {
  title: string;
  content: string;
  defaultSearchQuery?: string;
  defaultLocation?: string;
};

export default function ProvidersCard({
  title,
  content,
  defaultSearchQuery = "proveedores EHS seguridad industrial",
  defaultLocation = "",
}: Props) {
  const [providers, setProviders] = useState<ProviderResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState(defaultSearchQuery);
  const [location, setLocation] = useState(defaultLocation);

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    setProviders([]);
    try {
      const res = await fetch("/api/searchProviders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: query.trim() || defaultSearchQuery,
          location: location.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (data.error) setError(data.error);
      else setProviders(data.providers || []);
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className={proseCard}>
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>

      <div className="rounded-lg border border-blue-400/30 bg-blue-500/10 p-3 space-y-3">
        <p className="text-sm font-medium text-blue-200">
          Buscar proveedores reales y certificados en internet
        </p>
        <div className="flex flex-wrap gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ej: EPP, ventilación, capacitación..."
            className="flex-1 min-w-[180px] px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50"
          />
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Ciudad o estado (opcional)"
            className="w-[140px] px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50"
          />
          <button
            type="button"
            onClick={handleSearch}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:opacity-70 text-white text-sm font-medium transition-colors"
          >
            {loading ? "Buscando…" : "Buscar proveedores"}
          </button>
        </div>
        {error && <p className="text-sm text-amber-300">{error}</p>}
      </div>

      {providers.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-white">Resultados con información de contacto</h4>
          <ul className="space-y-3">
            {providers.map((p, i) => (
              <li
                key={i}
                className="rounded-lg border border-white/15 bg-white/5 p-3 text-sm"
              >
                <div className="font-medium text-white mb-1.5">{p.name}</div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-gray-300">
                  {p.url && (
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-300 hover:underline"
                    >
                      🌐 Sitio web
                    </a>
                  )}
                  {p.phone && (
                    <a href={`tel:${p.phone.replace(/\s/g, "")}`} className="hover:text-white">
                      📞 {p.phone}
                    </a>
                  )}
                  {p.email && (
                    <a href={`mailto:${p.email}`} className="hover:text-white">
                      📧 {p.email}
                    </a>
                  )}
                </div>
                {p.snippet && (
                  <p className="mt-2 text-gray-400 text-xs line-clamp-2">{p.snippet}</p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
