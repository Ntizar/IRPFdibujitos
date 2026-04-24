// IRPFdibujitos · web vanilla, cero dependencias.
// Lee los JSON precalculados en /data/ y dibuja:
//  1) Grafico de lineas SVG: tipo efectivo IRPF vs bruto (en EUR 2026) por ano
//  2) Calculadora interactiva
//  3) Comparativa IPC en barras
//  4) Tabla de tramos del ano

const DATA_BASE = "../data";  // se reescribe a "data" en CI para Pages

const eur = n => new Intl.NumberFormat("es-ES",{style:"currency",currency:"EUR",maximumFractionDigits:0}).format(n);
const pct = n => new Intl.NumberFormat("es-ES",{maximumFractionDigits:1}).format(n) + " %";

const state = {
  indice: null,
  parametros: null,
  comparativa: null,
  cacheAnios: {},
  hoverAnio: null,
};

async function loadJSON(path){
  const r = await fetch(path, {cache: "no-cache"});
  if(!r.ok) throw new Error("No se pudo cargar " + path);
  return r.json();
}

async function getAnio(anio){
  if(state.cacheAnios[anio]) return state.cacheAnios[anio];
  const data = await loadJSON(`${DATA_BASE}/anio_${anio}.json`);
  state.cacheAnios[anio] = data;
  return data;
}

// Interpolacion lineal entre los dos brutos mas cercanos del JSON
function consultarBruto(dataAnio, bruto){
  const cols = dataAnio.columns;
  const rows = dataAnio.rows;
  const step = dataAnio.step;
  const min = dataAnio.min_bruto, max = dataAnio.max_bruto;
  const b = Math.max(min, Math.min(max, bruto));
  const idx = Math.floor((b - min) / step);
  const r0 = rows[idx];
  const r1 = rows[Math.min(idx+1, rows.length-1)];
  const t = (b - r0[0]) / step;
  const out = {};
  cols.forEach((c, i) => out[c] = r0[i] + (r1[i]-r0[i]) * (t || 0));
  return out;
}

// =============================================================================
// 1) GRAFICO DE LINEAS SVG
// =============================================================================

async function construirSerieAnio(anio){
  // Para cada salario "real" en EUR 2026 (eje X), calculamos bruto nominal y tipo efectivo
  const data = await getAnio(anio);
  const ipc = state.comparativa.ipc_acumulado_a_2026[String(anio)];
  const puntos = [];
  for(let bReal = 15000; bReal <= 100000; bReal += 1000){
    const brutoNominal = bReal / ipc;
    const reg = consultarBruto(data, brutoNominal);
    // tipo efectivo IRPF = irpf / bruto * 100 (es invariante al ajuste IPC)
    puntos.push([bReal, reg.tipo_efectivo_irpf_pct]);
  }
  return puntos;
}

async function pintarGraficoTEF(){
  const svg = document.getElementById("chart-tef");
  const W = 1100, H = 560;
  const margin = {top:48, right:32, bottom:70, left:62};
  const innerW = W - margin.left - margin.right;
  const innerH = H - margin.top - margin.bottom;

  const xMin = 15000, xMax = 100000;
  const yMin = 0, yMax = 36;

  const x = v => margin.left + (v - xMin) / (xMax - xMin) * innerW;
  const y = v => margin.top + (1 - (v - yMin) / (yMax - yMin)) * innerH;

  // Construimos series para todos los anios
  const anios = state.indice.anios;
  const series = {};
  for(const a of anios){
    series[a] = await construirSerieAnio(a);
  }

  // Color por ano: gris para todos, naranja 2026, azul si hover
  const colorBase = a => {
    if(a === 2026) return "#ff6b1a";
    // gradiente sutil de gris segun antiguedad
    const t = (a - 2012) / (2026 - 2012);
    const lum = 60 - t * 25;  // 60% (claro) a 35% (oscuro)
    return `hsl(220, 8%, ${lum}%)`;
  };

  // Gridlines + ejes
  let svgHTML = "";

  // Titulo
  svgHTML += `<text class="title" x="${margin.left}" y="22">Tipo efectivo del IRPF entre 2012 y 2026 por salario bruto ajustado a la inflación</text>`;

  // Grid Y
  for(let v = 0; v <= yMax; v += 2){
    const yp = y(v);
    svgHTML += `<line class="grid" x1="${margin.left}" x2="${margin.left+innerW}" y1="${yp}" y2="${yp}"/>`;
    svgHTML += `<text class="axis-label" x="${margin.left-8}" y="${yp+4}" text-anchor="end">${v}%</text>`;
  }

  // Grid X (cada 5k)
  for(let v = xMin; v <= xMax; v += 5000){
    const xp = x(v);
    svgHTML += `<line class="grid" x1="${xp}" x2="${xp}" y1="${margin.top}" y2="${margin.top+innerH}"/>`;
    svgHTML += `<text class="axis-label" x="${xp}" y="${margin.top+innerH+18}" text-anchor="middle" transform="rotate(-45 ${xp} ${margin.top+innerH+18})">${v.toLocaleString("es-ES")} EUR</text>`;
  }

  // Ejes
  svgHTML += `<line class="axis" x1="${margin.left}" x2="${margin.left+innerW}" y1="${margin.top+innerH}" y2="${margin.top+innerH}"/>`;
  svgHTML += `<line class="axis" x1="${margin.left}" x2="${margin.left}" y1="${margin.top}" y2="${margin.top+innerH}"/>`;

  // Lineas (todas menos 2026 primero, 2026 al final para que quede arriba)
  const ordered = anios.filter(a => a !== 2026).concat([2026]);
  for(const a of ordered){
    const pts = series[a].map(([xv, yv]) => `${x(xv)},${y(yv)}`).join(" ");
    const cls = a === 2026 ? "line line-actual" : "line";
    svgHTML += `<polyline class="${cls}" data-anio="${a}" points="${pts}" stroke="${colorBase(a)}"/>`;
  }

  // Footer
  svgHTML += `<text class="footer-note" x="${margin.left}" y="${H-12}">Fuente: elaboración propia a partir de normativa de Hacienda y Seguridad Social</text>`;
  svgHTML += `<text class="credit" x="${W-margin.right}" y="${H-12}" text-anchor="end">@DavidAntizar para Jon y España</text>`;

  svg.innerHTML = svgHTML;

  // Leyenda interactiva
  const legendEl = document.getElementById("chart-legend");
  legendEl.innerHTML = "";
  for(const a of anios){
    const lg = document.createElement("button");
    lg.type = "button";
    lg.className = "lg" + (a === 2026 ? " active" : "");
    lg.dataset.anio = a;
    lg.style.color = colorBase(a);
    lg.innerHTML = `<i></i>${a}`;
    lg.addEventListener("mouseenter", () => destacarLinea(a));
    lg.addEventListener("mouseleave", () => destacarLinea(null));
    lg.addEventListener("click", () => {
      document.getElementById("anio").value = a;
      recalc();
    });
    legendEl.appendChild(lg);
  }
}

function destacarLinea(anio){
  const lines = document.querySelectorAll("#chart-tef .line");
  lines.forEach(ln => {
    const a = Number(ln.dataset.anio);
    ln.classList.remove("line-hover");
    if(anio === null){
      ln.style.opacity = (a === 2026) ? 1 : 0.55;
      ln.style.strokeWidth = (a === 2026) ? 2.6 : 1.2;
    } else if(a === anio){
      ln.style.opacity = 1;
      ln.style.strokeWidth = 2.8;
      ln.classList.add("line-hover");
    } else {
      ln.style.opacity = 0.18;
      ln.style.strokeWidth = 1;
    }
  });
}

// =============================================================================
// 2) CALCULADORA + 3) BARRAS IPC + 4) TABLA TRAMOS
// =============================================================================

function pintarCalculadora(reg){
  document.getElementById("r-neto").textContent  = eur(reg.neto);
  document.getElementById("r-irpf").textContent  = eur(reg.irpf);
  document.getElementById("r-sst").textContent   = eur(reg.ss_trabajador);
  document.getElementById("r-coste").textContent = eur(reg.coste_laboral);
  document.getElementById("r-tef").textContent   = pct(reg.tipo_efectivo_total_pct);

  const total = reg.bruto || 1;
  document.getElementById("bar-neto").style.width = (reg.neto/total*100)+"%";
  document.getElementById("bar-irpf").style.width = (reg.irpf/total*100)+"%";
  document.getElementById("bar-ss").style.width   = (reg.ss_trabajador/total*100)+"%";
}

function pintarTramos(anio){
  const p = state.parametros[String(anio)];
  const tbody = document.querySelector("#tabla-tramos tbody");
  tbody.innerHTML = "";
  p.tramos_irpf.forEach((t, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td><strong>T${i+1}</strong></td><td>${t.hasta===null?"En adelante":eur(t.hasta)}</td><td>${pct(t.tipo_pct)}</td>`;
    tbody.appendChild(tr);
  });
}

async function pintarComparativa(brutoRef){
  const ipc = state.comparativa.ipc_acumulado_a_2026;
  const anios = state.comparativa.anios;
  const cont = document.getElementById("grafico");
  cont.innerHTML = "";

  const data2026 = await getAnio(2026);
  const ref = consultarBruto(data2026, brutoRef).neto;

  const filas = [];
  for(const a of anios){
    const dataA = await getAnio(a);
    const inf = ipc[String(a)];
    const brutoNominal = brutoRef / inf;
    const reg = consultarBruto(dataA, brutoNominal);
    const netoEnEur2026 = reg.neto * inf;
    const ratio = ref > 0 ? netoEnEur2026 / ref : 1;
    filas.push({anio:a, ratio, delta: netoEnEur2026 - ref});
  }

  const maxRatio = Math.max(1.0, ...filas.map(f=>f.ratio));
  const anioActual = Number(document.getElementById("anio").value);
  filas.forEach(f => {
    const div = document.createElement("div");
    const below = f.ratio < 1;
    const isActual = f.anio === anioActual;
    div.className = "gfila" + (isActual ? " actual" : "");
    const w = (f.ratio / maxRatio) * 100;
    div.innerHTML = `
      <span class="gano">${f.anio}</span>
      <div class="gbar ${below?"below":""}"><i style="width:${w.toFixed(1)}%"></i></div>
      <span class="gval">${(f.ratio*100).toFixed(1)}%  (${f.delta>=0?"+":""}${eur(f.delta)})</span>
    `;
    cont.appendChild(div);
  });
}

async function recalc(){
  const bruto = Number(document.getElementById("bruto-range").value) || 0;
  const anio = Number(document.getElementById("anio-range").value);
  document.getElementById("bruto-out").textContent = eur(bruto);
  document.getElementById("anio-out").textContent = anio;
  const dataAnio = await getAnio(anio);
  const reg = consultarBruto(dataAnio, bruto);
  pintarCalculadora(reg);
  pintarTramos(anio);
  await pintarComparativa(bruto);

  // Actualizar destaque en grafico de lineas
  document.querySelectorAll("#chart-legend .lg").forEach(el => {
    el.classList.toggle("active", Number(el.dataset.anio) === anio);
  });
  destacarLinea(anio);
}

// =============================================================================
// 5) "LO QUE LA INFLACION TE HA ROBADO" - vista personal
// =============================================================================

async function recalcRobo(){
  const bruto = Number(document.getElementById("robo-bruto-range").value) || 0;
  const anioBase = Number(document.getElementById("robo-anio-range").value);
  document.getElementById("robo-bruto-out").textContent = eur(bruto);
  document.getElementById("robo-anio-out").textContent = anioBase;
  if(!bruto || !anioBase) return;

  // IPC acumulado de anioBase a 2026 (factor multiplicador)
  // ipc_acumulado_a_2026[anioBase] = factor por el que multiplicar EUR(anioBase) -> EUR(2026)
  const ipcFactor = state.comparativa.ipc_acumulado_a_2026[String(anioBase)];

  // Lo que deberias cobrar hoy si tu sueldo siguiera al IPC
  const brutoDeberia = bruto * ipcFactor;

  // Tu sueldo "real" hoy en EUR del ano base (deflactado)
  const brutoRealEnBase = bruto / ipcFactor;

  // Calculos de neto en 2026 con el bruto actual
  const data2026 = await getAnio(2026);
  const reg2026 = consultarBruto(data2026, bruto);

  // Calculo de neto en 2026 si cobraras lo que el IPC dicta
  const regDeberia = consultarBruto(data2026, brutoDeberia);

  // Diferencia anual en NETO (lo que pierdes en bolsillo este ano)
  const perdidaNetaAnual = regDeberia.neto - reg2026.neto;

  // Acumulado: simulamos cada ano desde anioBase a 2026
  // Hipotesis: tu salario nominal se mantiene en el bruto actual (escenario A)
  //            vs salario que sigue al IPC ano a ano (escenario B)
  // Diferencia de neto anual, sumada en EUR de cada ano (no deflactamos al sumar
  // porque queremos "euros que dejaste de tener entonces")
  const aniosLista = state.indice.anios.filter(a => a >= anioBase && a <= 2026);
  let acumNeto = 0;
  const serie = [];  // [anio, brutoIdeal_eur2026, brutoReal_eur2026, neto_ideal, neto_real]
  for(const a of aniosLista){
    const dataA = await getAnio(a);
    const ipcA = state.comparativa.ipc_acumulado_a_2026[String(a)];
    // Escenario REAL: cobras siempre el mismo nominal (bruto actual) desde el ano base
    const brutoNominalA_real = bruto;
    // Escenario IDEAL: tu nominal sube con el IPC, en ano A nominal = bruto * factor(base->A)
    //   factor(base->A) = ipcFactor / ipcA  (porque ipc_acum_a_2026[X] = factor X->2026)
    const brutoNominalA_ideal = bruto * (ipcFactor / ipcA);

    const regReal = consultarBruto(dataA, brutoNominalA_real);
    const regIdeal = consultarBruto(dataA, brutoNominalA_ideal);

    const diffNetoA = regIdeal.neto - regReal.neto;  // en EUR de ese ano
    // Lo expresamos en EUR 2026 para sumar coherentemente
    acumNeto += diffNetoA * ipcA;

    serie.push({
      anio: a,
      brutoIdealEur2026: brutoNominalA_ideal * ipcA,
      brutoRealEur2026: brutoNominalA_real * ipcA,
      netoIdealEur2026: regIdeal.neto * ipcA,
      netoRealEur2026: regReal.neto * ipcA,
    });
  }

  // IRPF extra por progresividad en frio:
  // Si los tramos se hubieran deflactado del ano base a 2026, cobrando lo mismo (bruto actual)
  // pagarias el IRPF que pagarias en el ano base sobre el bruto deflactado al ano base
  const dataBase = await getAnio(anioBase);
  const regSiTramosBase = consultarBruto(dataBase, brutoRealEnBase);
  // Tipo efectivo IRPF entonces vs ahora (sobre mismo poder adquisitivo)
  const tefIrpfBase = regSiTramosBase.tipo_efectivo_irpf_pct;
  const tefIrpfAhora = reg2026.tipo_efectivo_irpf_pct;
  const irpfExtraAnual = (tefIrpfAhora - tefIrpfBase) / 100 * bruto;

  // Pintar KPIs
  document.getElementById("robo-deberia").textContent = eur(brutoDeberia);
  document.getElementById("robo-deberia-hint").textContent =
    `Eso es ${eur(brutoDeberia - bruto)} más al año que ahora.`;
  document.getElementById("robo-anual").textContent = eur(perdidaNetaAnual);
  document.getElementById("robo-acum").textContent = eur(acumNeto);
  document.getElementById("robo-acum-hint").textContent =
    `Sumado de ${anioBase} a 2026, en € de hoy.`;
  document.getElementById("robo-irpf-extra").textContent = eur(irpfExtraAnual);
  document.getElementById("robo-real-base").textContent = eur(brutoRealEnBase);
  document.getElementById("robo-real-base-hint").textContent =
    `Tu bruto de hoy vale lo que ${eur(brutoRealEnBase)} en ${anioBase}.`;
  document.getElementById("robo-tef").textContent = pct(reg2026.tipo_efectivo_total_pct);
  document.getElementById("robo-tef-base").textContent = pct(regSiTramosBase.tipo_efectivo_total_pct);

  // Frase de impacto
  const meses = perdidaNetaAnual > 0 ? (perdidaNetaAnual / (reg2026.neto / 12)) : 0;
  let frase;
  if(perdidaNetaAnual <= 0){
    frase = `Enhorabuena, tu salario ha aguantado el IPC desde ${anioBase}. Eres una rareza estadística.`;
  } else {
    frase = `Cobrando lo mismo desde ${anioBase} estás perdiendo ${eur(perdidaNetaAnual)} netos al año: equivale a trabajar ${meses.toFixed(1)} meses gratis cada año respecto a lo que te tocaría.`;
  }
  document.getElementById("robo-frase").textContent = frase;

  // Pintar SVG de evolucion
  pintarChartRobo(serie, anioBase);
}

function pintarChartRobo(serie, anioBase){
  const svg = document.getElementById("chart-robo");
  const W = 1100, H = 500;
  const margin = {top:48, right:32, bottom:64, left:78};
  const innerW = W - margin.left - margin.right;
  const innerH = H - margin.top - margin.bottom;

  if(serie.length < 2){
    svg.innerHTML = `<text class="title" x="${W/2}" y="${H/2}" text-anchor="middle">Elige un año base anterior a 2026</text>`;
    return;
  }

  const xMin = serie[0].anio, xMax = serie[serie.length-1].anio;
  const allVals = serie.flatMap(s => [s.brutoIdealEur2026, s.brutoRealEur2026]);
  const yMax = Math.ceil(Math.max(...allVals) / 5000) * 5000;
  const yMin = Math.floor(Math.min(...allVals) / 5000) * 5000;

  const x = v => margin.left + (v - xMin) / Math.max(1,(xMax - xMin)) * innerW;
  const y = v => margin.top + (1 - (v - yMin) / Math.max(1,(yMax - yMin))) * innerH;

  let h = "";
  h += `<text class="title" x="${margin.left}" y="22">Tu salario ideal vs tu salario real (en EUR de 2026)</text>`;

  // Grid Y
  const stepY = (yMax - yMin) <= 30000 ? 2500 : 5000;
  for(let v = yMin; v <= yMax; v += stepY){
    const yp = y(v);
    h += `<line class="grid" x1="${margin.left}" x2="${margin.left+innerW}" y1="${yp}" y2="${yp}"/>`;
    h += `<text class="axis-label" x="${margin.left-8}" y="${yp+4}" text-anchor="end">${v.toLocaleString("es-ES")} EUR</text>`;
  }
  // Grid X (cada ano)
  for(const s of serie){
    const xp = x(s.anio);
    h += `<line class="grid" x1="${xp}" x2="${xp}" y1="${margin.top}" y2="${margin.top+innerH}"/>`;
    h += `<text class="axis-label" x="${xp}" y="${margin.top+innerH+18}" text-anchor="middle">${s.anio}</text>`;
  }
  // Ejes
  h += `<line class="axis" x1="${margin.left}" x2="${margin.left+innerW}" y1="${margin.top+innerH}" y2="${margin.top+innerH}"/>`;
  h += `<line class="axis" x1="${margin.left}" x2="${margin.left}" y1="${margin.top}" y2="${margin.top+innerH}"/>`;

  // Area entre las dos lineas (la perdida)
  const ptsIdeal = serie.map(s => `${x(s.anio)},${y(s.brutoIdealEur2026)}`);
  const ptsReal = serie.map(s => `${x(s.anio)},${y(s.brutoRealEur2026)}`);
  const areaPath = `M ${ptsIdeal.join(" L ")} L ${ptsReal.slice().reverse().join(" L ")} Z`;
  h += `<path d="${areaPath}" fill="#ff6b1a" fill-opacity="0.15"/>`;

  // Linea ideal (IPC)
  h += `<polyline class="line line-actual" points="${ptsIdeal.join(" ")}" stroke="#003da5" fill="none" stroke-width="2.8"/>`;
  // Linea real (congelada nominal)
  h += `<polyline class="line" points="${ptsReal.join(" ")}" stroke="#ff6b1a" fill="none" stroke-width="2.8" stroke-dasharray="6 4"/>`;

  // Leyenda dentro del SVG
  h += `<g transform="translate(${margin.left+12},${margin.top+12})">`;
  h += `<rect width="290" height="48" fill="white" fill-opacity="0.9" rx="8" stroke="#e3e8ef"/>`;
  h += `<line x1="12" y1="18" x2="36" y2="18" stroke="#003da5" stroke-width="3"/>`;
  h += `<text x="44" y="22" class="axis-label" style="font-weight:700">Lo que deberías cobrar (sigue al IPC)</text>`;
  h += `<line x1="12" y1="38" x2="36" y2="38" stroke="#ff6b1a" stroke-width="3" stroke-dasharray="6 4"/>`;
  h += `<text x="44" y="42" class="axis-label" style="font-weight:700">Lo que cobras (congelado nominal)</text>`;
  h += `</g>`;

  // Footer
  h += `<text class="footer-note" x="${margin.left}" y="${H-12}">Año base: ${anioBase}. Todos los importes expresados en € constantes de 2026.</text>`;
  h += `<text class="credit" x="${W-margin.right}" y="${H-12}" text-anchor="end">@DavidAntizar para Jon y España</text>`;

  svg.innerHTML = h;
}

async function init(){
  try{
    state.indice = await loadJSON(`${DATA_BASE}/anios.json`);
    state.parametros = await loadJSON(`${DATA_BASE}/parametros.json`);
    state.comparativa = await loadJSON(`${DATA_BASE}/comparativa_ipc.json`);
  }catch(e){
    document.querySelector("main").innerHTML = `<div class="card"><h2>Datos no encontrados</h2><p>Antes de abrir la web hay que generar los JSON con <code>python python/generar_datos.py</code>. En producción (GitHub Pages) los datos se generan en CI.</p></div>`;
    console.error(e);
    return;
  }

  // Escala de anios para sliders (etiquetas debajo)
  const aniosTodos = state.indice.anios;
  const escAnio = document.getElementById("anio-scale");
  // Mostramos primer, alguno intermedio y ultimo
  const ticksAnio = [aniosTodos[0], aniosTodos[Math.floor(aniosTodos.length/3)], aniosTodos[Math.floor(2*aniosTodos.length/3)], aniosTodos[aniosTodos.length-1]];
  escAnio.innerHTML = ticksAnio.map(a => `<span>${a}</span>`).join("");
  const aniosBase = aniosTodos.filter(a => a < 2026);
  const escRobo = document.getElementById("robo-anio-scale");
  const ticksRobo = [aniosBase[0], aniosBase[Math.floor(aniosBase.length/3)], aniosBase[Math.floor(2*aniosBase.length/3)], aniosBase[aniosBase.length-1]];
  escRobo.innerHTML = ticksRobo.map(a => `<span>${a}</span>`).join("");

  // Pintar grafico de lineas (usa todos los anios)
  await pintarGraficoTEF();

  // Listeners sliders
  ["robo-bruto-range","robo-anio-range"].forEach(id => {
    document.getElementById(id).addEventListener("input", recalcRobo);
  });
  ["bruto-range","anio-range"].forEach(id => {
    document.getElementById(id).addEventListener("input", recalc);
  });

  await recalc();
  await recalcRobo();
}

init();
