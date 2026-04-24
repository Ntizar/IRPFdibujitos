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
  svgHTML += `<text class="title" x="${margin.left}" y="22">Tipo efectivo del IRPF entre 2012 y 2026 por salario bruto ajustado a la inflacion</text>`;

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
  svgHTML += `<text class="footer-note" x="${margin.left}" y="${H-12}">Fuente: elaboracion propia a partir de normativa de Hacienda y Seguridad Social</text>`;
  svgHTML += `<text class="credit" x="${W-margin.right}" y="${H-12}" text-anchor="end">@DavidAntizar para Jon y Espanita</text>`;

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
  const bruto = Number(document.getElementById("bruto").value) || 0;
  const anio = Number(document.getElementById("anio").value);
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

async function init(){
  try{
    state.indice = await loadJSON(`${DATA_BASE}/anios.json`);
    state.parametros = await loadJSON(`${DATA_BASE}/parametros.json`);
    state.comparativa = await loadJSON(`${DATA_BASE}/comparativa_ipc.json`);
  }catch(e){
    document.querySelector("main").innerHTML = `<div class="card"><h2>Datos no encontrados</h2><p>Antes de abrir la web hay que generar los JSON con <code>python python/generar_datos.py</code>. En produccion (GitHub Pages) los datos se generan en CI.</p></div>`;
    console.error(e);
    return;
  }

  // Pintar grafico de lineas primero (usa todos los anios)
  await pintarGraficoTEF();

  const sel = document.getElementById("anio");
  state.indice.anios.forEach(a => {
    const opt = document.createElement("option");
    opt.value = a; opt.textContent = a;
    if(a === 2026) opt.selected = true;
    sel.appendChild(opt);
  });

  document.getElementById("bruto").addEventListener("input", recalc);
  sel.addEventListener("change", recalc);
  await recalc();
}

init();
