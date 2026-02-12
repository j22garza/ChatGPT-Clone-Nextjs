# Pruebas manuales — conversaciones EHS (Connie)

Objetivo: validar el flujo conversacional (una pregunta a la vez, estado derivado, matriz P×E×C, output contract) en tres sectores.

---

## 1. Manufactura

**Objetivo:** Llevar de triage a análisis de riesgo con tabla y controles.

| Paso | Usuario | Comportamiento esperado de Connie |
|------|--------|-----------------------------------|
| 1 | "Necesito hacer un análisis de riesgo en mi planta." | TRIAGE → 1 pregunta (ej. sector/ubicación o proceso específico). Progreso: Paso 1–2/8. |
| 2 | "Sector manufactura, Monterrey. Tenemos torno CNC y soldadura." | CONTEXT/HAZARD_ID → 1 pregunta (ej. personas expuestas, frecuencia, controles actuales). |
| 3 | "Un operador por turno en cada área, exposición diaria. Ya tenemos EPP y extractores." | HAZARD_ID/RISK_SCORING → Si hay suficientes datos, tabla con columnas Proceso/Tarea, Peligro, P, E, C, Score, Nivel, Controles; máx. 3–5 riesgos; 1 pregunta de cierre. |
| 4 | "P=3 E=4 C=4 para atrapamiento en torno." | RISK_SCORING → Cálculo mostrado (bruto 48, norm 10, nivel moderado). Controles por jerarquía; 1 pregunta. |
| 5 | "Dame criterios para proveedores de resguardos." | PROVIDERS → 3 categorías + certificaciones/evidencias a pedir + cómo evaluar; sin inventar marcas. |

**Validar:**  
- En ningún turno Connie hace más de 1 pregunta visible (resto en “Supuestos”).  
- Tabla Markdown estable: Proceso/Tarea | Peligro | P | E | C | Score | Nivel | Controles.  
- Progreso “Paso N/8” coherente con el estado.

---

## 2. Construcción

**Objetivo:** Contexto rápido vía chips y llegada a riesgo en alturas.

| Paso | Usuario | Comportamiento esperado de Connie |
|------|--------|-----------------------------------|
| 1 | Clic chip "Sector: Construcción" + "Trabajamos en alturas y excavaciones." | TRIAGE/CONTEXT → 1 pregunta (ubicación, # empleados, tipo de obra). |
| 2 | "CDMX, 15 empleados, obra civil y estructuras." | CONTEXT/HAZARD_ID → 1 pregunta sobre controles actuales o tarea más crítica. |
| 3 | "La tarea más crítica es izaje y andamios. Exposición diaria." | HAZARD_ID → Identificación de peligros (caída, golpe, atrapamiento); 1 pregunta (ej. P/E/C o controles). |
| 4 | "¿Cómo calculo el riesgo? Dame un ejemplo con P=4 E=4 C=5." | RISK_SCORING → bruto 80, norm 16, nivel medio-alto; justificación por factor. Controles inmediatos y estructurales; 1 pregunta. |
| 5 | "Qué normativa aplica para andamios en México?" | Si hay búsqueda web: cita [[1]](url); si no, criterios sin inventar artículos. 1 pregunta o cierre. |

**Validar:**  
- Chips rellenan/concatenan bien el mensaje.  
- No se inventan NOMs; se pide verificar en fuente oficial si hace falta.  
- Progreso actualizado tras cada respuesta.

---

## 3. Químico

**Objetivo:** Riesgo químico, estimación cuando no hay P/E/C numéricos y proveedores sin BD.

| Paso | Usuario | Comportamiento esperado de Connie |
|------|--------|-----------------------------------|
| 1 | "Industria química. Manipulamos solventes y ácidos." | TRIAGE/CONTEXT → 1 pregunta (ventilación, EPP, procedimientos, personas expuestas). |
| 2 | "Hay ventilación local y EPP. 8 personas, exposición varias horas al día." | HAZARD_ID → Riesgos (inhalación, contacto, incendio); si no hay P/E/C, sugerir rangos y marcar “estimación preliminar”. 1 pregunta. |
| 3 | "No tengo P E C exactos, es exposición diaria de varias personas." | RISK_SCORING → Helper sugiere E alto; P y C en rango; “estimación preliminar” y pide confirmar. Tabla con top 3–5. |
| 4 | "Necesito tipos de proveedores para control químico, sin marcas." | PROVIDERS → Categorías (ej. distribuidores EPP químico, ingeniería ventilación, laboratorio higiene industrial, consultor ISO); qué certificaciones/evidencias pedir; cómo evaluar. Sin inventar empresas. |
| 5 | "Resumen y próximo paso." | CLOSE → Resumen ejecutivo, próximo paso claro, 1 pregunta final o cierre. |

**Validar:**  
- Bloque “Contexto de riesgo” (cuando aplica) con P/E/C estimados y “estimación preliminar”.  
- Proveedores solo como categorías y criterios, sin nombres inventados.  
- Estado CLOSE cuando se pide resumen/próximo paso; posiblemente Paso 8/8.

---

## Checklist global

- [ ] Una sola pregunta por turno (salvo CLOSE).  
- [ ] Tabla de riesgos con columnas: Proceso/Tarea | Peligro | P | E | C | Score | Nivel | Controles.  
- [ ] P×E×C: bruto, norm = round(bruto/5), niveles 1–8 bajo, 9–12 moderado, 13–18 medio-alto, 19–25 alto.  
- [ ] Proveedores: categorías + criterios; sin inventar marcas.  
- [ ] Si hay bloque “Información actualizada de internet”: cita tipo [[n]](url) o “Fuente web (sin URL)”.  
- [ ] Chips y “Progreso: Paso N/8” visibles y coherentes.  
- [ ] Compatibilidad con Groq y OpenAI sin errores.

---

## Ejemplos por nivel de preparación (readiness)

### Usuario: "Somos del sector construcción."

- **readiness:** LOW (solo industria, sin tarea específica ni exposición).
- **Comportamiento:** Modo exploración. Se inyecta `EXPLORATION_INSTRUCTION`.
- **Respuesta esperada (ejemplo):** Sin tablas, sin scoring, sin resumen ejecutivo. Una sola pregunta, por ejemplo:
  - *"Para poder orientarte bien, necesito acotar el alcance. ¿Cuál es la tarea o actividad más crítica en la que quieres enfocar el análisis de riesgo (por ejemplo: trabajo en alturas, excavaciones, izaje, manejo de materiales)?"*
  - O: *"¿En qué proceso o tarea específica quieres que enfoquemos el análisis (ej. andamios, excavación, soldadura en obra)?"*
- **No debe incluir:** Tabla de riesgos, columnas P/E/C/Score, resumen ejecutivo, números inventados.

### Usuario: "Hacemos mantenimiento en altura semanalmente con 5 trabajadores."

- **readiness:** HIGH (industria implícita por “mantenimiento en altura”, tarea clara, frecuencia “semanalmente”, exposición “5 trabajadores”).
- **Comportamiento:** Modo análisis. Se inyecta `OUTPUT_CONTRACT` y se permite scoring si hay P/E/C.
- **Respuesta esperada (ejemplo):** Resumen ejecutivo, tabla de riesgos (Proceso/Tarea | Peligro | P | E | C | Score | Nivel | Controles), controles por jerarquía, soluciones, criterios de proveedores o tipos, y próximo paso con 1 pregunta.
- **Puede incluir:** Tabla con top 3–5 riesgos (caída, golpe por objeto, atrapamiento, etc.), niveles según P×E×C cuando el usuario confirme o se estimen, controles inmediatos y estructurales.
