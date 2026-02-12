/**
 * Generador local de sugerencias contextuales (no depende del LLM).
 * Basado en readiness: sector, tarea, exposición, controles.
 * Máximo 3–5 chips que cambian con el estado.
 */

import type { ChatMessageItem } from "../context/ChatContext";
import {
  getConversationReadiness,
  type ReadinessLevel,
} from "./conversationReadiness";

export interface SuggestionChip {
  label: string;
  text: string;
}

const SECTOR_CHIPS: SuggestionChip[] = [
  { label: "Construcción", text: "Somos del sector construcción." },
  { label: "Manufactura", text: "Mi sector es manufactura." },
  { label: "Químico", text: "Industria química." },
  { label: "Minería", text: "Sector minería." },
  { label: "Servicios", text: "Sector servicios." },
];

const TASK_BY_SECTOR: Record<string, SuggestionChip[]> = {
  construcción: [
    { label: "Trabajo en altura", text: "La tarea principal es trabajo en altura." },
    { label: "Izaje / grúas", text: "Tareas de izaje y grúas." },
    { label: "Excavación", text: "Excavación y movimiento de tierras." },
    { label: "Eléctricos", text: "Trabajos eléctricos en obra." },
  ],
  construccion: [
    { label: "Trabajo en altura", text: "La tarea principal es trabajo en altura." },
    { label: "Izaje / grúas", text: "Tareas de izaje y grúas." },
    { label: "Excavación", text: "Excavación y movimiento de tierras." },
    { label: "Eléctricos", text: "Trabajos eléctricos en obra." },
  ],
  manufactura: [
    { label: "Soldadura", text: "La tarea es soldadura." },
    { label: "Prensas / troquelado", text: "Operación de prensas y troquelado." },
    { label: "Químicos / pintura", text: "Manejo de químicos y pintura." },
    { label: "CNC / torno", text: "Operación de CNC o torno." },
  ],
  químico: [
    { label: "Manejo de químicos", text: "Manejo de sustancias químicas." },
    { label: "Almacenamiento", text: "Almacenamiento y trasvase de productos." },
  ],
  quimico: [
    { label: "Manejo de químicos", text: "Manejo de sustancias químicas." },
    { label: "Almacenamiento", text: "Almacenamiento y trasvase de productos." },
  ],
  minería: [
    { label: "Espacio confinado", text: "Trabajos en espacio confinado." },
    { label: "Maquinaria pesada", text: "Operación de maquinaria pesada." },
  ],
  mineria: [
    { label: "Espacio confinado", text: "Trabajos en espacio confinado." },
    { label: "Maquinaria pesada", text: "Operación de maquinaria pesada." },
  ],
  servicios: [
    { label: "Mantenimiento", text: "La tarea principal es mantenimiento." },
    { label: "Limpieza", text: "Limpieza y desinfección." },
  ],
};

const EXPOSURE_CHIPS: SuggestionChip[] = [
  { label: "¿Cuántas personas?", text: "¿Cuántas personas están expuestas y con qué frecuencia?" },
  { label: "Frecuencia diaria", text: "La exposición es diaria, turno completo." },
  { label: "Frecuencia semanal", text: "La exposición es semanal." },
  { label: "Ocasional", text: "Exposición ocasional, no todos los días." },
];

const CONTROLS_CHIPS: SuggestionChip[] = [
  { label: "¿Controles actuales?", text: "¿Qué controles existen hoy (ingeniería, administrativos, EPP)?" },
  { label: "Solo EPP", text: "Por ahora solo usamos EPP." },
  { label: "Controles de ingeniería", text: "Tenemos controles de ingeniería instalados." },
  { label: "Ver tabla de riesgos", text: "¿Puedes darme la tabla de riesgos priorizados con controles?" },
];

function lastMessageIsReport(messages: ChatMessageItem[]): boolean {
  const last = messages.filter((m) => m.user.name === "Connie").pop();
  if (!last?.text) return false;
  const t = last.text.toLowerCase();
  return (
    /resumen\s*ejecutivo|tabla\s*de\s*riesgos|pr[oó]ximo\s*paso|controles\s*por\s*jerarquía/.test(t) &&
    (t.length > 400 || /\n##\s/.test(last.text))
  );
}

const DEFAULT_CHIPS: SuggestionChip[] = [
  { label: "Evaluar riesgos de mi área", text: "Quiero evaluar los riesgos de mi área o proceso." },
  { label: "Sector: Construcción", text: "Somos del sector construcción." },
  { label: "Sector: Manufactura", text: "Mi sector es manufactura." },
  { label: "Cumplimiento normativo", text: "Necesito revisar cumplimiento normativo." },
  { label: "Ubicación", text: "Estamos en CDMX." },
];

const POST_REPORT_CHIPS: SuggestionChip[] = [
  { label: "Ver controles en detalle", text: "¿Puedes detallar los controles sugeridos (inmediatos y estructurales)?" },
  { label: "Criterios para proveedores", text: "¿Qué criterios o certificaciones debo pedir a proveedores (EPP, equipos, capacitación)?" },
  { label: "Necesito presupuesto", text: "Necesito orientación para presupuesto o cotización con proveedores." },
  { label: "Otra tarea o riesgo", text: "Quiero evaluar otra tarea o riesgo en la misma planta." },
  { label: "Cerrar y guardar", text: "Con esto tengo suficiente por ahora, gracias." },
];

function detectSectorFromMessages(messages: ChatMessageItem[]): string | null {
  const text = messages.map((m) => m.text).join(" ").toLowerCase();
  if (/\bconstrucci[oó]n\b/.test(text)) return "construcción";
  if (/\bconstruccion\b/.test(text)) return "construccion";
  if (/\bmanufactura\b/.test(text)) return "manufactura";
  if (/\bqu[ií]mico\b/.test(text)) return "químico";
  if (/\bquimico\b/.test(text)) return "quimico";
  if (/\bminer[ií]a\b/.test(text)) return "minería";
  if (/\bmineria\b/.test(text)) return "mineria";
  if (/\bservicios\b/.test(text)) return "servicios";
  return null;
}

const MAX_CHIPS = 5;

/**
 * Devuelve 3–5 chips contextuales según el estado de la conversación.
 * - Sin industria → sectores.
 * - Con industria pero sin tarea → tareas típicas del sector.
 * - Con tarea pero sin exposición → frecuencia / cuántas personas.
 * - Con exposición → controles actuales.
 */
export function getContextualSuggestions(messages: ChatMessageItem[]): SuggestionChip[] {
  if (messages.length === 0) return DEFAULT_CHIPS.slice(0, MAX_CHIPS);

  if (lastMessageIsReport(messages)) {
    return POST_REPORT_CHIPS.slice(0, MAX_CHIPS);
  }

  const history = messages.map((m) => ({
    role: m.user.name === "Connie" ? "assistant" : "user",
    content: m.text,
  }));
  const lastUser = messages.filter((m) => m.user.name !== "Connie").pop()?.text ?? "";
  const readiness = getConversationReadiness(history, lastUser);
  const sector = detectSectorFromMessages(messages);

  if (readiness.readinessLevel === "HIGH") {
    return CONTROLS_CHIPS.slice(0, MAX_CHIPS);
  }

  // MEDIUM: tienen tarea pero falta exposición
  if (readiness.readinessLevel === "MEDIUM") {
    return EXPOSURE_CHIPS.slice(0, MAX_CHIPS);
  }

  // LOW: tienen industria (o nada) → tareas por sector o sectores
  if (readiness.hasIndustry && sector && TASK_BY_SECTOR[sector]) {
    return TASK_BY_SECTOR[sector].slice(0, MAX_CHIPS);
  }

  if (readiness.hasIndustry && !readiness.hasSpecificTask) {
    return TASK_BY_SECTOR.construcción.concat(TASK_BY_SECTOR.manufactura)
      .filter((c, i, a) => a.findIndex((x) => x.text === c.text) === i)
      .slice(0, MAX_CHIPS);
  }

  return SECTOR_CHIPS.slice(0, MAX_CHIPS);
}
