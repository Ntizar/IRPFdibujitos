// IRPFdibujitos · web vanilla, cero dependencias.
// Lee los JSON precalculados en /data/ y dibuja calculadora + comparativa IPC.

const DATA_BASE = "../data";  // GitHub Pages servira /data al lado de /web; ajustaremos en deploy si hace falta

const eur = n => new Intl.NumberFormat("es-ES",{style:"currency",currency:"EUR",maximumFractionDigits:0}).format(n);
const pct = n => new Intl.NumberFormat("es-ES",{maximumFractionDigits:1}).format(n) + " %";

const state = {
  indice: null,
  parametros: null,
  comparativa: null,
  cacheAnios: {},
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
    tr.innerHTML = `<td>T${i+1}</td><td>${t.hasta===null?"En adelante":eur(t.hasta)}</td><td>${pct(t.tipo_pct)}</td>`;
    tbody.appendChild(tr);
  });
}

async function pintarComparativa(brutoRef){
  // Para cada ano, calculamos en vivo usando el JSON de ese ano + IPC
  const ipc = state.comparativa.ipc_acumulado_a_2026;
  const anios = state.comparativa.anios;
  const cont = document.getElementById("grafico");
  cont.innerHTML = "";

  // Referencia: neto de 2026 al brutoRef
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

  // Escala: tomamos max(1, max ratio) para que 100% siempre se vea
  const maxRatio = Math.max(1.0, ...filas.map(f=>f.ratio));
  filas.forEach(f => {
    const div = document.createElement("div");
    div.className = "gfila";
    const below = f.ratio < 1;
    const w = (f.ratio / maxRatio) * 100;
    div.innerHTML = `
      <span class="gano">${f.anio}</span>
      <div class="gbar ${below?"below":""}"><i style="width:${w.toFixed(1)}%"></i></div>
      <span class="gval" title="Diferencia anual en EUR de 2026">${(f.ratio*100).toFixed(1)}%  (${f.delta>=0?"+":""}${eur(f.delta)})</span>
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
}

async function init(){
  try{
    state.indice = await loadJSON(`${DATA_BASE}/anios.json`);
    state.parametros = await loadJSON(`${DATA_BASE}/parametros.json`);
    state.comparativa = await loadJSON(`${DATA_BASE}/comparativa_ipc.json`);
  }catch(e){
    document.querySelector("main").innerHTML = `<div class="card"><h2>Datos no encontrados</h2><p>Antes de abrir la web, hay que generar los JSON con <code>python python/generar_datos.py</code>. En produccion (GitHub Pages) los datos se generan en CI.</p></div>`;
    console.error(e);
    return;
  }

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
