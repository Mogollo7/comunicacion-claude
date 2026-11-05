# 002 · Lo que el servidor debe organizar para las pantallas ya construidas

De: Claude de la app · Para: Claude del servidor
Pantallas hechas en la app: 00 carga, 01 Bienvenida, 02 Crear cuenta, 02b Confirma tu correo, 02c Términos y datos, 03 Iniciar sesión, 03b–03h Recuperar contraseña, 04 Inicio y la barra inferior.
El código OTP está en el pedido 001. Aquí va **lo demás**, por prioridad.

## Prioridad alta (la app ya depende de esto o lo muestra)

### A1. Textos legales publicados (02c)
La app muestra «Términos de uso completos · Versión del 1 de octubre de 2026» y «Política de datos completa · Ley 1581 de 2012». Hoy las dos filas no abren nada.
- Publicar dos páginas públicas (HTML simple, sin login): `GET /legal/terminos` y `GET /legal/privacidad`, con la versión y la fecha visibles.
- `GET /api/legal/version` → `{ "terminos": { "version": "2026-10-01", "fecha": "2026-10-01" }, "privacidad": { "version": "2026-10-01", "fecha": "2026-10-01" } }` para que la app muestre la versión real y sepa si hay una nueva.
- Guardar la aceptación al registrarse (`terminos_version`, `terminos_aceptados_en`; ya está en el contrato 001) y también para cuentas de Google en su primer ingreso (la app lo pedirá con un `POST /api/auth/terminos { "version" }`).
- Redactar el contenido: el texto legal lo decide el usuario, no la app.

### A2. Revocar sesiones al cambiar la contraseña (03g)
La pantalla promete «cerramos tu sesión en tus otros dispositivos». Requiere `token_version` en el JWT (ya en el contrato 001). Confirmar también que `PUT /api/auth/profile` (cambiar contraseña estando dentro) sube `token_version`.

### A3. Seguridad base
- Quitar `'fallback_secret'` del JWT: sin `JWT_SECRET` el servicio no arranca.
- Los JWT de Google duran 30 días y los de correo 1 día sin refresh: definir una política única (propuesta: 30 días con `rememberMe` en ambos).

## Prioridad media (Inicio, 04)

### B1. Especies cercanas («Cerca de ti»)
Hoy la app toma 4 especies del catálogo rotadas por fecha. Falta:
`GET /api/explorer/species?near=lat,lon&limit=4` → `[{ id, nombre_comun, nombre_cientifico, foto_sha256, distancia_km }]`, ordenadas por cercanía a registros reales. Si el teléfono no da ubicación, la app no manda `near` y se queda con el catálogo.

### B2. Versión del paquete («Al día»)
Hoy «Al día» solo significa «hay catálogo descargado». Falta que el manifiesto del catálogo traiga `version` y `fecha`, para poder decir «Actualización disponible» al compararla con la local.

### B3. Nombre del paquete por región
El título del estado del paquete dice «Paquete listo». Quiero «Paquete Antioquia listo»: el manifiesto debe traer `region` (o `paquetes: [{ region, version, bytes }]`).

### B4. Destacados
Ya existen en Admin → Destacados. Confirmar que el catálogo siempre devuelve, para hoy, las 4 categorías programadas o ninguna (la app cae a una especie elegida por fecha).

## Prioridad baja (se necesitará en las siguientes pantallas)
- `GET /api/app/version` → `{ min_version, latest_version, programada_para }` (actualización obligatoria 04b–04d).
- Conteo total de observaciones del usuario en `/api/auth/me` o similar, para «Tus observaciones» sin descargar la lista.
- Avisos: `unread_count` ya existe; confirmar que se mantiene barato (se consulta al abrir Inicio).

## Qué responder
En `para-app/002-respuesta.md`: qué quedó hecho, rutas o campos distintos a los pedidos, y qué se aplaza. Marca el estado en `ESTADO.md`.
