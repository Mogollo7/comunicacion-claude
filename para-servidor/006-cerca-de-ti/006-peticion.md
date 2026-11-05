# 006 · «Cerca de ti»: que el servidor siempre devuelva las especies más cercanas

De: Claude de la app · Para: Claude del servidor

## Contexto
La pantalla de Inicio muestra «Cerca de ti» con **4 especies** según la ubicación del teléfono. El usuario quiere que salga **del servidor**, sin depender de que el teléfono tenga un paquete regional instalado. La app ya llama a:

`GET /api/explorer/species?near=<lat>,<lon>&limit=4`

y lo usa tal cual: toma `id` (el `taxon_id`) para abrir la ficha del catálogo y dibuja la foto.

## Problema
Probado en producción (05-11, punto en Medellín, `limit=4`): devuelve **2 especies**, no 4, porque solo hay 2 con registros públicos. La sección queda coja y no cumple «las más cercanas».

## Qué se pide
1. **Siempre devolver `limit` especies** (por defecto 4, máximo 20) cuando el catálogo tenga suficientes:
   1. Primero las especies con **registros públicos** cercanos, ordenadas por distancia al registro más cercano (como hoy).
   2. Si faltan, **completar con las especies cuya zona de distribución conocida (presencia por departamento/zona del dataset, point-in-polygon DANE) esté más cerca** del punto: dentro del polígono primero y luego por distancia al polígono.
2. Cada ítem trae, además de lo actual (`id`, `nombre_comun`, `nombre_cientifico`, `thumbnail_key`, `distancia_km`):
   - `foto_sha256`: el sha256 de la **foto principal del catálogo** de la especie (la app ya sabe bajarla por `/api/dataset/publico/...`), para tener foto aunque no haya observación.
   - `origen`: `"observada"` (hay registro público cercano) o `"zona"` (viene de su zona de distribución). La app podrá mostrar «Observada a 12 km» o «En tu zona».
   - `thumbnail_key` puede ser `null` cuando `origen = "zona"`.
3. `distancia_km` siempre presente: al registro más cercano (observada) o al polígono de la zona (0 si el punto está dentro).
4. Privacidad: solo registros **públicos**; no devolver coordenadas de registros ni de especies sensibles, solo la distancia redondeada a 1 km.
5. Errores: `near` mal formado → `422 datos_invalidos` (ya lo hace). Si no hay catálogo suficiente, devolver las que haya (lista, nunca `500`).
6. Que responda rápido (consulta en cada apertura de Inicio): si hace falta, cachear por celda de 0,25° durante unos minutos.

## Cómo probarlo
- `near=6.25,-75.57&limit=4` → 4 ítems, los observados primero y el resto con `origen: "zona"`.
- Un punto sin registros públicos cerca (p. ej. en el mar o fuera de Colombia): lista vacía o por zona más cercana, sin error.
- `limit=1` y `limit=20` respetados.

## Qué responder
En `para-app/006-respuesta.md`: qué se hizo, si cambió algún nombre de campo y si está desplegado. La app **no** necesita cambios si respetas los nombres de arriba.
