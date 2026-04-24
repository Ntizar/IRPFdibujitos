# IRPFdibujitos

> Hecho por **David Antizar** para **Jon** y **España**.
> Para que cuando un boomer te diga "es que en mis tiempos pagábamos más", le pongas la gráfica delante.

**Web**: https://ntizar.github.io/IRPFdibujitos/
**Código**: MIT · **Datos y manual**: CC0 1.0 · Más abierto, imposible.

---

## Qué es esto

Una web sencilla, en azul y naranja como España misma, donde:

1. Metes tu **bruto anual** (de 0 a 1.000.000 €).
2. Eliges un **año normativo** entre 2012 y 2026.
3. Ves **tu neto, tu IRPF, tu cotización** y **cuánto le cuestas a tu jefe** (spoiler: más de lo que crees).
4. Y lo importante: ves **la gráfica de la vergüenza**, el tipo efectivo del IRPF para el mismo salario real entre 2012 y 2026, ajustado por inflación.

Y arriba del todo, una sección personalísima: **"Lo que la inflación te ha robado"**. Eliges desde qué año llevas cobrando lo mismo y te dice cuántos meses gratis estás trabajando cada año respecto a lo que te tocaría.

Si la línea de **2026 está por encima** de las grises, te están crujiendo más hoy que hace 14 años para el mismo poder adquisitivo. Y no es porque ganes más. Es por la **progresividad en frío**.

## Qué es la progresividad en frío (en una frase)

Los tramos del IRPF **no se actualizan con el IPC**. Así que cuando te suben el sueldo "lo que la inflación", te metes en un tramo más alto. Pagas más IRPF. Te quedas igual o peor en el bolsillo. Pero los números nominales suben y nadie protesta.

Es el impuesto silencioso. No tiene padre político, no aparece en titulares, no se vota. Sólo te lo encuentras en la nómina.

## Convocatoria abierta

**Jon** tira la idea. **David** monta el código. Y desde aquí llamamos a:

- **Fiscalistas, economistas e inspectores**: auditen el código. Cada euro de cada tramo de cada año. Si ven algo mal, [issue tipo `auditoria-fiscal`](https://github.com/Ntizar/IRPFdibujitos/issues/new?template=01_auditoria_fiscal.md) con la cita del BOE. Lo arreglamos en el día.
- **Devs Python**: refactorizad, añadid tests, optimizad. Lo que queráis.
- **Devs web**: mejorad el front. Es vanilla a propósito, cero npm, cero build, cero excusas.
- **Divulgadores**: el manual está en `docs/manual.md`. En v0. Hay que pulirlo, traducirlo, ilustrarlo. Sin pedir permiso.

Convocados originales del hilo: @Gsnchez · @XMihura · @Inspectores_IHE · @frdelatorre · @Jaume_Vinas · @SantiCalvo_Eco

## Para boomers que han llegado hasta aquí

Tranquilos. Esto no es contra vosotros. Es contra el **sistema** que lleva 14 años sin deflactar tramos del IRPF mientras la vida sube un 30% acumulado. Si os gustaba más España antes, la gráfica os va a dar la razón en algunas cosas y un disgusto en otras.

Pero por favor: dejad de decir que la juventud no se esfuerza. Mirad el gráfico primero.

## Cómo reproducirlo en local

```bash
git clone https://github.com/Ntizar/IRPFdibujitos
cd IRPFdibujitos/python
pip install -r requirements.txt
python generar_datos.py     # genera los JSON que come la web
pytest                       # 47 tests, deberían pasar
```

Y la web:

```bash
cd ../web
python -m http.server 8000
# abre http://localhost:8000
```

## Estructura del repo

```
python/
  irpfdibujitos/   <- motor (parámetros normativos + cálculo)
  generar_datos.py <- exporta JSON para la web
  generar_excel.py <- reproduce el Excel mega-detallado de auditoría
  tests/           <- pytest
  original/        <- script original de David, intacto, por trazabilidad
data/              <- JSON precalculados (los come la web)
web/               <- HTML + CSS + JS vanilla. GitHub Pages.
docs/              <- manual divulgativo
.github/           <- CI + plantillas de issue
```

## Aviso de adultos

Esto es **divulgativo**. No es asesoramiento fiscal. Si tu cuñado dice lo contrario, enséñale el código. Si tu cuñado **es asesor fiscal**, mejor todavía: que abra un PR.

Modela:
- IRPF estatal+autonómico de referencia (no contempla peculiaridades por CCAA).
- Cotizaciones SS régimen general.
- Reducción art.20, gastos fijos art.19, MEI, cuota de solidaridad, deducción SMI.
- Límite del 43% del art. 85.3 RIRPF.

No modela (todavía, abierto a PR):
- Hijos, ascendientes, discapacidad.
- Diferencias por CCAA.
- Retribuciones en especie.
- Pagadores múltiples.
- Aportaciones a planes de pensiones.

## Licencia

- **Código** (Python, JS, CSS, HTML): MIT. Haz lo que quieras, sólo no nos demandes.
- **Contenido** (manual, datos, JSON, textos, capturas): CC0 1.0. Renuncia total. Es de todos.

## Créditos

Hecho por **David Antizar** ([@DavidAntizar](https://x.com/DavidAntizar)) para **Jon** y **España**.

Si te ha gustado, comparte. Si encuentras un fallo, abre un issue. Si te ha cambiado la perspectiva, cuéntaselo a un boomer.

GO GO GO.
