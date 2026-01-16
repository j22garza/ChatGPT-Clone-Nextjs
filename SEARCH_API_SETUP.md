# Configuración de API de Búsqueda Web para Connie

## Opciones Recomendadas

### 1. Tavily AI (Recomendada) ⭐

**Ventajas:**
- ✅ Diseñada específicamente para IA
- ✅ 1,000 búsquedas/mes GRATIS
- ✅ Resultados optimizados para LLMs
- ✅ Muy fácil de integrar
- ✅ Respuestas rápidas

**Configuración:**
1. Ve a https://tavily.com
2. Crea una cuenta gratuita
3. Obtén tu API Key
4. Agrega a Vercel: `TAVILY_API_KEY=tu_api_key_aqui`

**Precio:** Gratis hasta 1,000 búsquedas/mes, luego $0.001 por búsqueda

---

### 2. SerpAPI (Alternativa)

**Ventajas:**
- ✅ 100 búsquedas/mes GRATIS
- ✅ Resultados de Google, Bing, etc.
- ✅ Muy confiable

**Configuración:**
1. Ve a https://serpapi.com
2. Crea cuenta gratuita
3. Obtén tu API Key
4. Agrega a Vercel: `SERPAPI_KEY=tu_api_key_aqui`

**Precio:** Gratis hasta 100 búsquedas/mes, luego desde $50/mes

---

### 3. Google Custom Search API

**Ventajas:**
- ✅ 100 búsquedas/día GRATIS
- ✅ Resultados oficiales de Google
- ✅ Muy confiable

**Desventajas:**
- ⚠️ Requiere más configuración
- ⚠️ Necesitas crear un Custom Search Engine

**Configuración:**
1. Ve a https://developers.google.com/custom-search/v1/overview
2. Crea un proyecto en Google Cloud
3. Habilita Custom Search API
4. Crea un Custom Search Engine en https://programmablesearchengine.google.com
5. Agrega a Vercel:
   - `GOOGLE_SEARCH_API_KEY=tu_api_key`
   - `GOOGLE_SEARCH_ENGINE_ID=tu_engine_id`

**Precio:** Gratis hasta 100 búsquedas/día, luego $5 por 1,000 búsquedas

---

## Implementación Actual

El código ya está preparado para usar **Tavily AI**. Solo necesitas:

1. **Obtener API Key de Tavily:**
   - Ve a https://tavily.com
   - Regístrate (gratis)
   - Copia tu API Key

2. **Agregar a Vercel:**
   - Ve a tu proyecto en Vercel
   - Settings → Environment Variables
   - Agrega: `TAVILY_API_KEY` = `tu_api_key_aqui`
   - Selecciona: Production, Preview, Development
   - Guarda y redepleya

3. **Listo!** Connie ahora puede buscar información en internet cuando sea necesario.

---

## Cómo Funciona

Connie detecta automáticamente cuando necesita buscar información web basándose en palabras clave como:
- "actual", "reciente", "último", "nuevo"
- "buscar", "normativa", "regulación"
- "proveedor"

Cuando detecta estas palabras, busca información relevante y la incluye en su respuesta.

---

## Alternativa: Sin API Externa

Si prefieres no usar una API externa, puedes:
- Usar el conocimiento entrenado de GPT-4o-mini (ya implementado)
- Connie mencionará que buscará información cuando sea necesario
- Funciona bien para la mayoría de consultas EHS

---

## Recomendación Final

**Para empezar:** Usa **Tavily AI** (1,000 búsquedas/mes gratis es más que suficiente para desarrollo y pruebas)

**Para producción:** Evalúa el uso y considera:
- Tavily si necesitas < 1,000 búsquedas/mes (gratis)
- Google Custom Search si necesitas más volumen (100/día gratis)
- SerpAPI si prefieres resultados de múltiples motores

