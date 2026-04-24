# /data

Aqui se publican los JSON precalculados que consume la web:

- `anios.json`            indice de anios y rango de brutos disponibles
- `parametros.json`        parametros normativos por ano (auditable a simple vista)
- `anio_YYYY.json`         tabla agregada por bruto (paso 100 EUR)
- `comparativa_ipc.json`   matriz IPC para la pantalla de progresividad en frio

Se regeneran con:

```bash
python python/generar_datos.py
```

El workflow de GitHub Pages los regenera en cada push a `main`, asi que en produccion no hace falta commitearlos manualmente. Aun asi se pueden commitear si quieres tener la version "oficial" en el repo.
