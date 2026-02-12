/**
 * Exportación PDF WYSIWYG: imprime exactamente el contenido visible.
 * El área imprimible tiene data-report-content; el botón marca esa área con
 * la clase report-to-print-visible para que @media print solo la muestre.
 */

const VISIBLE_CLASS = "report-to-print-visible";

export function triggerPrint(printAreaRef: HTMLElement | null) {
  if (typeof window === "undefined" || !printAreaRef) return;
  document.querySelectorAll("[data-report-content]").forEach((el) => {
    el.classList.remove(VISIBLE_CLASS);
  });
  printAreaRef.classList.add(VISIBLE_CLASS);
  window.print();
  printAreaRef.classList.remove(VISIBLE_CLASS);
}
