# IRPFdibujitos

> Hecho por **David Antizar** para **Jon** y **Españita**.
> Para que cuando un boomer te diga "es que en mis tiempos pagabamos mas", le pongas la grafica delante.

**Web**: https://ntizar.github.io/IRPFdibujitos/
**Codigo**: MIT · **Datos y manual**: CC0 1.0 · Mas abierto, imposible.

---

## Que es esto

Una web sencilla, en azul y naranja como Españita misma, donde:

1. Metes tu **bruto anual**.
2. Eliges un **ano normativo** entre 2012 y 2026.
3. Ves **tu neto, tu IRPF, tu cotizacion** y **cuanto le cuestas a tu jefe** (spoiler: mas de lo que crees).
4. Y, lo importante, ves **la grafica de la verguenza**: el tipo efectivo del IRPF para el mismo salario real entre 2012 y 2026, ajustado por inflacion.

Si la linea de **2026 esta por encima** de las grises, te estan crujiendo mas hoy que hace 14 anos para el mismo poder adquisitivo. Y no es porque ganes mas. Es por la **progresividad en frio**.

## Que es la progresividad en frio (en una frase)

Los tramos del IRPF **no se actualizan con el IPC**. Asi que cuando te suben el sueldo "lo que la inflacion", te metes en un tramo mas alto. Pagas mas IRPF. Te quedas igual o peor en el bolsillo. Pero los numeros nominales suben y nadie protesta.

Es el impuesto silencioso. No tiene padre politico, no aparece en titulares, no se vota. Solo te lo encuentras en la nomina.

## Convocatoria abierta

**Jon** tira la idea. **David** monta el codigo. Y desde aqui llamamos a:

- **Fiscalistas, economistas e inspectores**: auditen el codigo. Cada euro de cada tramo de cada ano. Si ven algo mal, [issue tipo `auditoria-fiscal`](https://github.com/Ntizar/IRPFdibujitos/issues/new?template=01_auditoria_fiscal.md) con la cita del BOE. Lo arreglamos en el dia.
- **Devs Python**: refactorizad, anadid tests, optimizad. Lo que querais.
- **Devs web**: mejorad el front. Es vanilla a proposito, cero npm, cero build, cero excusas.
- **Divulgadores**: el manual esta en `docs/manual.md`. En v0. Hay que pulirlo, traducirlo, ilustrarlo. Sin pedir permiso.

Convocados originales del hilo: @Gsnchez · @XMihura · @Inspectores_IHE · @frdelatorre · @Jaume_Vinas · @SantiCalvo_Eco

## Para boomers que han llegado hasta aqui

Tranquilos. Esto no es contra vosotros. Es contra el **sistema** que lleva 14 anos sin deflactar tramos del IRPF mientras la vida sube un 30% acumulado. Si os gustaba mas Espana antes, la grafica os va a dar la razon en algunas cosas y un disgusto en otras.

Pero por favor: dejad de decir que la juventud no se esfuerza. Mirad el grafico primero.

## Como reproducirlo en local

```bash
git clone https://github.com/Ntizar/IRPFdibujitos
cd IRPFdibujitos/python
pip install -r requirements.txt
python generar_datos.py     # genera los JSON que come la web
pytest                       # 47 tests, deberian pasar
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
  irpfdibujitos/   <- motor (parametros normativos + calculo)
  generar_datos.py <- exporta JSON para la web
  generar_excel.py <- reproduce el Excel mega-detallado de auditoria
  tests/           <- pytest
  original/        <- script original de David, intacto, por trazabilidad
data/              <- JSON precalculados (los come la web)
web/               <- HTML + CSS + JS vanilla. GitHub Pages.
docs/              <- manual divulgativo
.github/           <- CI + plantillas de issue
```

## Aviso de adultos

Esto es **divulgativo**. No es asesoramiento fiscal. Si tu cuñado dice lo contrario, ensenale el codigo. Si tu cuñado **es asesor fiscal**, mejor todavia: que abra un PR.

Modela:
- IRPF estatal+autonomico de referencia (no contempla peculiaridades por CCAA).
- Cotizaciones SS regimen general.
- Reduccion art.20, gastos fijos art.19, MEI, cuota de solidaridad, deduccion SMI.
- Limite del 43% del art. 85.3 RIRPF.

No modela (todavia, abierto a PR):
- Hijos, ascendientes, discapacidad.
- Diferencias por CCAA.
- Retribuciones en especie.
- Pagadores multiples.
- Aportaciones a planes de pensiones.

## Licencia

- **Codigo** (Python, JS, CSS, HTML): MIT. Haz lo que quieras, solo no nos demandes.
- **Contenido** (manual, datos, JSON, textos, capturas): CC0 1.0. Renuncia total. Es de todos.

## Creditos

Hecho por **David Antizar** ([@DavidAntizar](https://x.com/DavidAntizar)) para **Jon** y **Españita**.

Si te ha gustado, comparte. Si encuentras un fallo, abre un issue. Si te ha cambiado la perspectiva, cuentaselo a un boomer.

GO GO GO.
