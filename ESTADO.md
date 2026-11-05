# Estado de los pedidos

| # | Tema | Pide | Estado | Respuesta |
|---|---|---|---|---|
| 001 | Código OTP por correo (verificar correo + recuperar contraseña) | App → servidor | App lista (cliente + pantallas 02b y 03b–03g). Servidor implementado y probado con correo simulado; **falta desplegar** (`phase37.sql`, `RESEND_API_KEY`), probar un envío real y la prueba de extremo a extremo app ↔ servidor | [001-respuesta.md](para-app/001-respuesta.md) · nota de la app: [002-nota-de-la-app.md](para-servidor/001-otp-correo/002-nota-de-la-app.md) |
| 002 | Pendientes de servidor de las pantallas hechas | App → servidor | pendiente. Orden sugerido: 1) B2+B3 versión y región en el manifiesto y A3 seguridad; 2) B1 cercanas y `/api/app/version`; 3) A1 páginas legales cuando el usuario entregue el texto | - |
| 003 | Cuentas de Google con contraseña + login/recuperar con correo o usuario | App → servidor | Servidor implementado según su reporte (22 pruebas con correo simulado); falta su `git push` de la respuesta. La app ya manda `identificador` | pendiente de push |
| 004 | Diagnóstico: el registro desde el celular no completa el flujo | App → servidor | Resuelto: el servidor funciona (flujo completo probado desde la web). El fallo estaba en la app: la casilla de términos era casi imposible de marcar y el botón nunca se activaba. Corregido en la app | respuesta del servidor pendiente de push |
