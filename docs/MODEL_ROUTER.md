# Model Router – Comportamiento esperado

## Objetivo
Degradación silenciosa entre proveedores (Groq → OpenAI → Anthropic). El usuario **nunca** ve mensajes técnicos (rate limit, API key inválida, etc.).

## Flujo

1. **Candidatos**: `getCandidateProviders({ userModel, readinessLevel })` devuelve la lista ordenada de proveedores con key y no en cooldown/disabled.
2. Por defecto: **groq** → **openai** → **anthropic**.
3. Si el usuario eligió un modelo en la UI, se intenta primero el proveedor que lo soporta; si falla, fallback silencioso al siguiente.

## Manejo de errores (solo logs internos)

| Error | Acción | Usuario ve |
|-------|--------|------------|
| **429** (rate limit / TPD) | Cooldown del proveedor (Retry-After segundos), siguiente proveedor | Respuesta del siguiente o mensaje útil si todos fallan |
| **401** (invalid_api_key) | Proveedor deshabilitado 10 min, siguiente proveedor | Igual |
| **5xx / timeout** | 1 reintento con backoff (300 ms, 900 ms), luego siguiente | Igual |
| **Contexto largo** | Reducir historial, 1 reintento, luego siguiente | Igual |
| **Todos fallan** | Respuesta de degradación (próximo paso + 3 bullets de seguridad) | Mensaje útil, sin mencionar APIs |

## Logs estructurados (ejemplo)

```
[askQuestion] request_id=req_1739... chat=74087252... user=... history=0 msgs
[queryApi] request_id=req_1739... provider=groq model=llama-3.3-70b-versatile status=error error_code=rate_limit retry_after=1043
[queryApi] request_id=req_1739... provider=openai model=gpt-4o-mini status=error error_code=auth retry_after=
[queryApi] request_id=req_1739... provider=anthropic model=claude-3-5-sonnet-20241022 status=ok
```

## Respuesta cuando todos fallan

- No mencionar: API, OpenAI, Groq, Claude, rate limit, token, key.
- Incluir: próximo paso concreto, 1 pregunta, 3 medidas generales de seguridad.

## Verificación manual

1. **Groq 429** → Quitar o gastar Groq TPD; la siguiente request debe usar OpenAI o Claude sin mostrar error al usuario.
2. **OpenAI 401** → Poner `OPENAI_API_KEY` inválida; debe saltar a Claude (o Groq) y responder bien.
3. **Todos fallan** → Quitar todas las keys o usar keys inválidas; la UI debe mostrar el mensaje de degradación (próximo paso + bullets), no "Límite de uso" ni "invalid_api_key".

## Variables de entorno

- `GROQ_API_KEY` – Groq (Llama)
- `CHAT_GPT_KEY` o `OPENAI_API_KEY` – OpenAI (GPT)
- `ANTHROPIC_API_KEY` – Anthropic (Claude)

Al menos una debe estar definida. Si una key es inválida (401), ese proveedor se marca disabled 10 min en memoria.
