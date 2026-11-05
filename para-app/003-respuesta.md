# 003 · Respuesta del servidor: Google con contraseña y entrada por correo o usuario

Estado: **implementado y probado con correo simulado (22/22)**. Falta aplicar `infrastructure/postgres/phase38.sql` a la base real y reconstruir `auth-service` (y `frontend` para la web).

## Qué quedó
1. **Cuenta de Google puede crear contraseña.** `recuperar/solicitar`, `recuperar/verificar`, `recuperar/nueva` y `reenviar-codigo` (`recuperar_contrasena`) funcionan también para cuentas de Google: el código va al correo de la cuenta y `recuperar/nueva` guarda la contraseña y sube `token_version`.
   Columna nueva `auth.users.password_definida boolean` (`false` para Google hasta que la crean; `true` para cuentas de correo). Sale en `user.password_definida` de `login`/`me`.
2. **Login con contraseña de Google sin contraseña definida:** `401 cuenta_de_google` con el `mensaje` exacto: «Entraste con Google. Usa “¿Olvidaste tu contraseña?” para crear una contraseña.»
3. **Después de crearla** la cuenta entra por las dos vías (Google, y correo/usuario + contraseña). Sigue siendo **la misma cuenta** (`auth_provider` y `google_id` no cambian). Entrar con Google a una cuenta existente por su correo ya funcionaba y no pide contraseña (Google verifica el correo).
4. **`identificador`** (o `email`, por compatibilidad) en `login`, `recuperar/solicitar`, `recuperar/verificar` y `reenviar-codigo` (`recuperar_contrasena`). Con `@` es correo; si no, usuario público. Sin distinguir mayúsculas ni espacios al borde. Sin ninguno: `422 datos_invalidos` con `detalle.campo: "identificador"`.
   `verificar-correo` y `reenviar-codigo` con `verificar_correo` siguen por `email`. Un usuario público nunca lleva `@` (el registro lo limpia a `[a-z0-9_]`).
5. **Sin enumeración:** `recuperar/solicitar` responde siempre el mismo `200 { reenviar_en_s, vence_en_s }` (sin `correo_enmascarado`), exista o no el usuario, sea de Google o de correo.

## Cambios respecto al pedido
- **`403 correo_sin_verificar` ahora trae también `detalle.email`** (el correo completo). Hace falta porque quien entra con un **usuario** no lo escribió y la pantalla de código se abre por correo. Solo se devuelve tras acertar la contraseña.
- Las cuentas de Google **siguen sin** `verificar_correo` (nacen verificadas); solo se abren a `recuperar_contrasena`.
- El límite de intentos de login ahora también cuenta por `identificador`.

## Pruebas de aceptación (todas pasan)
Google: `recuperar/solicitar` con correo → código → `recuperar/nueva` → login con correo + contraseña **y** con usuario; la cuenta sigue siendo de Google. Login con usuario + contraseña de cuenta normal. Contraseña de Google sin definir → `401 cuenta_de_google`. Usuario inexistente en `recuperar/solicitar` → `200` idéntico, sin correo.
