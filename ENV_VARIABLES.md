# Variables de Entorno - Configuración Correcta

## Variables para Vercel (Settings → Environment Variables)

Copia y pega estas variables EXACTAMENTE como están escritas (con guiones bajos):

### OpenAI
```
CHAT_GPT_KEY=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
```

### NextAuth
```
NEXTAUTH_URL=https://conexus-connie.vercel.app
NEXTAUTH_SECRET=NudmemkYVevn8Cf4xCtGH20JF0Yfi0KBD4VIkurjqxw=
```

### Google OAuth
```
WEB_CLIENT_ID=174079678386-fr9l09u7ne9vop5tfdb3jr4jm6e38qjl.apps.googleusercontent.com
WEB_CLIENT_SECRET=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
```

### Firebase (Public - NEXT_PUBLIC_*)
```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyBZAXBJ3eSeRfNVSgaMU8dLjDsmLcq0-2o
NEXT_PUBLIC_BASE_URL=https://conexus-connie.vercel.app
NEXT_PUBLIC_FIREBASE_APP_ID=1:505660052026:web:b8f40d038fcc6d79711b03
NEXT_PUBLIC_FIREBASE_PROJECT_ID=conexus-c1845
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=conexus-c1845.firebaseapp.com
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=conexus-c1845.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=505660052026
```

### Firebase Service Account
```
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"conexus-c1845",...}
```
**IMPORTANTE:** 
- Reemplaza `{...}` con tu JSON completo del Service Account de Firebase
- El JSON debe estar en UNA SOLA LÍNEA (sin saltos de línea)
- Para obtenerlo: Firebase Console → Project Settings → Service Accounts → Generate New Private Key
- Copia TODO el contenido del archivo JSON y pégalo como valor de la variable

## Correcciones Realizadas

1. ✅ `CHATGPTKEY` → `CHAT_GPT_KEY`
2. ✅ `NEXTAUTHURL` → `NEXTAUTH_URL` 
3. ✅ `WEBCLIENTID` → `WEB_CLIENT_ID`
4. ✅ `WEBCLIENTSECRET` → `WEB_CLIENT_SECRET`
5. ✅ `NEXTPUBLICFIREBASEAPIKEY` → `NEXT_PUBLIC_FIREBASE_API_KEY`
6. ✅ `NEXTPUBLICBASEURL` → `NEXT_PUBLIC_BASE_URL`
7. ✅ `NEXTPUBLICFIREBASEAPPID` → `NEXT_PUBLIC_FIREBASE_APP_ID`
8. ✅ `NEXTPUBLICFIREBASEPROJECTID` → `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
9. ✅ `NEXTPUBLICFIREBASEAUTHDOMAIN` → `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
10. ✅ `NEXTPUBLICFIREBASESTORAGEBUCKET` → `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
11. ✅ `NEXTPUBLICFIREBASEMESSAGINGSET` → `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
12. ✅ `FIREBASESERVICEACCOUNTKEY` → `FIREBASE_SERVICE_ACCOUNT_KEY`
13. ✅ Agregado `NEXTAUTH_SECRET` (generado nuevo)
14. ✅ Actualizado `NEXTAUTH_URL` a la URL real del proyecto

## Pasos para Configurar en Vercel

1. Ve a tu proyecto en Vercel
2. Settings → Environment Variables
3. Agrega cada variable una por una con los nombres EXACTOS de arriba
4. Asegúrate de seleccionar: **Production**, **Preview**, y **Development**
5. Guarda y redepleya tu aplicación

