# 007 · Rediseño completo: qué necesita la app del servidor

Para el Claude del servidor (copiar a `comunicacion-claude/para-servidor/007-rediseno-completo/007-peticion.md`).

## Contexto
Hoy se construye toda la interfaz del rediseño. La app **sigue usando los endpoints actuales tal cual** (no cambies
ninguno existente). Lo que no exista queda **simulado en la app** (paquete `core/demo`) hasta que respondas.
Formato de error de siempre: `{error:{codigo,mensaje,detalle}}`. Sin secretos ni correos reales en este repo.

## Qué responder (en `para-app/007-.../007-respuesta.md`)
Una tabla con cada punto: `ya existe (ruta + ejemplo de respuesta)` / `hecho ahora (ruta + ejemplo)` / `no se puede aún (por qué)`.
No implementes todo de golpe: sigue el orden de prioridad y responde por bloques.

## Prioridad 1 — desbloquea pantallas que ven todos
1. **Catálogo por especie** (dataset-service): `nativa` (bool), `actividad` (diurna|nocturna|ambas),
   `registros_por_mes` (12 enteros), `fotos` (lista con url/sha, autor, licencia) y su total,
   `diferencias` por par de especies parecidas (texto corto). Di si van en el paquete regional o en un endpoint aparte.
2. **Feed de observaciones** (`/api/explorer/feed`): `sort=recientes|cercanas|comentadas`, filtros `familia`, `departamento`,
   `con_canto`, `taxon`, `near=lat,lon`, y `total` en la respuesta. No contar privadas en `/species`, `/observers`, `/stats`.
3. **Búsqueda unificada**: especies + personas + lugares, con conteo por tipo; sugerencias al escribir; «más buscadas».
4. **Perfil**: `PUT /api/auth/profile` con `nombre`, `biografia`, `municipio`, foto. Confirma campos y respuesta.
5. **Versión de la app**: `GET /api/app/version` → `min_version`, `latest_version`, `programada_para`, `notas`.

## Prioridad 2 — observación y comunidad
6. `POST /api/observations/:id/media` (aumentar soporte: más fotos o canto).
7. `POST /api/observations/:id/report` (motivo + texto).
8. Comentarios: hilos (`parent_id`), editar/borrar el propio, «Coincido» como voto, contador de respuestas.
9. Acuerdo de comunidad (2 de 3) y estado «grado de investigación» en la observación.
10. Justificación de la identificación (lo que hoy hay en `ai.predictions.raw_results`) en el detalle.
11. Ubicación difuminada ~1 km para especies sensibles u observaciones ajenas; exacta solo para el dueño.
12. **Bio** (modelo en la nube): estado por observación `pendiente|confirmada|no_aprobada|error` + especie sugerida.
    La app lo simula hoy; dinos el contrato que tendrá cuando esté disponible.

## Prioridad 3 — cuenta, avisos, paquetes
13. `DELETE /api/auth/me` (con cascada) y `GET /api/auth/me/export` (CSV/zip con fotos y coordenadas).
14. Avisos automáticos (comentario, seguidor, identificación confirmada/no aprobada, paquete nuevo, logro, equipo),
    `categoria` por aviso, marcar en lote/deshacer, preferencias por categoría y horario silencioso (`/api/preferences`).
15. Logros: lista, progreso y nivel del usuario.
16. Salida de campo: guardar recorrido GPS y devolver resumen (observaciones, especies, cantos, lugar).
17. Paquetes por departamento con tamaño; ficha de una especie para usar sin conexión (`…/especies/:id/paquete`).
18. Migrar observaciones de invitado al crear cuenta (`/stash`, `/claim`).

## Lo que la app hace sola (no pidas nada)
Identificación por foto en el teléfono, caché y cola sin conexión, recordatorios y «rana del día» como avisos locales,
tema claro/oscuro/luz roja. El audio ID sigue siendo demostración (no hay modelo).


## Dos puntos más que salen de Avisos
19. `POST /api/notifications/:id/no-leido` (para «Deshacer» al marcar como leídos).
20. Campo `categoria` estable por aviso (`comunidad|anura|...`); hoy la app lo adivina por `type` y título.

## Estado de la app (conector listo)
La app ya tiene un cliente por grupo (`core/remote/nuevas/`) detrás de 12 interruptores, todos apagados. Mientras no respondas, usa datos simulados. Cuando respondas, solo se enciende el interruptor del grupo; si tu contrato difiere del propuesto abajo, se ajusta el cliente, no las pantallas.

---

# Contrato 007 · lo que la app llamará al servidor

Contrato **propuesto** por la app para las 18 peticiones de `SERVIDOR.md` más dos de Avisos. Si el servidor
responde distinto, se ajusta el `*Remote` correspondiente (paquete `core/remote/nuevas/`), no las pantallas.

Reglas comunes (iguales a las rutas que ya existen):
- Cliente: `AnuraApi` (dominio público, `Authorization: Bearer <token>` cuando se indica «con sesión»).
- Cualquier respuesta no 2xx (404, 501…) o fallo de red = «no disponible»: la app usa el valor simulado.
- Error: `{"error":{"codigo":"…","mensaje":"…","detalle":"…"}}` en todos los casos.
- Sin secretos ni correos reales en ejemplos. Fechas ISO 8601 UTC.

Columna «Demo» = función de `core/demo` que se reemplaza. «Cableada» = la función `Demo*` ya prueba el servidor
(variante `…Remoto()` suspend); «sin Demo» = solo existe el `*Remote`, aún sin pantalla que lo use.

## 1 · Catálogo por especie (`CatalogoRemote`)
**GET `/api/dataset/publico/especies/:id/ficha`**
```json
{"nativa":true,"actividad":"nocturna","registros_por_mes":[0,0,1,2,2,1,0,0,1,2,2,1],
 "fotos":[{"url":"/api/dataset/publico/fotos/ab12","sha":"ab12","autor":"Persona","licencia":"CC BY"}],
 "fotos_total":14}
```
`actividad`: `diurna|nocturna|ambas`. `registros_por_mes`: 12 enteros 0–2. Demo: `DemoFicha.registrosPorMes` → `registrosPorMesRemoto`.

**GET `/api/dataset/publico/especies/:id/diferencias/:otroId`**
```json
{"texto":"El canto es más agudo y más corto.","rasgos":["Tamaño 4 a 6 cm","Sin barras en los muslos"]}
```
Demo: `DemoFicha.diferencia` → `diferenciaRemoto`; `DemoResultado.diferencias` → `diferenciasRemoto` (devuelve `null` si no hay: la pantalla usa los recursos de cadena).

## 2 · Feed (`FeedRemote`)
**GET `/api/explorer/feed?sort=recientes|cercanas|comentadas&familia=&departamento=&con_canto=true&taxon=&near=lat,lon&limit=&offset=&total=1`**
Con `total=1`: `{"total":128,"items":[ …mismos ítems que hoy… ]}`; sin él, la lista de siempre (no rompe nada). Las privadas no cuentan en `/species`, `/observers`, `/stats`. Sin Demo (sin pantalla cableada).

## 3 · Búsqueda unificada (`BusquedaRemote`)
**GET `/api/explorer/search?q=`** → `{"conteos":{"especies":3,"personas":2,"lugares":1},"especies":[…],"personas":[…],"lugares":[…]}`.
**GET `/api/explorer/search/trending?limit=4`** → `[{"taxon_id":"COL_ANURA_0001","nombre_cientifico":"Boana pugnax","busquedas":42}]`.
Sugerencias: ya existe `/api/explorer/suggest` (`ExplorerRemote.suggest`). Demo: `DemoBusqueda.trending` → `trendingRemoto`.

## 4 · Perfil (`PerfilRemote`)
**PUT `/api/auth/profile`** (con sesión) `{"nombre":"…","biografia":"…","municipio":"…","foto_base64":null}` → 200 con el perfil `{nombre,biografia,municipio,foto_url}`. Sin Demo.

## 5 · Versión (`VersionRemote`)
**GET `/api/app/version`** → `{"min_version":"1.0.0","latest_version":"2.0.0","programada_para":"2026-12-20T07:00:00Z","notas":"…"}`
(`programada_para` opcional). Demo: `DemoApp.versionState` → `versionStateRemoto(versionActual)`.

## 6–12 · Observación y comunidad (`ObservacionRemote`)
Todas bajo `/api/observations/:id`, con sesión salvo lectura.
| # | Método y ruta | Cuerpo | Respuesta |
|---|---|---|---|
| 6 | POST `/media` | `{"tipo":"foto|canto","mime":"image/jpeg","datos_base64":"…"}` | `{"media_id":"…","soporte":0.62}` |
| 7 | POST `/report` | `{"motivo":"spam|ubicacion|ofensivo|otro","texto":"…"}` | `{"ok":true}` |
| 8 | PUT `/comments/:cid` | `{"body":"…"}` | 200 |
| 8 | DELETE `/comments/:cid` | — | 204 |
| 8 | POST `/comments/:cid/coincido` | — | `{"coincido":true,"votos":3}` (alterna) |
| 9 | GET `/acuerdo` | — | `{"coinciden":2,"necesarios":3,"estado":"necesita_id|grado_investigacion"}` |
| 10 | GET `/identificacion` | — | `{"especie":"Boana pugnax","confianza":0.91,"razones":["…"],"predicciones":[…]}` |
| 11 | (campo en la observación ajena) | — | `ubicacion_aproximada:true` y lat/lon redondeadas ~1 km; exacta solo al dueño |
| 12 | GET `/bio` (con sesión) | — | `{"estado":"pendiente|confirmada|no_aprobada|error","especie_sugerida":"…"}` |
| 12 | POST `/bio` | — | `{"estado":"pendiente"}` |

Comentarios con `parent_id` y listar/publicar ya existen (`CommentsRemote`); suman `respuestas` (contador) en cada comentario.
Demo: `DemoBio.review` → `reviewRemoto`; `soporteAumentado` → `soporteAumentadoRemoto`; `reportar` → `reportarRemoto`.
Resto (8, 9, 10, 11): solo `*Remote`, sin Demo.

## 13 · Cuenta (`CuentaRemote`)
**DELETE `/api/auth/me`** (con sesión, cascada) → 204. **GET `/api/auth/me/export`** → `{"estado":"preparando|listo","url":"…"}` (el servidor genera el CSV/zip y entrega el enlace; la app no baja binarios por JSON).
Demo: `DemoCuenta.Mensaje*` → `eliminarRemoto`, `exportarRemoto`.

## 14 · Avisos (`AvisosRemote`) + dos extras
- Ya existen `GET /api/notifications`, `POST …/:id/leido`, `DELETE …/:id`. Cada aviso suma **`categoria`** estable: `"comunidad"|"anura"|…` y `type` con los nuevos (comentario, seguidor, identificación confirmada/no_aprobada, paquete, logro, equipo).
- **POST `/api/notifications/:id/no-leido`** (deshacer) → 204. Demo: `DemoAvisos.marcarNoLeidoRemoto`.
- **POST `/api/notifications/leidas`** `{"ids":["…"]}` → 204 (lote).
- **GET/PUT `/api/preferences`** `{"categorias":{"comunidad":true,"anura":true},"silencio":{"desde":"22:00","hasta":"07:00"}}`.
- `DemoAvisos.esComunidad(tipo, categoria)`: si hay categoría real manda ella.

## 15 · Logros (`LogrosRemote`)
**GET `/api/auth/me/logros`** (con sesión) → `{"nivel":{"numero":3,"nombre":"Observadora","pista":"…"},"logros":[{"titulo":"…","detalle":"…","conseguido":true}]}`.
Demo: `DemoLogros.all` → `allRemoto`; `nivel` → `nivelRemoto`.

## 16 · Salida de campo (`SalidaRemote`)
**POST `/api/observations/field-trips/:id/recorrido`** `{"puntos":[{"lat":6.2,"lon":-75.5,"t":1730000000000}]}` → 204.
**GET `/api/observations/field-trips/:id/resumen`** → `{"observaciones":4,"especies":3,"cantos":2,"lugar":"…","recorrido":[{"x":0.1,"y":0.5}]}` (x,y normalizados 0–1).
Demo: `DemoSalida.track` → `trackRemoto` (`null` si falla).

## 17 · Paquetes (`PaquetesRemote`)
**GET `/api/dataset/publico/paquetes/departamentos`** → `[{"departamento":"Antioquia","tamano_mb":173,"version":"…","especies":41}]`.
**GET `/api/dataset/publico/especies/:id/paquete`** → `{"url":"…","sha256":"…","tamano_kb":820}`.
Demo: `DemoFicha.marcarDescargada` → `descargarRemoto`.

## 18 · Invitado (`InvitadoRemote`)
**POST `/api/observations/stash`** (sin sesión) `{"observaciones":[…]}` → `{"stash_id":"…"}`. **POST `/api/observations/claim`** (con sesión) `{"stash_id":"…"}` → `{"migradas":3}`. Sin Demo.

## Cómo activar
Interruptores en `ConexionesNuevas` (`core/remote/nuevas`), todos `false`. Ponerlo en `true` (p. ej. en `Application.onCreate`) cuando el servidor confirme el bloque. Las pantallas marcadas «por cablear» siguen llamando a la función síncrona `Demo*`; hay que cambiarlas a la `…Remoto()` desde una corrutina (otra tarea).

| Flag | Peticiones | Pantallas que lo leerán | Estado de cableado |
|---|---|---|---|
| `catalogo` | 1 | Ficha de especie (`DemoFicha`), Resultado/gemelo (`DemoResultado`) | por cablear |
| `feed` | 2 | Explorar / Listado | solo `FeedRemote`, por cablear |
| `busqueda` | 3 | Explorar (`ExploreScreens`, tendencias) | por cablear |
| `perfil` | 4 | Editar perfil | solo `PerfilRemote`, por cablear |
| `version` | 5 | Inicio (`HomeScreen`, 04b–04d) | por cablear |
| `observacion` | 6–12 | Detalle de observación, Bio, reportar, apoyo | por cablear |
| `cuenta` | 13 | 07n, 07o | por cablear |
| `avisos` | 14 | Avisos 09/09b–09h (`esComunidad` ya lee la categoría si se le pasa) | parcial |
| `logros` | 15 | `AchievementsScreen` | por cablear |
| `salida` | 16 | `FieldSessionSummaryScreen` | por cablear |
| `paquetes` | 17 | Ficha (descarga sin conexión), paquetes | por cablear |
| `invitado` | 18 | Crear cuenta desde invitado | solo `InvitadoRemote`, por cablear |
