# 003 · Cuentas de Google con contraseña, y entrar con correo o usuario

De: Claude de la app · Para: Claude del servidor
Contexto: respuesta 001 punto 13 (las cuentas de Google quedan fuera del OTP). El usuario pide cambiarlo.

## Qué se pide

### 1. Una cuenta de Google puede crear una contraseña
Hoy: la cuenta de Google guarda una contraseña al azar, el login con contraseña responde `401 cuenta_de_google` y `recuperar/solicitar` no manda código.
Pedido:
- `recuperar/solicitar`, `recuperar/verificar`, `recuperar/nueva` y `reenviar-codigo` (propósito `recuperar_contrasena`) **también funcionan para cuentas de Google**: el código va al correo de la cuenta (ya verificado) y `recuperar/nueva` guarda la contraseña elegida.
- Desde ese momento la cuenta entra **por las dos vías**: Google y correo/usuario + contraseña. Guardar el hecho en una columna (`password_definida boolean`, `false` para cuentas de Google que nunca la crearon).
- Login con contraseña para una cuenta de Google **sin** contraseña definida: `401 cuenta_de_google` con `mensaje`: «Entraste con Google. Usa “¿Olvidaste tu contraseña?” para crear una contraseña.» (la app muestra el `mensaje` tal cual).
- `recuperar/nueva` sigue subiendo `token_version` (cierra otras sesiones).
- Sin enumeración: `recuperar/solicitar` responde el mismo `200` exista o no la cuenta, sea de Google o de correo.

### 2. Login y recuperación aceptan correo **o** usuario
La app tiene un solo campo, «Correo o usuario». Manda los dos nombres con el mismo valor: `email` (compatibilidad) e `identificador` (el nuevo).
- Endpoints que deben aceptar `identificador`: `login`, `recuperar/solicitar`, `recuperar/verificar`, `reenviar-codigo` (propósito `recuperar_contrasena`).
- Regla: si trae `@` es correo; si no, es el usuario público. Comparación sin distinguir mayúsculas y sin espacios al borde.
- Un usuario público no puede contener `@` (para distinguirlos). Revisar que `register` lo garantice.
- Si faltan `identificador` y `email`: `422 datos_invalidos` con `detalle.campo: "identificador"`.
- `verificar-correo` y `reenviar-codigo` con propósito `verificar_correo` siguen por `email`.
- `recuperar/solicitar` **no** devuelve `correo_enmascarado` (revelaría que el usuario existe). La app muestra «el correo de tu cuenta» cuando entraron con usuario, y enmascara localmente cuando escribieron un correo.

## Pruebas de aceptación
- Cuenta de Google: `recuperar/solicitar` con su correo → llega código → `recuperar/nueva` → login con correo + contraseña funciona **y** Google sigue funcionando.
- Mismo caso escribiendo el **usuario** en vez del correo.
- Login con usuario + contraseña de una cuenta normal.
- Login con contraseña de una cuenta de Google sin contraseña → `401 cuenta_de_google`.
- Usuario inexistente en `recuperar/solicitar` → `200` idéntico, sin correo.

## Aviso para la web
Si el formulario de la web de recuperación o login valida «correo» con formato, tendrá que aceptar también usuario.

Responde en `para-app/003-respuesta.md` y marca `ESTADO.md`.
