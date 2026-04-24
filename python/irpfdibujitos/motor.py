"""Motor de calculo de nomina (cotizaciones, IRPF, neto)."""

from __future__ import annotations
from typing import Tuple


def calcular_cuotas_por_tramo(base_liq: float, tramos: list) -> Tuple[dict, float]:
    """Reparte la cuota integra IRPF entre tramos de la escala."""
    cuotas = {f"T{i+1} ({round(t*100, 1)}%)": 0.0 for i, (_, t) in enumerate(tramos)}
    cuota_total = 0.0
    if base_liq <= 0:
        return cuotas, cuota_total
    lim_ant = 0.0
    for i, (lim, tipo) in enumerate(tramos):
        nombre = f"T{i+1} ({round(tipo*100, 1)}%)"
        if base_liq > lim:
            cuota = (lim - lim_ant) * tipo
            cuotas[nombre] = cuota
            cuota_total += cuota
            lim_ant = lim
        else:
            cuota = (base_liq - lim_ant) * tipo
            cuotas[nombre] = cuota
            cuota_total += cuota
            break
    return cuotas, cuota_total


def _cotizaciones(bruto: float, p: dict) -> Tuple[float, float, float]:
    """Devuelve (base_cotizacion, cot_empresa, cot_trabajador)."""
    base_cotizacion = min(bruto, p['base_max'])
    exceso_base = max(0.0, bruto - p['base_max'])

    tipo_emp = sum(x[0] for x in p['ss_tipos'].values()) + p['mei'][0]
    tipo_tra = sum(x[1] for x in p['ss_tipos'].values()) + p['mei'][1]

    cot_emp = base_cotizacion * tipo_emp
    cot_tra = base_cotizacion * tipo_tra

    if p['solidaridad'] and exceso_base > 0:
        l1 = p['base_max'] * 0.10
        l2 = p['base_max'] * 0.50
        e1 = min(exceso_base, l1)
        e2 = min(max(0.0, exceso_base - l1), l2 - l1)
        e3 = max(0.0, exceso_base - l2)
        q_sol = (e1 * p['solidaridad'][0][1] +
                 e2 * p['solidaridad'][1][1] +
                 e3 * p['solidaridad'][2][1])
        # Reparto 5/6 empresa, 1/6 trabajador (configuracion estandar)
        cot_emp += q_sol * (5 / 6)
        cot_tra += q_sol * (1 / 6)

    return base_cotizacion, cot_emp, cot_tra


def calcular_nomina_detallada(bruto: float, p: dict) -> dict:
    """Calculo completo con desglose por tramo, para auditoria fila a fila."""
    _, cot_emp, cot_tra = _cotizaciones(bruto, p)
    coste_laboral = bruto + cot_emp

    rn_previo = bruto - cot_tra
    red_trabajo = p['reduccion_trabajo'](rn_previo)
    rn_neto = max(0.0, rn_previo - p['gastos_fijos'])
    base_imp = max(0.0, rn_neto - red_trabajo)

    cuotas_tramos, cuota_integra = calcular_cuotas_por_tramo(base_imp, p['tramos_irpf'])
    cuota_minimo = p['irpf_minimo'] * p['tramos_irpf'][0][1]
    cuota_teorica = max(0.0, cuota_integra - cuota_minimo)

    deduccion = p['deduccion_smi'](bruto)
    cuota_tras_smi = max(0.0, cuota_teorica - deduccion)

    limite_43 = max(0.0, (bruto - p['minimo_exento']) * 0.43)
    irpf_final = min(cuota_tras_smi, limite_43)
    neto = bruto - cot_tra - irpf_final

    fila = {
        "Salario Bruto": bruto,
        "Cot. Soc. Empresa": round(cot_emp, 2),
        "Coste Laboral": round(coste_laboral, 2),
        "Cot. Soc. Trab.": round(cot_tra, 2),
        "Ren. Previo": round(rn_previo, 2),
        "Gastos Fijos": p['gastos_fijos'],
        "Red. Ren. Trab.": round(red_trabajo, 2),
        "Base Imponible": round(base_imp, 2),
    }
    for k, v in cuotas_tramos.items():
        fila[k] = round(v, 2)
    fila.update({
        "Cuota Integra": round(cuota_integra, 2),
        "Cuota Minimo Personal": round(cuota_minimo, 2),
        "Cuota Teorica": round(cuota_teorica, 2),
        "Deduccion SMI": round(deduccion, 2),
        "Cuota tras SMI": round(cuota_tras_smi, 2),
        "Limite 43% (Art 85.3)": round(limite_43, 2),
        "IRPF Final": round(irpf_final, 2),
        "Salario Neto": round(neto, 2),
    })
    return fila


def calcular_nomina_agregada(bruto: float, p: dict) -> dict:
    """Version compacta: solo agregados. Util para la web y comparativas."""
    _, cot_emp, cot_tra = _cotizaciones(bruto, p)
    coste_lab = bruto + cot_emp

    rn_previo = bruto - cot_tra
    red20 = p['reduccion_trabajo'](rn_previo)
    base_imp = max(0.0, rn_previo - p['gastos_fijos'] - red20)

    _, cuota_integra = calcular_cuotas_por_tramo(base_imp, p['tramos_irpf'])
    q_min = p['irpf_minimo'] * p['tramos_irpf'][0][1]
    q_teorica = max(0.0, cuota_integra - q_min)
    q_smi = max(0.0, q_teorica - p['deduccion_smi'](bruto))

    lim_43 = max(0.0, (bruto - p['minimo_exento']) * 0.43)
    irpf_final = min(q_smi, lim_43)
    neto = bruto - cot_tra - irpf_final

    return {
        "bruto": round(bruto, 2),
        "coste_laboral": round(coste_lab, 2),
        "ss_empresa": round(cot_emp, 2),
        "ss_trabajador": round(cot_tra, 2),
        "base_imponible": round(base_imp, 2),
        "irpf": round(irpf_final, 2),
        "neto": round(neto, 2),
        "tipo_efectivo_irpf": round(irpf_final / bruto * 100, 2) if bruto > 0 else 0.0,
        "tipo_efectivo_total": round((cot_tra + irpf_final) / bruto * 100, 2) if bruto > 0 else 0.0,
    }
