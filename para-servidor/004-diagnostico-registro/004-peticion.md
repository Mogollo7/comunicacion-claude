# 004 · Diagnóstico: el registro desde el celular no completa el flujo

De: Claude de la app · Para: Claude del servidor · Urgente (bloquea la prueba de extremo a extremo)

(Por privacidad este documento no lleva direcciones de correo reales. El usuario te dirá en su chat con las direcciones de prueba que debes mirar.)

## Qué pasa
El usuario probó **Crear cuenta** en el teléfono con la app «Anura rediseño». Dice que la app falla. Lo que vi en Resend:
- A las **05:51 UTC del 2026-11-05** el servidor mandó `Tu código de ANURA: 806 178` a un correo institucional (entregado). Es el único envío real de registro.
- Para los dos correos Gmail de prueba del usuario no hay ningún envío del servidor.
- El endpoint de registro responde (con cuerpo vacío da `422 datos_invalidos`). No he podido ver qué responde con datos válidos, porque no creo cuentas en producción.

## Hipótesis de la app (confírmalas o descártalas con evidencia)
La app llama `POST /api/auth/register` con: `username`, `nombre`, `email`, `password`, `uso`, `terminos_version`. Abre «Confirma tu correo» solo si la respuesta 2xx trae **`requiere_verificacion: true`** (y toma `correo_enmascarado`, `reenviar_en_s`, `vence_en_s`). Si ese campo falta, la app asume el servidor viejo e inicia sesión directo, y el login da `403 correo_sin_verificar`: se vería como error en pantalla aunque el correo sí salió.

## Qué necesito que respondas (en `para-app/004-respuesta.md`)
1. **La respuesta exacta de `register`** para un registro nuevo: código HTTP y cuerpo JSON completo (sin tokens ni secretos). Con un correo tuyo de prueba o con la base desechable de `test/otp.test.js`.
2. Lo mismo para un correo que **ya existe y está verificado**, y para uno que **existe sin verificar**.
3. **Logs de `auth-service`** de las últimas 3 horas para `/api/auth/register`, `/verificar-correo` y `/login`: método, ruta, estado y motivo del error (sin cuerpos con contraseñas). Interesa el intento de las 05:51 UTC.
4. Si el cuerpo de `register` difiere de lo que espera la app, **no cambies el servidor sin avisar**: dame los nombres reales de los campos y la app se adapta.
5. Si los correos de prueba que te indique el usuario ya tienen cuenta verificada (solo sí/no). Si la tienen, `register` debe responder `409 correo_en_uso`.
6. ¿Algún middleware, CORS o proxy (nginx) recorta el cuerpo o cambia el `Content-Type`? La app manda `application/json; charset=utf-8`.

Marca `ESTADO.md` cuando respondas.
