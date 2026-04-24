# IRPFdibujitos

Democraticemos el calculo del IRPF y del salario neto en Espana.

Este repositorio nace con tres objetivos:

1. Que cualquiera pueda meter su salario bruto y entender, con dibujitos, como sale su salario neto.
2. Comparar el mismo salario real entre 2012 y 2026 para visualizar la **progresividad en frio**: cuanto poder adquisitivo se gana o se pierde aunque suban los numeros.
3. Que economistas, fiscalistas e inspectores **auditen** los calculos linea a linea y los developers los pulan.

Web (proximamente, GitHub Pages): https://ntizar.github.io/IRPFdibujitos/

Licencias: codigo MIT, contenido y datos CC0 1.0. Todo lo abierto que la ley permite.

## Convocatoria

Necesitamos:

- **Fiscalistas, economistas e inspectores**: auditar parametros normativos y formulas anio a anio. Cada euro de tramo, cada reduccion del art.20, cada minimo personal, cada deduccion del SMI. Si veis algo mal, abrid issue del tipo `auditoria-fiscal`.
- **Developers Python**: refactorizar el motor, anadir tests por anio (caso conocido y caso limite), optimizar la generacion de datos.
- **Developers Web**: la pagina actual es vanilla a proposito (cero build, todo auditable). Bienvenidas mejoras de UX, accesibilidad y graficas, manteniendo cero dependencias salvo las imprescindibles.
- **Divulgadores**: el manual `docs/manual.md` esta en v0. Hay que explicar claro las normativas y su impacto entre 2012 y 2026.

Plantillas de issue listas en GitHub para cada rol.

## Estructura

```
python/             motor de calculo + generador de Excel y JSON
  irpfdibujitos/    paquete (parametros, motor, inflacion)
  tests/            pruebas pytest
  generar_excel.py  reproduce el Excel original de auditoria
  generar_datos.py  exporta los JSON que consume la web
web/                GitHub Pages (HTML + CSS + JS vanilla)
data/               JSON precalculados publicados (uno por anio + comparativa)
docs/               manual divulgativo
```

## Como reproducir los calculos en local

```bash
cd python
pip install -r requirements.txt
python generar_excel.py     # genera Auditoria_Integral_Nominas_e_Inflacion_2012_2026.xlsx
python generar_datos.py     # genera ../data/*.json para la web
pytest                       # corre tests
```

## Como abrir la web en local

No hace falta build. Solo un servidor estatico cualquiera:

```bash
cd web
python -m http.server 8000
# abre http://localhost:8000
```

## Aviso importante

Esto es una herramienta divulgativa. **No es asesoramiento fiscal**. La nomina real de cada persona depende de circunstancias personales (familia, discapacidad, comunidad autonoma, retribuciones en especie, regularizaciones, etc.) que este modelo no contempla en su V1. Para tu caso concreto, pregunta a un profesional.

## Origen

Hilo original donde se convoca el proyecto: ver `docs/origen.md`.

## Contacto

Issues y discussions en este mismo repositorio.
