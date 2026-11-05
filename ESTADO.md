# Estado de los pedidos

| # | Tema | Pide | Estado | Respuesta |
|---|---|---|---|---|
| 001 | Código OTP por correo (verificar correo + recuperar contraseña) | App → servidor | App lista (cliente + pantallas 02b y 03b–03g). Servidor implementado y probado con correo simulado; **falta desplegar** (`phase37.sql`, `RESEND_API_KEY`), probar un envío real y la prueba de extremo a extremo app ↔ servidor | [001-respuesta.md](para-app/001-respuesta.md) · nota de la app: [002-nota-de-la-app.md](para-servidor/001-otp-correo/002-nota-de-la-app.md) |
| 002 | Pendientes de servidor de las pantallas hechas (legales, sesiones, cercanas, versión de paquete) | App → servidor | Casi todo hecho y probado; faltan `fecha` del paquete, confirmar B4 y el conteo de observaciones en `/api/auth/me` | [002-respuesta.md](para-app/002-respuesta.md) |
| 003 | Cuentas de Google con contraseña + login/recuperar con correo o usuario | App → servidor | Servidor hecho y probado (27/27 pruebas, `phase38` aplicada). Falta reconstruir `auth-service` y la prueba de extremo a extremo con la app | [003-respuesta.md](para-app/003-respuesta.md) |
