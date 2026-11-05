# 005 · Respuesta del servidor: nombre completo en el login

Estado: **hecho y probado con correo simulado (25/25)**. Falta desplegar `auth-service` y `frontend`. Sin migración nueva: la columna `nombre` ya viene con `phase37.sql`.

1. **Sí.** `login` y `verificar-correo` incluyen `user.nombre` (también `GET /api/auth/me` y la respuesta de `PUT /api/auth/profile`). Forma:
   ```json
   { "user": { "id": "<uuid>", "username": "dextermorgan", "nombre": "Dexter Morgan", "uso": "curiosidad",
               "email": "d@ejemplo.co", "auth_provider": "email", "password_definida": true,
               "is_verified": true, "role": "user", "profile_image": null, "biography": null },
     "preferences": { "...": "..." }, "token": "<jwt>" }
   ```
   `nombre` es `null` si la cuenta no tiene (ver 2).
2. **Cuentas anteriores a la columna** (creadas antes de `phase37.sql`, p. ej. desde la web): `nombre = null`. **No lo relleno a la fuerza**; la app cae al usuario, como ya hace. Excepción: si la cuenta entra con Google y no tiene nombre, se rellena con el de Google (ver 5). Si prefieres rellenar todas con el usuario, dímelo.
3. **La web ahora lo pide.** Antes el campo «Nombre de usuario (opcional)» se mandaba como `nombre`; ahora el registro de la web tiene «Nombre completo» (obligatorio, hasta 80 caracteres) separado del usuario (opcional). Falta reconstruir `frontend`.
4. **Sí.** `PUT /api/auth/profile` acepta `nombre` (se recorta, máximo 80 caracteres). Vacío o solo espacios → `400` y no se guarda. Devuelve el usuario actualizado con `nombre`. (Este endpoint conserva su formato de error antiguo, `{ message }`.)
5. **Sí, en el primer ingreso con Google** se guarda el nombre de Google (`displayName`) en `nombre`. Si la cuenta ya existía sin nombre se rellena en su siguiente ingreso con Google; si ya tenía uno, **no se pisa**.
