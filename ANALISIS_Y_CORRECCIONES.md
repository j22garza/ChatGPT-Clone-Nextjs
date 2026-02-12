# Análisis del proyecto Connie (ChatGPT-Clone-Nextjs)

## Resumen

El proyecto es un clon de ChatGPT con Next.js 13 (App Router + Pages API), Firebase para mensajes y chats, NextAuth con Google, y un backend que usa **OpenAI SDK** (no LangChain) con soporte para Groq u OpenAI.

---

## Por qué la IA puede no contestar

### 1. **Errores devueltos como si fueran respuestas (bug crítico)**

En `app/utils/queryApi.ts`, cuando el LLM falla (API key inválida, rate limit, timeout, etc.), el código **no lanza una excepción**: devuelve un **string** con el mensaje de error.  
En `pages/api/askQuestion.ts` ese string se trata como respuesta exitosa: se guarda en Firebase como mensaje de Connie y se devuelve al cliente con **status 200**.  
**Efecto:** El usuario ve el error como si Connie hubiera escrito ese texto (ej. "Error de autenticación: Verifica que las API keys...") y el front no muestra toast de error.

**Corrección:** Hacer que `queryApi` **lance** (`throw new Error(...)`) en caso de fallo para que `askQuestion` capture, devuelva 500 y el front muestre el toast.

### 2. **Variables de entorno faltantes o incorrectas**

- **FIREBASE_SERVICE_ACCOUNT_KEY**: Si no está o no es un JSON válido, `firebaseAdmin.ts` hace `throw` al cargar. Cualquier request a `/api/askQuestion` que importe `adminDb` puede fallar antes de ejecutar la lógica.
- **GROQ_API_KEY** o **CHAT_GPT_KEY**: Si no hay ninguna, `queryApi` lanza; si están mal, el proveedor devuelve error (y con el bug anterior se mostraba como respuesta).

### 3. **Modelo inválido**

`ModelSelection.tsx` usa `fallbackData: "text-davinci-003"`. Aunque ese componente no se renderiza en la página de chat actual, si en el futuro se usa y se elige ese modelo, Groq no lo tiene y OpenAI lo tiene deprecado → el LLM fallaría.

### 4. **Timeout 60s**

Si la consulta tarda más de 60 segundos, `askQuestion` hace reject y devuelve 500. Puede parecer que "no contesta" si la red o el modelo son lentos.

---

## Componentes duplicados / código sobrante

| Ubicación | Problema |
|-----------|----------|
| **`app/utils/chatgpt.ts`** | Crea un cliente OpenAI por defecto. **No se importa en ningún sitio.** Toda la lógica real está en `queryApi.ts`, que crea su propio cliente (Groq u OpenAI). Código muerto. |
| **`app/utils/llmProviders.ts`** | Define `getActiveProvider()`, `LLM_PROVIDERS`, etc. **Nadie lo usa.** `queryApi.ts` repite la lógica a mano (comprobar `LLM_PROVIDER`, `GROQ_API_KEY`, etc.). Duplicación. |
| **`app/components/ModelSelection.tsx`** | Llama a `/api/getEngines`, que **no existe** (solo hay `askQuestion` y auth). No se usa en `app/chat/[id]/page.tsx`. Componente huérfano y API inexistente. |

---

## Flujo actual (resumido)

1. Usuario escribe en `ChatInput` → mensaje se guarda en Firebase → `POST /api/askQuestion` con `{ prompt, chatId, model, session }`.
2. `askQuestion` lee últimos mensajes de Firebase, llama a `query()` en `queryApi.ts`.
3. `queryApi`: elige Groq u OpenAI según env, opcionalmente Tavily para búsqueda web, construye `messages` (system + history + user) y llama a `client.chat.completions.create()`.
4. Si `query()` devuelve string → se guarda en Firebase como mensaje de Connie y se responde 200.
5. El chat lee mensajes desde Firebase y los muestra.

---

## Uso de LangChain

En el repo **no se usa LangChain**. Se usa el SDK oficial de **OpenAI** (`openai` en npm) con `baseURL` para Groq.  
Para este flujo (un solo chat completion con historial y búsqueda web opcional) el SDK de OpenAI es suficiente. LangChain aportaría más si quisieras: cadenas complejas, herramientas estándar, integración con más fuentes, etc.  
Las correcciones se hacen manteniendo el enfoque actual y alineando con buenas prácticas (un solo lugar para proveedores, errores bien propagados, tipos correctos).

---

## Cambios realizados

1. **queryApi.ts**: En errores del LLM, **lanzar** en lugar de devolver string; así `askQuestion` devuelve 500 y el front muestra el error correctamente.
2. **queryApi.ts**: Usar **llmProviders** (`getActiveProvider`, modelos por proveedor) y eliminar la lógica duplicada.
3. **Eliminar** `chatgpt.ts` (no usado).
4. **Tipos**: Definir `Message` en un módulo TypeScript con `Timestamp` de Firebase Admin y usarlo en `askQuestion` y donde haga falta.
5. **getEngines**: Añadir `pages/api/getEngines.ts` que devuelva los modelos soportados para que ModelSelection no haga 404 si se vuelve a usar.
6. **ModelSelection**: Unificar fallback a `gpt-4o-mini` y usar la nueva API.
7. **typing.d.ts**: Corregir o reemplazar para que no dependa de `admin` en un `.d.ts` global.
