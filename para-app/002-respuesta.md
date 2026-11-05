# 002 · Respuesta del servidor: pendientes de las pantallas hechas

Estado: **hecho y probado lo de `auth-service` (24/24 con correo simulado) y la consulta SQL de «Cerca de ti» contra la base real (solo lectura)**. Falta desplegar (ver al final). El texto legal es **lorem ipsum provisional**: lo redacta el dueño.

## Prioridad alta
**A1 · Textos legales** (hecho, texto provisional)
- `GET /legal/terminos` y `GET /legal/privacidad`: HTML simple, públicos, con «Versión del 1 de octubre de 2026» visible. También bajo `/api/legal/terminos` y `/api/legal/privacidad`.
- `GET /api/legal/version` → `{ "terminos": { "version": "2026-10-01", "fecha": "2026-10-01" }, "privacidad": { "version": "2026-10-01", "fecha": "2026-10-01" } }`.
- Aceptación: `register` ya guarda `terminos_version` y `terminos_aceptados_en`. **Nuevo `POST /api/auth/terminos { "version" }`** (con sesión) los guarda para cuentas de Google o para una versión nueva → `200 { terminos_version, terminos_aceptados_en }`; `422 datos_invalidos` si la versión no es válida; `401` sin sesión.
- Para cambiar el texto: editar `LEGAL` en `services/auth-service/src/routes/legal.routes.js` y subir `version`.

**A2 · Revocar sesiones** (hecho)
- `recuperar/nueva` sube `token_version` (ya estaba, 001).
- **`PUT /api/auth/profile` con `newPassword` también lo sube**, así que cierra las demás sesiones. Para no sacar a quien la cambia, la respuesta trae **`token` nuevo** (30 días); la app debe guardarlo. El token anterior de ese mismo teléfono deja de valer.

**A3 · Seguridad base** (hecho)
- Se quitó `'fallback_secret'`: sin `JWT_SECRET` el servicio no arranca.
- Política de duración, sin cambios: correo = 1 día, o 30 con `rememberMe`; Google desde la app = 30 días; Google desde la web = 1 día. **No lo unifiqué** porque cambiarlo afecta a la web; dime si lo quieres (propuesta: 30 días con `rememberMe` en ambos).

## Prioridad media
**B1 · Cerca de ti** (hecho, campos algo distintos)
`GET /api/explorer/species?near=lat,lon&limit=4` → `[{ id, nombre_comun, nombre_cientifico, thumbnail_key, distancia_km }]`, ordenadas por cercanía a registros reales **públicos** (no privados). `id` es el `taxon_id`. **Difiere:** en vez de `foto_sha256` devuelve `thumbnail_key` (la miniatura del registro más cercano; sale por `/api/explorer/thumbnail/...`); la foto del catálogo (sha256) habría que cruzarla con dataset-service y no lo hice. `limit` 1–20 (por defecto 4). `near` mal formado → `422 datos_invalidos`. Sin `near` el endpoint responde lo de siempre.

**B2 · Versión del paquete** (ya existía)
`GET /api/dataset/publico/manifiesto` ya trae `version` y `generado` (fecha) del catálogo. Cada paquete de `GET /api/dataset/publico/paquetes` trae `version` y `publicado` (fecha). Compara con lo local para «Actualización disponible».

**B3 · Nombre del paquete por región** (hecho)
Cada subregión de `GET /api/dataset/publico/paquetes` trae ahora **`region`** (departamento, p. ej. «Antioquia»); el departamento ya traía `nombre`. Para «Paquete Antioquia listo».

**B4 · Destacados** (no verificado)
No revisé que el catálogo devuelva siempre las 4 categorías programadas de hoy. Lo dejo pendiente; mantén tu caída a la especie por fecha.

## Prioridad baja
- **`GET /api/app/version`** → `{ min_version, latest_version, programada_para }`, desde variables de entorno `APP_MIN_VERSION`, `APP_LATEST_VERSION`, `APP_UPDATE_PROGRAMADA_PARA`. Sin configurar devuelve `null` en los tres (no obliga a nadie).
- **Conteo de observaciones:** `GET /api/auth/me` trae ahora `user.observations_count` (incluye privadas: es el conteo propio).
- **Avisos `unread_count`:** no lo revisé; queda como estaba.

## Rutas nuevas en el proxy
`/legal/`, `/api/legal` y `/api/app/` apuntan a `auth-service` en `frontend/nginx.conf` (hay que reconstruir `frontend`).

## Para desplegar (lo hace el dueño)
`docker compose up -d --build auth-service frontend explorer-service dataset-service`
