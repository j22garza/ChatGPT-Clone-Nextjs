"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import type { ReportSection } from "../utils/parseReportSections";
import RiskTable from "./RiskTable";

type Props = {
  sections: ReportSection[];
  className?: string;
  /** Ref for the printable area (PDF export) */
  printRef?: React.RefObject<HTMLDivElement>;
};

const cardTitleClass =
  "text-base font-semibold text-white mb-2 pb-2 border-b border-white/20";
const proseCard =
  "prose prose-invert prose-sm max-w-none [&>p]:mb-2 [&>ul]:my-2 [&>ol]:my-2 [&>li]:my-0.5 text-gray-200 leading-relaxed";

export default function ReportCards({ sections, className = "", printRef }: Props) {
  if (sections.length === 0) return null;

  return (
    <div ref={printRef} className={`space-y-4 ${className}`}>
      {sections.map((sec, i) => (
        <section
          key={i}
          className="rounded-xl border border-white/15 bg-white/5 p-4 md:p-5 shadow-lg print:break-inside-avoid print:shadow-none print:border print:bg-white print:border-gray-300"
        >
          <h3 className={cardTitleClass}>{sec.title}</h3>
          {sec.type === "risk_table" && sec.tableData && (
            <RiskTable
              headers={sec.tableData.headers}
              rows={sec.tableData.rows}
              className="mt-2"
            />
          )}
          {sec.type === "text" && sec.content && (
            <div className={proseCard}>
              <ReactMarkdown>{sec.content}</ReactMarkdown>
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
