"use client";

import React from "react";

export interface RiskTableProps {
  headers: string[];
  rows: string[][];
  className?: string;
}

const LEVEL_COLUMN_NAMES = /nivel|level|riesgo/i;
const LEVEL_CHIP: Record<string, { label: string; className: string }> = {
  bajo: { label: "Bajo", className: "bg-emerald-500/20 text-emerald-300 border-emerald-400/40" },
  medio: { label: "Medio", className: "bg-amber-500/20 text-amber-300 border-amber-400/40" },
  moderado: { label: "Moderado", className: "bg-amber-500/20 text-amber-300 border-amber-400/40" },
  "medio-alto": { label: "Medio-Alto", className: "bg-orange-500/20 text-orange-300 border-orange-400/40" },
  medioalto: { label: "Medio-Alto", className: "bg-orange-500/20 text-orange-300 border-orange-400/40" },
  alto: { label: "Alto", className: "bg-red-500/20 text-red-300 border-red-400/40" },
  crítico: { label: "Crítico", className: "bg-red-500/20 text-red-300 border-red-400/40" },
  critico: { label: "Crítico", className: "bg-red-500/20 text-red-300 border-red-400/40" },
};

function getLevelChip(value: string): React.ReactNode {
  const v = value.trim().toLowerCase().replace(/\s+/g, "");
  const normalized = v.replace(/-/g, "");
  const chip =
    LEVEL_CHIP[v] ??
    LEVEL_CHIP[normalized] ??
    Object.entries(LEVEL_CHIP).find(([k]) => v.includes(k.replace(/-/g, "")))?.[1];
  if (chip) {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border ${chip.className}`}
      >
        {chip.label}
      </span>
    );
  }
  if (/\b🟢|verde|low\b/i.test(v)) return <span className="text-emerald-400">🟢 Bajo</span>;
  if (/\b🟡|amarillo|moderado|medium\b/i.test(v)) return <span className="text-amber-400">🟡 Moderado</span>;
  if (/\b🟠|naranja|medio-alto|medioalto\b/i.test(v)) return <span className="text-orange-400">🟠 Medio-Alto</span>;
  if (/\b🔴|rojo|alto|crítico|critico|critical\b/i.test(v)) return <span className="text-red-400">🔴 Alto</span>;
  return value;
}

export default function RiskTable({ headers, rows, className = "" }: RiskTableProps) {
  const levelColIndex = headers.findIndex((h) => LEVEL_COLUMN_NAMES.test(h));

  return (
    <div
      className={`overflow-x-auto rounded-lg border border-white/15 bg-white/5 ${className}`}
      style={{ maxWidth: "100%" }}
    >
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr className="sticky top-0 z-10 bg-navy-900/95 backdrop-blur border-b border-white/15">
            {headers.map((h, i) => (
              <th
                key={i}
                className="px-4 py-3 text-center font-semibold text-gray-200 whitespace-nowrap"
              >
                {h.trim()}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIdx) => (
            <tr
              key={rowIdx}
              className={
                rowIdx % 2 === 0
                  ? "bg-white/[0.03] border-b border-white/10"
                  : "bg-white/[0.06] border-b border-white/10"
              }
            >
              {row.map((cell, cellIdx) => (
                <td
                  key={cellIdx}
                  className="px-4 py-2.5 text-gray-300 align-top whitespace-normal break-words"
                  style={{ maxWidth: cellIdx === 0 || cellIdx === 1 ? 220 : undefined }}
                >
                  {levelColIndex === cellIdx ? getLevelChip(cell) : cell.trim()}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
