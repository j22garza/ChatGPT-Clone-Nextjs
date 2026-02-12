# Configuración de LLMs Rápidos para Connie

## 🚀 Proveedores Ultra Rápidos (Recomendados)

### 1. **Groq** ⚡ (MÁS RÁPIDO - GRATIS)

**Ventajas:**
- ✅ **Ultra rápido** - Hasta 10x más rápido que OpenAI
- ✅ **100% GRATIS** - 14,400 requests/día gratis
- ✅ Modelos potentes (Llama 3.1, Mixtral)
- ✅ Sin límites de velocidad

**Configuración:**
1. Ve a https://console.groq.com
2. Crea cuenta gratuita
3. Genera API Key
4. Agrega a Vercel: `GROQ_API_KEY=tu_api_key`
5. Agrega: `LLM_PROVIDER=groq`

**Precio:** Gratis hasta 14,400 requests/día

---

## ⚡ Optimizaciones para OpenAI (Actual)

Si prefieres seguir con OpenAI, estas optimizaciones ya están aplicadas:

1. ✅ **Modelo rápido**: `gpt-4o-mini` (ya configurado)
2. ✅ **Max tokens reducido**: 1500 (antes 2000)
3. ✅ **Contexto limitado**: Solo últimos 10 mensajes
4. ⏳ **Streaming**: Pendiente de implementar

---

## 🎯 Recomendación

**Para máxima velocidad:**
1. **Groq** - Si quieres lo más rápido posible (GRATIS) ⭐ RECOMENDADO
2. **OpenAI optimizado** - Si ya tienes todo configurado y prefieres confiabilidad

---

## 📝 Variables de Entorno en Vercel

Agrega estas variables según el proveedor que elijas:

### Para Groq (Recomendado para velocidad):
```
GROQ_API_KEY=tu_api_key_de_groq
LLM_PROVIDER=groq
```

### Para OpenAI (Por defecto):
```
CHAT_GPT_KEY=tu_api_key_de_openai
LLM_PROVIDER=openai
```

---

## 🔄 Cambiar Proveedor

Solo cambia la variable `LLM_PROVIDER` en Vercel y redepleya. El código detectará automáticamente el proveedor configurado.

