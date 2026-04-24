# Manual de IRPFdibujitos (v0)

> Documento vivo. Lo arrancamos para que la comunidad lo amplie.
> Licencia: CC0. Copia, pega, mejora, traduce sin pedir permiso.

## 1. De que va esto

Cuando recibes tu nomina ves dos numeros que duelen: la **cotizacion a la Seguridad Social del trabajador** y el **IRPF retenido**. Este proyecto explica como se calculan, ano a ano, desde 2012 hasta 2026, y muestra como la **inflacion** muerde la parte de tu sueldo que se va en impuestos.

## 2. Del bruto al neto, paso a paso

1. **Salario bruto anual**: lo que pacta tu contrato (incluye prorrata de extras).
2. **Base de cotizacion**: tu bruto, topado por la *base maxima* del ano. Sobre el exceso, en 2025 y 2026, se aplica ademas la **cuota de solidaridad**.
3. **Cotizaciones SS del trabajador**: aprox. 6,35% (contingencias comunes, desempleo, FP) + el **MEI** desde 2023.
4. **Rendimiento neto previo**: bruto menos cotizaciones del trabajador.
5. **Gastos fijos del art.19** LIRPF: 2.000 EUR desde 2015.
6. **Reduccion del art.20** (rentas bajas y medias): la mas movida del sistema. Ver tabla mas abajo.
7. **Base imponible** = rendimiento previo - gastos fijos - reduccion art.20.
8. **Cuota integra IRPF**: aplicas la escala progresiva por tramos a la base imponible.
9. **Cuota correspondiente al minimo personal**: la que saldria de aplicar el primer tramo al minimo personal y familiar (5.550 EUR desde 2015). Se resta.
10. **Deduccion por SMI** (2025 y 2026): para rentas bajas, hasta 340 EUR (2025) o 590,89 EUR (2026).
11. **Tope del 43%** (art. 85.3 RIRPF): la retencion no puede superar el 43% de (bruto - minimo exento de retencion).
12. **IRPF retenido** = el menor entre la cuota y el tope del 43%.
13. **Neto** = bruto - cotizacion del trabajador - IRPF.

## 3. Que cambio entre 2012 y 2026 (resumen)

- **2012-2014**: escala de 7 tramos, marginal maximo 52% (incluso 56% con autonomicos en algunos territorios). Reduccion art.20 de hasta 4.080 EUR. Sin gastos fijos del art.19.
- **2015**: la gran reforma de Montoro. 5 tramos, marginal maximo 46%. Aparecen los 2.000 EUR de gastos fijos. Reduccion art.20 baja a 3.700 EUR.
- **2016-2020**: marginal maximo al 45%, sin grandes cambios estructurales.
- **2018**: regimen transitorio especial; la reduccion del art.20 se calcula como media del esquema viejo y nuevo durante medio ano.
- **2019**: se amplia la reduccion del art.20 a 5.565 EUR.
- **2021**: vuelve un tramo extra al 47% para rentas > 300.000 EUR.
- **2023**: arranca el **MEI** (cotizacion SS adicional). La reduccion del art.20 sube a 6.498 EUR.
- **2024**: la reduccion del art.20 sube a 7.302 EUR. MEI sube ligeramente.
- **2025**: aparece la **cuota de solidaridad** sobre exceso de base maxima. Aparece la deduccion por SMI (340 EUR para rentas bajas).
- **2026**: deduccion SMI hasta 590,89 EUR. MEI y solidaridad suben otra vez.

## 4. Progresividad en frio

Si tu salario sube nominalmente lo mismo que el IPC, "deberias" mantener tu poder adquisitivo. Pero los **tramos del IRPF y el minimo personal NO se actualizan automaticamente** con el IPC. Asi que aunque cobres mas euros, te metes en tramos mas altos por inflacion, no por mejora real. El neto en euros constantes baja.

A esto se le llama **progresividad en frio**. La grafica de la web muestra exactamente cuanto pierdes (o ganas, en ciertos tramos) si tu salario evoluciona con el IPC.

## 5. Que NO modela este V1

- Circunstancias familiares (hijos, ascendientes, discapacidad).
- Diferencias por comunidad autonoma.
- Retribuciones en especie.
- Regularizaciones a mitad de ano.
- Pagadores multiples.
- Reducciones por aportaciones a planes de pensiones.

Todo esto son issues abiertos a la comunidad. Si te animas, ven al repo.

## 6. Como auditar el codigo

1. Lee `python/irpfdibujitos/parametros.py` (es el unico fichero de parametros).
2. Compara cada bloque con la normativa BOE del ano correspondiente.
3. Si encuentras un valor mal, abre un issue tipo `auditoria-fiscal` con la fuente legal (articulo y enlace al BOE).

Gracias por leer hasta aqui. Esto es un experimento de divulgacion abierta. Mejorelo quien quiera.
