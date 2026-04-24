# Como contribuir a IRPFdibujitos

Bienvenido. Aqui no hace falta CLA ni firmar nada raro: codigo MIT, contenido CC0.

## Si eres fiscalista, economista o inspector

1. Mira `python/irpfdibujitos/parametros.py`. Ahi esta toda la normativa codificada.
2. Si ves un valor mal, abre issue **Auditoria fiscal** con:
   - Ano y parametro afectado.
   - Valor que aparece y valor correcto.
   - Fuente legal (articulo + enlace al BOE).
3. Si quieres, manda PR cambiando solo ese valor + comentario explicativo.

## Si eres developer Python

- Mantenemos el codigo simple y sin dependencias salvo `pandas`, `numpy`, `openpyxl`, `pytest`.
- Anade tests en `python/tests/` por cada cambio de logica.
- Antes de un PR grande, abre issue para discutir.

## Si eres developer web

- La web es vanilla a proposito. Cero build. Cero npm.
- Si quieres anadir graficas mas chulas, valoramos librerias *zero-dependency* o cargadas via CDN explicita.
- Mantener accesibilidad (contraste, navegacion teclado, sin animaciones agresivas).

## Si eres divulgador

- `docs/manual.md` esta en v0. Mejora redaccion, anade ejemplos, traduce.
- Toda mejora editorial es bienvenida en PR directa.

## Plantillas

Hay plantillas listas para issues de:
- Auditoria fiscal
- Bug en codigo
- Mejora UI/UX
- Mejora del manual

## Codigo de conducta minimo

Critica al codigo, no a las personas. Cita fuentes. Si discutes normativa, muestra articulo. Si discutes codigo, muestra test.
