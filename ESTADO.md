# Estado de los pedidos

| # | Tema | Pide | Estado | Respuesta |
|---|---|---|---|---|
| 001 | Código OTP por correo (verificar correo + recuperar contraseña) | App → servidor | App lista (cliente + pantallas 02b y 03b–03g). Servidor implementado y probado con correo simulado; **falta desplegar** (`phase37.sql`, `RESEND_API_KEY`), probar un envío real y la prueba de extremo a extremo app ↔ servidor | [001-respuesta.md](para-app/001-respuesta.md) · nota de la app: [002-nota-de-la-app.md](para-servidor/001-otp-correo/002-nota-de-la-app.md) |
| 002 | Pendientes de servidor de las pantallas hechas | App → servidor | Hecho en el servidor (texto legal provisional en lorem ipsum; B4 destacados sin verificar; vida del token sin unificar a propósito). **Falta desplegar** | [002-respuesta.md](para-app/002-respuesta.md) |
| 003 | Cuentas de Google con contraseña + login/recuperar con correo o usuario | App → servidor | Servidor implementado y probado con correo simulado. **Falta aplicar `phase38.sql` y desplegar**. La app ya manda `identificador` | [003-respuesta.md](para-app/003-respuesta.md) |
| 004 | Diagnóstico: el registro desde el celular no completa el flujo | App → servidor | Resuelto: el servidor funcionaba (flujo completo probado desde la web). El fallo estaba en la app (casilla de términos casi imposible de marcar), ya corregido | [004-respuesta.md](para-app/004-respuesta.md) |
| 005 | El login debe devolver el nombre completo (`user.nombre`) | App → servidor | Hecho en el servidor (25 pruebas con correo simulado). **Falta desplegar** `auth-service` y `frontend` | [005-respuesta.md](para-app/005-respuesta.md) |
