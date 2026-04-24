"""Genera los JSON precalculados que consume la web (carpeta /data).

Salidas:
- data/anios.json                  : indice de anios disponibles + parametros clave
- data/anio_<YYYY>.json             : tabla agregada de 0 a 100k en saltos de 100 EUR
- data/comparativa_ipc.json         : matriz 2012-2026 x salario equivalente 2026
- data/parametros.json              : copia legible de parametros normativos (auditoria)
"""

import json
import os
import sys

# Permitir ejecutar desde cualquier sitio
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

from irpfdibujitos import (
    obtener_parametros,
    INFLACION_A_2026,
    IPC_ANUAL_DIC,
    calcular_nomina_agregada,
)

DATA_DIR = os.path.abspath(os.path.join(HERE, "..", "data"))
os.makedirs(DATA_DIR, exist_ok=True)

ANIOS = list(range(2012, 2027))
STEP = 100  # paso de 100 EUR para mantener JSON ligeros (la web interpola)
MIN_BRUTO = 0
MAX_BRUTO = 100000


def serializar_parametros():
    out = {}
    for anio in ANIOS:
        p = obtener_parametros(anio)
        out[str(anio)] = {
            "base_max": p['base_max'],
            "ss_empresa_pct": round(sum(x[0] for x in p['ss_tipos'].values()) * 100, 3),
            "ss_trabajador_pct": round(sum(x[1] for x in p['ss_tipos'].values()) * 100, 3),
            "mei_empresa_pct": round(p['mei'][0] * 100, 3),
            "mei_trabajador_pct": round(p['mei'][1] * 100, 3),
            "gastos_fijos": p['gastos_fijos'],
            "minimo_personal_irpf": p['irpf_minimo'],
            "minimo_exento_retencion": p['minimo_exento'],
            "tramos_irpf": [
                {"hasta": (None if lim == float('inf') else lim),
                 "tipo_pct": round(t * 100, 2)}
                for lim, t in p['tramos_irpf']
            ],
            "art20": p['art20_meta'],
            "tiene_solidaridad": bool(p['solidaridad']),
            "tiene_deduccion_smi": anio in (2025, 2026),
        }
    return out


def serializar_anio(anio: int):
    p = obtener_parametros(anio)
    filas = []
    for bruto in range(MIN_BRUTO, MAX_BRUTO + 1, STEP):
        n = calcular_nomina_agregada(float(bruto), p)
        filas.append([
            n['bruto'], n['coste_laboral'], n['ss_empresa'], n['ss_trabajador'],
            n['base_imponible'], n['irpf'], n['neto'],
            n['tipo_efectivo_irpf'], n['tipo_efectivo_total'],
        ])
    return {
        "anio": anio,
        "step": STEP,
        "min_bruto": MIN_BRUTO,
        "max_bruto": MAX_BRUTO,
        "columns": ["bruto", "coste_laboral", "ss_empresa", "ss_trabajador",
                    "base_imponible", "irpf", "neto",
                    "tipo_efectivo_irpf_pct", "tipo_efectivo_total_pct"],
        "rows": filas,
    }


def serializar_comparativa():
    salarios_2026 = list(range(15000, 100001, 1000))
    p_2026 = obtener_parametros(2026)
    ref = {b: calcular_nomina_agregada(float(b), p_2026)['neto'] for b in salarios_2026}

    matriz = {}
    for anio in ANIOS:
        p_anio = obtener_parametros(anio)
        inf = INFLACION_A_2026[anio]
        filas = []
        for b26 in salarios_2026:
            bruto_nom = b26 / inf
            n = calcular_nomina_agregada(bruto_nom, p_anio)
            neto_aj = n['neto'] * inf
            filas.append({
                "salario_equivalente_2026": b26,
                "ipc_multiplicador": round(inf, 6),
                "bruto_nominal_anio": round(bruto_nom, 2),
                "neto_real_en_anio_eur2026": round(neto_aj, 2),
                "neto_2026_referencia": round(ref[b26], 2),
                "delta_anual_eur2026": round(neto_aj - ref[b26], 2),
                "delta_mensual_12pagas": round((neto_aj - ref[b26]) / 12, 2),
            })
        matriz[str(anio)] = filas
    return {
        "anios": ANIOS,
        "salarios_equivalentes_2026": salarios_2026,
        "ipc_anual_dic": IPC_ANUAL_DIC,
        "ipc_acumulado_a_2026": {str(k): round(v, 6) for k, v in INFLACION_A_2026.items()},
        "datos": matriz,
    }


def main():
    print(f"Escribiendo en: {DATA_DIR}")

    indice = {
        "anios": ANIOS,
        "step": STEP,
        "min_bruto": MIN_BRUTO,
        "max_bruto": MAX_BRUTO,
        "ipc_acumulado_a_2026": {str(k): round(v, 6) for k, v in INFLACION_A_2026.items()},
    }
    with open(os.path.join(DATA_DIR, "anios.json"), "w", encoding="utf-8") as f:
        json.dump(indice, f, ensure_ascii=False, indent=2)
    print("- anios.json")

    with open(os.path.join(DATA_DIR, "parametros.json"), "w", encoding="utf-8") as f:
        json.dump(serializar_parametros(), f, ensure_ascii=False, indent=2)
    print("- parametros.json")

    for anio in ANIOS:
        with open(os.path.join(DATA_DIR, f"anio_{anio}.json"), "w", encoding="utf-8") as f:
            json.dump(serializar_anio(anio), f, ensure_ascii=False)
        print(f"- anio_{anio}.json")

    with open(os.path.join(DATA_DIR, "comparativa_ipc.json"), "w", encoding="utf-8") as f:
        json.dump(serializar_comparativa(), f, ensure_ascii=False)
    print("- comparativa_ipc.json")

    print("Listo.")


if __name__ == "__main__":
    main()
