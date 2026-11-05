# 001 · Código por correo (OTP): verificar correo y recuperar contraseña

De: Claude de la app (Anura rediseño) · Para: Claude del servidor (carpeta `D:/server/Anura`, `auth-service`)
Estado: **pendiente de implementar** · Prioridad: alta (bloquea las pantallas 02b y 03b–03h)

## Qué se pide, en una frase
Que cuando el celular lo pida, el servidor genere un código de 6 dígitos, lo mande por correo con Resend y lo valide, para (1) **verificar el correo** al registrarse y (2) **recuperar la contraseña**.

## Cómo lo usa el celular (resumen)
1. Crear cuenta → `POST /api/auth/register` → el servidor manda el código y la app abre "Confirma tu correo" con la cuenta atrás de `reenviar_en_s`.
2. Escribe los 6 dígitos → `POST /api/auth/verificar-correo` → si es correcto devuelve `token` y la app entra a Inicio.
3. "Reenviar código" → `POST /api/auth/reenviar-codigo`.
4. Olvidé mi contraseña → `recuperar/solicitar` → `recuperar/verificar` → `recuperar/nueva`.
5. Todos los errores usan el formato único `{ "error": { "codigo", "mensaje", "detalle" } }` (sección 3 del contrato). La app decide el texto según `codigo`.

## Orden de trabajo
1. Leer la parte A (contrato) y B (correo con Resend).
2. Implementar: tabla `auth.codigos`, columnas nuevas, módulo de correo, endpoints.
3. Probar los casos de "Pruebas de aceptación".
4. Responder en `para-app/001-respuesta.md`: qué se hizo, endpoints o campos que cambiaron respecto al contrato, y qué quedó pendiente.

## Archivos de apoyo (`archivos/`)
- `enviar_codigo_resend.ts`: módulo de envío con la plantilla `anura-codigo`.
- `email_codigo_resend.html`: HTML de referencia (variables `{{{ASUNTO}}} {{{PREHEADER}}} {{{TITULO}}} {{{NOMBRE}}} {{{INSTRUCCION}}} {{{CODIGO}}} {{{AVISO}}}`).
- `anura_candado.png`: ícono del correo. **No usar SVG** (Gmail lo oculta); servirlo desde una URL pública (propuesta: ruta estática de `anura.juanlabs.me`) y poner esa URL en la plantilla.

## Pruebas de aceptación
- Registro → llega el correo → código correcto → `200` con `token`.
- Código incorrecto ×1 → `400 codigo_incorrecto` con `intentos_restantes: 2`; ×3 → el código muere (`410 codigo_vencido`).
- Reenviar antes de 45 s → `429 demasiado_pronto` con `reintentar_en_s`.
- Código vencido (> 10 min) → `410 codigo_vencido`.
- Correo inexistente en `recuperar/solicitar` → `200` igual que si existiera.
- Cuenta de Google en `recuperar/solicitar` → `200` y no se manda código.
- Cambio de contraseña con sesión abierta en otro teléfono → esa sesión queda rechazada (`token_version`).
- Nombre con `<script>` o comillas → se ve como texto en el correo.

---

# A · Contrato de autenticación por código


# Contrato de autenticación por código (app ↔ servidor)

Qué le pide la app "Anura rediseño" al `auth-service` para que **confirmar el correo** (pantallas 02b, 02c) y **recuperar la contraseña** (03b–03h) funcionen de verdad. Hoy el servidor no hace nada de esto. Este documento es lo que se le dice al servidor; la app se arma contra estos nombres y respuestas.

Base: `https://anura.juanlabs.me` · prefijo `/api/auth` · cuerpo y respuestas en JSON, UTF-8 · errores con el mismo formato en todo el servicio.

## 0. Cómo está hoy (para no romper nada)

| Cosa | Hoy |
|---|---|
| `POST /api/auth/register` | Crea el usuario y devuelve `{usuario}` **sin token**; no manda correo. |
| `POST /api/auth/login` | `{email, password, rememberMe}` → `{user, preferences, token}`. JWT de 1 día (30 con `rememberMe`). Sin refresh. |
| Google | `GET /api/auth/google?platform=mobile` → vuelve a `anura://auth?token=…` (JWT de 30 días). |
| Cambiar contraseña | `PUT /api/auth/profile` con `currentPassword` + `newPassword` (multipart). |
| Correo | No hay servicio de correo. `users.is_verified` existe pero nadie lo pone en `true`. |
| Recuperar contraseña | Quitado a propósito (`init.sql:70`). |

## 1. Lo que hay que construir en el servidor

### 1.1 Envío de correo (requisito previo)
- Proveedor: **Resend**. El dominio `juanlabs.me` ya está **verificado** (región `sa-east-1`, envío activo, recepción desactivada). Remitente: `ANURA <no-responder@juanlabs.me>`. La clave de API de Resend va solo en variable de entorno del servidor (`RESEND_API_KEY`), nunca en el repositorio ni en la app.
- Plantilla del correo = pantalla **03h**: asunto `Tu código de ANURA: 482 913`, saludo con el nombre, el código grande, "Vence en 10 minutos y sirve una sola vez", aviso antiphishing ("ANURA nunca te pide el código por otro medio") y pie "ANURA · Identificación de anuros de Colombia".
- Variables de plantilla: `{nombre}`, `{codigo}` (con espacio al medio: `482 913`), `{minutos}`.
- Dos propósitos con el mismo correo: `verificar_correo` ("Activa tu cuenta") y `recuperar_contrasena` ("Recupera tu contraseña").

### 1.2 Tabla nueva `auth.codigos`
| Columna | Tipo | Nota |
|---|---|---|
| `id` | uuid | PK |
| `user_id` | uuid | FK `auth.users` (ON DELETE CASCADE) |
| `proposito` | text | `verificar_correo` \| `recuperar_contrasena` |
| `codigo_hash` | text | **hash** (HMAC-SHA256 con secreto del servidor), nunca el código en claro |
| `intentos` | smallint | arranca en 0 |
| `creado_en` | timestamptz | |
| `vence_en` | timestamptz | `creado_en + 10 min` |
| `usado_en` | timestamptz null | no nulo = ya gastado |
| `ultimo_envio_en` | timestamptz | para el límite de reenvío |

Reglas: código de **6 dígitos** aleatorios (CSPRNG, con ceros a la izquierda); **un solo código vigente** por (usuario, propósito): al pedir otro, el anterior se invalida; máximo **3 intentos** por código; vence a los **10 minutos**; se gasta una sola vez.

### 1.3 Cambios en tablas existentes
- `auth.users`: poner `is_verified = true` al verificar; guardar `correo_verificado_en timestamptz`.
- `auth.users`: nueva columna `uso text` (`curiosidad` | `estudio`) — la app ya la envía en el registro.
- `auth.users`: nueva columna `terminos_version text` y `terminos_aceptados_en timestamptz` (pantalla 02c: "Versión del 1 de octubre de 2026").
- Revocar sesiones al cambiar la contraseña: `auth.users.token_version int default 0`; el JWT lleva `tv`; el middleware rechaza si `tv` no coincide (03g "cerramos la sesión en tus otros dispositivos").

## 2. Endpoints

Todos devuelven `Content-Type: application/json`. Los que no llevan token se limitan por IP y por correo (sección 4).

### 2.1 Registro (cambia)
`POST /api/auth/register`
```json
{ "nombre": "Laura", "email": "laura@gmail.com", "password": "********",
  "uso": "curiosidad", "terminos_version": "2026-10-01" }
```
- Crea el usuario con `is_verified=false`, **no** devuelve token, envía el código (`verificar_correo`).
- `201`:
```json
{ "usuario": { "id": "…", "email": "laura@gmail.com" },
  "requiere_verificacion": true,
  "correo_enmascarado": "l•••••@gmail.com",
  "reenviar_en_s": 45,
  "vence_en_s": 600 }
```
- `409 correo_en_uso` si el correo ya existe y está verificado. Si existe **sin verificar**, se reenvía un código nuevo y se responde igual que un registro nuevo (no se revela cuál caso es).
- `422 datos_invalidos` (contraseña < 8, correo mal formado, `terminos_version` faltante).

### 2.2 Verificar el correo (nuevo)
`POST /api/auth/verificar-correo`
```json
{ "email": "laura@gmail.com", "codigo": "482913" }
```
- `200`: `{ "user": {…}, "preferences": {…}, "token": "<JWT>" }` — igual que `login`. La app entra a Inicio.
- `400 codigo_incorrecto` con `{ "intentos_restantes": 2 }` (pantalla **03d**).
- `410 codigo_vencido` (pantalla **03e**): venció, se gastó o llegó a 3 intentos fallidos.
- `404`/`400` genéricos no deben decir si el correo existe: usar `codigo_incorrecto`.

### 2.3 Reenviar código (nuevo)
`POST /api/auth/reenviar-codigo`
```json
{ "email": "laura@gmail.com", "proposito": "verificar_correo" }
```
- `200`: `{ "reenviar_en_s": 45, "vence_en_s": 600 }`. Invalida el código anterior.
- `429 demasiado_pronto` con `{ "reintentar_en_s": 31 }` si pasaron menos de 45 s (la app muestra "Reenviar código en 0:45").
- Siempre `200` aunque el correo no exista (no filtrar cuentas) cuando el propósito es `recuperar_contrasena`.

### 2.4 Cambiar correo antes de verificar (nuevo)
`POST /api/auth/cambiar-correo-pendiente`
```json
{ "email_actual": "laura@gmail.com", "password": "********", "email_nuevo": "laura@correo.co" }
```
- Solo para cuentas sin verificar. Pide la contraseña para evitar que otro cambie el correo de una cuenta ajena. Responde como el registro (`correo_enmascarado`, `reenviar_en_s`, `vence_en_s`) y manda código al correo nuevo. (Botón "Cambiar correo" de 02b.)

### 2.5 Login (cambia un caso)
`POST /api/auth/login` igual que hoy, pero si `is_verified=false`:
- `403 correo_sin_verificar` con `{ "correo_enmascarado": "l•••••@gmail.com" }` y **se envía un código nuevo**. La app abre 02b.
- Cuentas de Google nacen verificadas.

### 2.6 Recuperar contraseña (nuevo, pantallas 03b–03g)
1. `POST /api/auth/recuperar/solicitar` `{ "email" }` → **siempre** `200 { "reenviar_en_s": 45, "vence_en_s": 600 }`. Si la cuenta existe y es de correo+contraseña, manda código `recuperar_contrasena`. Si entró con Google, no manda código y el correo dice que cambie la contraseña desde Google (03b: "Si entraste con Google, cambia la contraseña desde tu cuenta de Google").
2. `POST /api/auth/recuperar/verificar` `{ "email", "codigo" }` → `200 { "token_cambio": "<token de un solo uso, 10 min>" }`; errores `codigo_incorrecto` / `codigo_vencido` como en 2.2 (03d, 03e).
3. `POST /api/auth/recuperar/nueva` `{ "token_cambio", "password_nueva" }` → `200 { "ok": true }`; sube `token_version` (revoca las demás sesiones) y **no** devuelve sesión: la app muestra 03g "¡Contraseña actualizada!" y manda a Entrar. `422 contrasena_debil` (< 8, sin número o símbolo, o igual a la actual).

Reenvío en recuperación: mismo `POST /api/auth/reenviar-codigo` con `proposito: "recuperar_contrasena"`.

## 3. Errores (formato único)
```json
{ "error": { "codigo": "codigo_incorrecto", "mensaje": "El código no coincide.", "detalle": { "intentos_restantes": 2 } } }
```
| HTTP | `codigo` | Pantalla que lo muestra |
|---|---|---|
| 400 | `codigo_incorrecto` | 03d "El código no coincide. Te quedan N intentos." |
| 410 | `codigo_vencido` | 03e "El código venció" |
| 403 | `correo_sin_verificar` | Login → 02b |
| 409 | `correo_en_uso` | 02 Crear cuenta |
| 422 | `datos_invalidos`, `contrasena_debil` | campos del formulario |
| 429 | `demasiado_pronto`, `demasiados_intentos` | reenvío / bloqueo temporal |
| 5xx | `error_servidor` | 04e "No pudimos conectar con ANURA" |

`mensaje` va en español y es seguro de mostrar tal cual; la app decide el texto final según `codigo`.

## 4. Seguridad (obligatorio)
- Código con CSPRNG; en base de datos **solo el hash**; comparación en tiempo constante.
- Límites: reenvío ≥ 45 s; máx. **5 códigos por hora** por correo; máx. **10 solicitudes por hora** por IP; tras 3 intentos fallidos el código muere (hay que pedir otro).
- No revelar si un correo tiene cuenta (respuestas iguales en recuperar/reenviar).
- Correo: texto plano + HTML; sin enlaces con el código; el aviso antiphishing va siempre.
- Registrar en `audit.log`: envío, verificación OK, intentos fallidos, cambio de contraseña (sin guardar códigos).
- Quitar el secreto de respaldo del JWT (`'fallback_secret'`): si falta `JWT_SECRET`, el servicio no arranca.
- Poner `observations.user_id ... ON DELETE CASCADE` antes de ofrecer "Eliminar cuenta" (07n).

## 5. Qué hace la app con cada respuesta
| Pantalla | Llama | Si sale bien | Si falla |
|---|---|---|---|
| 02 Crear cuenta | `register` | abre 02b con `correo_enmascarado` y arranca la cuenta atrás con `reenviar_en_s` | muestra el error en el formulario |
| 02b Confirma tu correo | `verificar-correo` | guarda `token` y entra a Inicio | casillas en rojo + mensaje; a los 3 fallos pide reenviar |
| 02b "Reenviar código" | `reenviar-codigo` | reinicia la cuenta atrás | `429`: usa `reintentar_en_s` |
| 02b "Cambiar correo" | `cambiar-correo-pendiente` (o vuelve a 02 si aún no hay cuenta) | actualiza el correo mostrado | error en pantalla |
| 03 Iniciar sesión | `login` | entra | `403 correo_sin_verificar` → 02b |
| 03b → 03f | `recuperar/solicitar` → `verificar` → `nueva` | 03g y volver a Entrar | 03d / 03e |

Estado local de la app (no depende del servidor): el texto de 6 dígitos, la cuenta atrás de 45 s y qué casilla está activa.

## 6. Orden de trabajo sugerido
1. SMTP + plantilla + tabla `auth.codigos` + columnas nuevas.
2. `register` (sin token) + `verificar-correo` + `reenviar-codigo` + cambio en `login`.
3. Recuperar contraseña (3 endpoints) + `token_version`.
4. Conectar la app: 02, 02b, 03 → después 03b–03g.
5. Pruebas: código correcto, incorrecto ×3, vencido, reenvío antes de 45 s, correo inexistente, cuenta de Google, cambio de contraseña con sesión abierta en otro teléfono.

## 7. Pendiente de decidir
- ~~Dominio del remitente y proveedor de correo~~ → decidido: Resend, `no-responder@juanlabs.me`.
- ¿Las cuentas ya existentes quedan como verificadas, o se les pide verificar al próximo inicio?
- ¿Se permite entrar a la app sin verificar (modo limitado) o es obligatorio?
- Versión y texto de los términos (02c) y dónde se publican.


---

# B · Correo con Resend


# Instrucción para el Claude del servidor — correo con Resend

Contexto: la app "Anura rediseño" necesita códigos de 6 dígitos por correo (confirmar correo y recuperar contraseña). El contrato completo de endpoints y tablas está en `Contrato de autenticación por código (app ↔ servidor).md`. Este archivo cubre solo el **correo**.

## Ya hecho en Resend (cuenta del usuario)
- Dominio `juanlabs.me`: verificado, sa-east-1, envío activo.
- Plantilla **publicada** con alias `anura-codigo` (nombre "ANURA · Código por correo"), remitente por defecto `ANURA <no-responder@juanlabs.me>`.
- Variables (triple llave): `ASUNTO`, `PREHEADER`, `TITULO`, `NOMBRE`, `INSTRUCCION`, `CODIGO`, `AVISO`.

## Lo que debes hacer en `auth-service`
1. `npm install resend`.
2. Variable de entorno `RESEND_API_KEY` (clave de Resend con permiso solo de **envío**, restringida al dominio `juanlabs.me`). Opcional: `RESEND_FROM="ANURA <no-responder@juanlabs.me>"`. No va en el repo ni en logs.
3. Copiar `enviar_codigo_resend.ts` (abajo) al servicio y llamarlo desde los endpoints del contrato (`register`, `reenviar-codigo`, `login` sin verificar, `recuperar/solicitar`) con el propósito que corresponda.
4. Si `enviarCodigo` falla, el endpoint responde `500 error_servidor` y **no** consume el límite de reenvío del usuario.
5. Registrar en `audit.log` el `id` que devuelve Resend (no el código).

## Por qué este módulo difiere de las plantillas en `docs/templates`
- Un solo HTML para los dos propósitos; los textos cambian por variable.
- El nombre se escapa (lo escribe el usuario; en el módulo anterior entraba sin escapar al HTML).
- Resend devuelve `{ data, error }` y no lanza excepción: se revisa `error`.
- Se quitó la cabecera simulada de bandeja de entrada (Figma la dibuja, un correo real no la lleva) que además decía `anura.app`.

## Código: `enviar_codigo_resend.ts`
Está en `anura-rediseno/docs/templates/enviar_codigo_resend.ts` (el usuario lo pega en el servidor).

## Pruebas
1. Enviar `verificar_correo` y `recuperar_contrasena` a un correo propio; revisar que llegue a bandeja (no spam), que el asunto sea `Tu código de ANURA: 482 913` y que se vea en modo oscuro.
2. Nombre con `<script>` o comillas: debe verse como texto.
3. Revisar en el panel de Resend que no haya rebotes.

## Pendiente que decide el usuario
- ¿Un correo extra de "contraseña cambiada" (aviso de seguridad tras 03g)? No está en Figma.

