"use client";

import { motion } from "framer-motion";
import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ChatMessageItem } from "../context/ChatContext";
import {
  looksLikeReport,
  parseReport,
} from "../utils/parseReportSections";
import { triggerPrint } from "../utils/pdfExport";
import ReportCards from "./ReportCards";

type Props = { message: ChatMessageItem };

const markdownComponents: React.ComponentProps<typeof ReactMarkdown>["components"] = {
  h1: ({ children }) => <h1 className="text-xl font-semibold mt-6 mb-3 text-white">{children}</h1>,
  h2: ({ children }) => <h2 className="text-lg font-semibold mt-5 mb-2 text-white">{children}</h2>,
  h3: ({ children }) => <h3 className="text-base font-semibold mt-4 mb-2 text-white">{children}</h3>,
  p: ({ children }) => <p className="mb-3 text-gray-200">{children}</p>,
  ul: ({ children }) => <ul className="my-3 pl-5 list-disc">{children}</ul>,
  ol: ({ children }) => <ol className="my-3 pl-5 list-decimal">{children}</ol>,
  li: ({ children }) => <li className="my-1 text-gray-200">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-blue-500/50 pl-4 italic my-3 text-gray-300">
      {children}
    </blockquote>
  ),
  code: ({ className, children, ...props }) => (
    <code
      className={"bg-white/10 px-1.5 py-0.5 rounded text-sm " + (className || "")}
      {...props}
    >
      {children}
    </code>
  ),
  pre: ({ children }) => (
    <pre className="bg-white/5 p-4 rounded-lg overflow-x-auto my-3 text-sm">
      {children}
    </pre>
  ),
  table: ({ children }) => (
    <div className="markdown-table-wrap my-4">
      <table>{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead>{children}</thead>,
  tbody: ({ children }) => <tbody>{children}</tbody>,
  tr: ({ children }) => <tr>{children}</tr>,
  th: ({ children }) => (
    <th className="px-4 py-3 text-left font-semibold text-gray-200 whitespace-nowrap">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="px-4 py-2 text-gray-300 whitespace-normal break-words">{children}</td>
  ),
};

function hasMarkdownTable(text: string): boolean {
  const lines = text.split(/\n/).filter((l) => l.trim().startsWith("|"));
  return lines.length >= 2;
}

function Message({ message }: Props) {
  const isConnie = message.user.name === "Connie";
  const isReport = isConnie && looksLikeReport(message.text);
  const parsed = isReport ? parseReport(message.text) : null;
  const reportPrintRef = React.useRef<HTMLDivElement>(null);
  const hasTable = isConnie && hasMarkdownTable(message.text);
  const showPdfButton = isConnie && (parsed?.sections?.length ? true : hasTable);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="group py-6 px-4 sm:px-6 md:px-8"
    >
      <div className="flex items-start gap-4 max-w-3xl mx-auto">
        <div className="flex-shrink-0">
          {isConnie ? (
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
              <span className="text-lg">🤖</span>
            </div>
          ) : (
            <img
              src={message.user.avatar}
              alt={message.user.name}
              className="w-8 h-8 rounded-lg object-cover"
            />
          )}
        </div>
        <div className="flex-1 min-w-0 pt-0.5">
          {isConnie && (
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-semibold text-white">Connie</span>
              <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded-md border border-blue-400/30">
                EHS
              </span>
            </div>
          )}
          <div
            className={
              isConnie ? "text-gray-100 prose-chat" : "text-gray-300 prose-chat"
            }
          >
            {parsed ? (
              <>
                {parsed.intro && (
                  <div className="mb-4">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                      {parsed.intro}
                    </ReactMarkdown>
                  </div>
                )}
                {parsed.sections.length > 0 && (
                  <div
                    ref={reportPrintRef}
                    data-report-content
                    className="space-y-4"
                  >
                    <ReportCards sections={parsed.sections} />
                  </div>
                )}
                {showPdfButton && (
                  <div className="flex flex-wrap items-center gap-2 pt-2 print:hidden">
                    <button
                      type="button"
                      onClick={() => triggerPrint(reportPrintRef.current)}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
                    >
                      Descargar PDF
                    </button>
                  </div>
                )}
              </>
            ) : (
              <>
                <div
                  ref={hasTable ? reportPrintRef : undefined}
                  data-report-content={hasTable ? true : undefined}
                >
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                    {message.text}
                  </ReactMarkdown>
                </div>
                {showPdfButton && (
                  <div className="flex flex-wrap items-center gap-2 pt-2 print:hidden">
                    <button
                      type="button"
                      onClick={() => triggerPrint(reportPrintRef.current)}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
                    >
                      Descargar PDF
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default Message;
