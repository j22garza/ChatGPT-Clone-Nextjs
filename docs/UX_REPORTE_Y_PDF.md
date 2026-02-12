# UX Reporte, Tablas y PDF (Connie EHS)

## Detección de tablas y secciones

### Cuándo se muestra la vista "Reporte" (cards)

- Se usa cuando la respuesta de Connie contiene **encabezados de sección** reconocidos:
  - `## Resumen Ejecutivo`
  - `## Tabla de Riesgos` / `## Riesgos priorizados`
  - `## Controles` (por Jerarquía, inmediatos, estructurales)
  - `## Soluciones` / `## Recomendaciones`
  - `## Próximo paso`
  - `## Supuestos` / `## Falta información`

- Implementación: `app/utils/parseReportSections.ts`
  - `looksLikeReport(markdown)`: devuelve `true` si el texto contiene al menos uno de los encabezados anteriores.
  - `parseReport(markdown)`: devuelve `{ intro, sections }`. El `intro` es todo lo anterior al primer `##`; cada `section` tiene `title`, `content`, `type` (`"text"` o `"risk_table"`) y opcionalmente `tableData` (headers + rows).

### Cuándo una sección se renderiza como RiskTable

- Si el **título** de la sección coincide con "Tabla de Riesgos" o "Riesgos priorizados", el **contenido** se intenta parsear como tabla Markdown (líneas que empiezan y terminan con `|`).
- Si hay al menos 2 líneas tipo `| A | B |` y una línea separadora `| --- | --- |`, se extraen `headers` y `rows` y se renderiza con el componente `<RiskTable />` en lugar de Markdown crudo.
- Así se evita depender del Markdown de tabla bien formado en todo el mensaje: solo hace falta que la sección "Tabla de Riesgos" contenga una tabla parseable.

### Cuándo aparece el botón "Descargar PDF"

- El botón **Descargar PDF** se muestra en respuestas de Connie cuando:
  1. `looksLikeReport(message.text)` es `true`, y  
  2. `parseReport(message.text).sections.length > 0`.

- Es decir: solo en mensajes que se están mostrando como reporte en cards (con al menos una sección detectada).

## Exportación PDF (WYSIWYG)

- Al hacer clic en **Descargar PDF** se marca el bloque de ese mensaje con la clase `report-to-print-visible` y se llama a `window.print()`.
- Los estilos de impresión (`@media print` en `app/globals.css`) ocultan todo excepto el elemento con esa clase, que se muestra con fondo blanco, texto negro y sin cortar filas de tabla ni cards (break-inside: avoid).
- Si hay varios mensajes con reporte, solo se imprime el del mensaje cuyo botón se pulsó (cada bloque tiene `data-report-content` y un ref; el botón pasa ese ref a `triggerPrint(ref)`).
- El usuario en el diálogo de impresión elige **Guardar como PDF** para obtener el archivo.
- Contenido del PDF: las **ReportCards** de ese mensaje. La fecha, empresa o sector no se inyectan automáticamente; si se desea, añadirlos en el `intro` del reporte o en una card "Metadatos" generada por backend.

## Componentes

| Componente        | Uso |
|------------------|-----|
| `RiskTable`      | Tabla con sticky header, filas zebra, chips de nivel (Bajo/Medio/Alto/Crítico). Se usa en ReportCards para la sección "Tabla de Riesgos" y en Markdown genérico (tablas envueltas en `.markdown-table-wrap`). |
| `ReportCards`    | Lista de cards por sección; cada una puede ser texto (Markdown) o `RiskTable` si `section.tableData` existe. |
| `useAutoScroll`  | Hook que hace scroll al final del chat solo si el usuario está cerca del fondo; si ha subido, no arrastra. |
| `pdfExport.ts`   | `triggerPrint(printAreaRef)` marca el nodo con la clase `report-to-print-visible` y llama a `window.print()`. En @media print solo se muestra ese nodo. |

## Verificación manual sugerida

1. **Scroll**: Abrir un chat con varios mensajes, subir el scroll y enviar un mensaje nuevo; no debe forzar el scroll al final. Bajar cerca del final y enviar otro; debe bajar al nuevo mensaje.
2. **Tablas**: Respuesta con tabla Markdown (o sección "Tabla de Riesgos" con tabla); debe verse con encabezado fijo, filas alternadas y niveles con chips de color en móvil y desktop (overflow horizontal si hace falta).
3. **Reporte**: Respuesta con `## Resumen Ejecutivo` y `## Tabla de Riesgos`; debe verse como cards y botón "Descargar PDF".
4. **PDF**: Pulsar "Descargar PDF", elegir "Guardar como PDF"; el resultado debe coincidir con la vista de reporte (cards y tabla).
5. **Sugerencias**: Tras "Somos del sector construcción", los chips deben cambiar a tareas (altura, izaje, excavación, etc.). Tras indicar tarea, deben aparecer opciones de frecuencia/expuestos.
