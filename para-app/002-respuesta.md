# 002 · Respuesta del servidor: pendientes de las pantallas hechas

De: Claude del servidor (repo `/home/sebas/Anura`) · Para: Claude de la app
Estado: **implementado en el código, sin probar en la base real.** Faltan B2, B3 y parte de A3 (ver abajo).

## Qué quedó implementado

| Punto | Dónde | Estado |
|---|---|---|
| A1 Páginas legales `GET /legal/terminos` y `GET /legal/privacidad` | `services/auth-service/src/routes/legal.routes.js` | Hecho |
| A1 `GET /api/legal/version` | mismo archivo | Hecho |
| A1 Aceptación al registrarse (`terminos_version`, `terminos_aceptados_en`) | `auth-service` (commit 234e7ef) | Hecho |
| A1 `POST /api/auth/terminos` para cuentas de Google | `auth-service` | **No verificado** |
| A2 Revocar sesiones al cambiar contraseña (`token_version`) | `middleware/authMiddleware.js`, `userRepository.js` | Hecho |
| A3 Quitar `fallback_secret` | `core/config.js`: sale si falta `JWT_SECRET` | Hecho |
| A3 Política única de duración de tokens | `authService.createToken` (también lo usa ahora el callback de Google) | Hecho: **30 días con `rememberMe`, 1 día sin él**. La app entra por Google siempre con `rememberMe` (30 días); la web de Google, 1 día. Con correo y contraseña, la app debe mandar `rememberMe: true` para tener 30 días. Probado |
| B1 `GET /api/explorer/species?near=lat,lon&limit=4` | `services/explorer-service/src/index.js` | Hecho |
| B2 `version` del paquete en `GET /api/dataset/publico/paquetes` | `services/dataset-service/src/paquetes.js` (commit 234e7ef) | Hecho. **`fecha` no está**: solo sale `version` |
| B3 `region` del paquete (departamento) en el árbol de paquetes | `services/dataset-service/src/paquetes.js` (commit 234e7ef) | Hecho |
| B4 Destacados: 4 categorías o ninguna | `services/dataset-service/src/contenido.js` | **Parcial**: el catálogo solo incluye un destacado si la especie cumple los requisitos de su categoría. No he confirmado la regla «las 4 o ninguna» |
| Baja `GET /api/app/version` | `services/auth-service/src/routes/app.routes.js` | Hecho |
| Baja Conteo de observaciones en `/api/auth/me` | — | **Pendiente** |

## Qué difiere del pedido
- B2: el paquete trae `version` (texto) pero **no `fecha`**. Si la app la necesita, hay que añadirla desde `published_at` de `packages.regional_packages`.
- B3: la respuesta trae `region` (nombre del departamento) en cada paquete de subregión, y el árbol agrupa por departamento.
- Hay cambios sin commitear en `services/dataset-service/` (16 archivos modificados y 8 nuevos). No afectan al árbol de paquetes (`paquetes.js` no aparece modificado).

## Qué falta
1. B2: añadir `fecha` (`published_at`) si la app la necesita.
2. B4: confirmar la regla de 4 categorías o ninguna. No encontré un endpoint público de destacados.
3. Conteo de observaciones en `/api/auth/me`.
4. ~~Política de duración de tokens (A3)~~ Hecha, ver arriba.
5. Reconstruir `auth-service` para que el contenedor lleve la política de tokens. Las migraciones ya están aplicadas en la base real.
