/**
 * Parsea el markdown de una respuesta tipo reporte en secciones para ReportCards.
 * Detecta: Resumen Ejecutivo, Tabla de Riesgos, Controles, Soluciones, Próximo paso, etc.
 * Para "Tabla de Riesgos" intenta extraer filas (regex/parse) para renderizar con RiskTable.
 */

export interface ReportSection {
  title: string;
  content: string;
  type: "text" | "risk_table";
  tableData?: { headers: string[]; rows: string[][] };
}

const SECTION_HEADERS =
  /^##\s*(Resumen\s*Ejecutivo|Tabla\s*de\s*Riesgos?|Riesgos?\s*priorizados|Controles?\s*(por\s*Jerarquía|inmediatos|estructurales)?|Soluciones?|Pr[oó]ximo\s*paso|Recomendaciones?|Supuestos?|Falta\s*informaci[oó]n)/im;

/**
 * Encuentra todas las secciones ## Título y extrae título + contenido hasta el siguiente ##.
 */
export function parseReportSections(markdown: string): ReportSection[] {
  const sections: ReportSection[] = [];
  const lines = markdown.split(/\r?\n/);
  let i = 0;

  while (i < lines.length) {
    const match = lines[i].match(/^##\s*(.+)$/);
    if (match) {
      const title = match[1].trim();
      const start = i + 1;
      i++;
      while (i < lines.length && !lines[i].startsWith("##")) i++;
      const content = lines.slice(start, i).join("\n").trim();
      const isRiskTable =
        /tabla\s*de\s*riesgos?|riesgos?\s*priorizados/i.test(title) && content.length > 0;
      const tableData = isRiskTable ? parseMarkdownTable(content) : undefined;
      sections.push({
        title,
        content,
        type: tableData ? "risk_table" : "text",
        tableData,
      });
      continue;
    }
    i++;
  }

  return sections;
}

/**
 * Parsea un bloque de texto que puede contener una tabla en Markdown (líneas con |).
 * Devuelve { headers, rows } o undefined si no hay tabla válida.
 */
export function parseMarkdownTable(text: string): { headers: string[]; rows: string[][] } | undefined {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.startsWith("|") && l.endsWith("|"));
  if (lines.length < 2) return undefined;

  const parseRow = (line: string): string[] =>
    line
      .slice(1, -1)
      .split("|")
      .map((c) => c.trim().replace(/\\\|/g, "|"));

  const headerRow = parseRow(lines[0]);
  const sep = lines[1];
  if (!/^\|[\s\-:]+\|/.test(sep)) return undefined;
  const rows = lines.slice(2).map(parseRow).filter((r) => r.some((c) => c.length > 0));
  return { headers: headerRow, rows };
}

/**
 * Indica si el texto parece un reporte (tiene al menos una sección conocida).
 */
export function looksLikeReport(markdown: string): boolean {
  return SECTION_HEADERS.test(markdown);
}

export interface ParsedReport {
  intro: string;
  sections: ReportSection[];
}

/**
 * Parsea reporte y devuelve intro (antes del primer ##) y secciones.
 */
export function parseReport(markdown: string): ParsedReport {
  const sections = parseReportSections(markdown);
  if (sections.length === 0) return { intro: markdown, sections: [] };
  const firstHeader = markdown.search(/^##\s/m);
  const intro = firstHeader >= 0 ? markdown.slice(0, firstHeader).trim() : "";
  return { intro, sections };
}
