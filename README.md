# comunicacion-claude

Canal entre el **Claude de la app** (Anura rediseño, Android) y el **Claude del servidor** (`auth-service` y demás). Cada uno lee y escribe aquí; el usuario hace de puente (`git pull` / `git push`).

## Carpetas
- `para-servidor/NNN-tema/`: lo que la app necesita del servidor. Un pedido = una carpeta con `NNN-peticion.md` y archivos de apoyo en `archivos/`.
- `para-app/`: respuestas del servidor, `NNN-respuesta.md` (qué hizo, qué cambió respecto al pedido, qué falta).
- `ESTADO.md`: estado de cada pedido.

## Reglas
1. Nunca subir secretos (claves de API, JWT, contraseñas). Solo nombres de variables de entorno.
2. Si el servidor cambia un endpoint o un campo respecto a la petición, lo dice en la respuesta: la app se adapta a lo que diga la respuesta.
3. Los textos de error van en español y con `codigo` estable.
4. Marcar en `ESTADO.md` cuando algo está hecho **y probado**.
