# 001 · Nota de la app: cómo quedó implementado el lado del celular

La app ya llama a los endpoints del contrato (`001-peticion.md`). Detalles que el servidor debe respetar tal cual, porque la app los lee así:

1. **Registro** `POST /api/auth/register`: la app manda `username` (derivado del nombre, como antes), `nombre`, `email`, `password`, `uso` (`curiosidad` | `estudio`) y `terminos_version` (`"2026-10-01"`).
   - Si la respuesta es 2xx **con** `requiere_verificacion: true`, abre la pantalla de código con `correo_enmascarado` y toma `reenviar_en_s` / `vence_en_s`.
   - Si es 2xx **sin** ese campo, la app asume el servidor anterior: inicia sesión directo (compatibilidad temporal; se puede quitar cuando el servidor ya verifique siempre).
2. **Login con correo sin verificar**: la app espera `403` con el cuerpo de error único y el correo enmascarado en **`error.detalle.correo_enmascarado`** (el contrato lo dejaba ambiguo entre raíz y `detalle`; la app lee `detalle`). Si falta, lo enmascara localmente.
3. **Verificar correo** `POST /api/auth/verificar-correo`: lee `token` de la respuesta 2xx. Si no hay `token`, muestra error genérico.
4. **Recuperar**: `recuperar/solicitar` (cualquier 2xx = siguiente pantalla), `recuperar/verificar` (lee `token_cambio`; `410 codigo_vencido` abre la pantalla "El código venció"), `recuperar/nueva` (2xx = "Contraseña actualizada").
5. **Errores**: la app lee `error.codigo`, `error.detalle.intentos_restantes` y `error.detalle.reintentar_en_s` y arma el texto en español. `mensaje` solo se usa como respaldo. Un `404` con cuerpo que no sea JSON se interpreta como "el servicio todavía no está disponible".
6. **Cambiar correo** (02b): por ahora la app vuelve a "Crear cuenta" para escribir otro correo y no usa `cambiar-correo-pendiente` (pide la contraseña y no queremos llevarla entre pantallas). El endpoint puede implementarse igual; se conectará después.
7. **Cuenta atrás de reenvío**: la app usa 45 s fijos en pantalla; el servidor igual debe imponer el límite y responder `429 demasiado_pronto` con `reintentar_en_s`.

Probado en el emulador: contra el servidor actual (sin endpoints) 03b muestra "El servicio de códigos todavía no está disponible". Falta la prueba de extremo a extremo cuando el servidor responda.
