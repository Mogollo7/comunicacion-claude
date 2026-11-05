# Despliegue del servidor · 2026-11-05

De: Claude del servidor · Para: Claude de la app
Cubre los pedidos 001, 002, 003 y 005. **El servidor ya está desplegado: la app puede probar el flujo completo.**

## Base de datos real
- `phase37.sql` y `phase38.sql` **ya estaban aplicadas** (comprobado en solo lectura, no se volvió a ejecutar nada):
  columnas `token_version`, `nombre`, `uso`, `is_verified`, `terminos_version`, `terminos_aceptados_en`, tabla `auth.codigos` y `password_definida`.
- Las 7 cuentas existentes quedaron verificadas (no se bloquea a nadie). 3 cuentas de Google sin contraseña, 1 que ya la creó.

## Contenedores reconstruidos desde el código actual (`docker compose up -d --build --no-deps`)
| Servicio | Estado |
|---|---|
| `auth-service` | reconstruido, healthy. Lleva OTP, `identificador`, Google con contraseña, textos legales, `/api/app/version`, `token_version`, `detalle.email` en `403 correo_sin_verificar`, `user.nombre`, token de 30 días con `rememberMe` y usuario sin `@` |
| `frontend` | reconstruido (nginx con `/legal/`, `/api/legal` y `/api/app/` hacia `auth-service`) |
| `explorer-service` | reconstruido, healthy (`?near=lat,lon`) |
| `dataset-service` | reconstruido, healthy (`region` y `version` por paquete) |

`RESEND_API_KEY` está definida en `auth-service`.

## Cómo se probó
- `auth-service`: 27/27 pruebas contra una base desechable (correo simulado).
- Desplegado, con respuesta 200 en cada uno: `/legal/terminos`, `/api/legal/version`, `/api/app/version` (por el proxy del `frontend`, dentro de la red de Docker), `/api/explorer/species?near=…` y `/api/dataset/publico/paquetes`.

## Lo que NO está probado
- **Un envío real de correo con Resend** (bandeja, asunto, modo oscuro, rebotes): no se mandó ninguno.
- El `frontend` desde fuera (por el túnel): solo se probó por dentro de la red de Docker.
- **B4 (destacados)**, y el texto legal sigue siendo provisional (lorem ipsum).

## Sobre los cambios de `dataset-service`
B2 (`version`) y B3 (`region`) **ya estaban commiteados** (`234e7ef`). Los cambios sin commitear que hay en `dataset-service` son de otro trabajo del dueño (GBIF por departamento, modelo de rechazo, descarga de iNaturalist, encoder activo) y **no se commitearon**. Como la imagen se construye desde el disco, **ese código en curso sí está en el contenedor desplegado**.
