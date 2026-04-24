"""Parametros normativos anio a anio (2012-2026).

Toda la informacion fiscal y de seguridad social vive aqui. Si un fiscalista
quiere auditar un anio concreto, este es el unico fichero que necesita leer.

AVISO: cualquier valor de este fichero es susceptible de auditoria. Si
encuentras un error, abre un issue tipo `auditoria-fiscal` con la fuente legal.
"""

from __future__ import annotations


# =============================================================================
# 1. INFLACION ACUMULADA (DICIEMBRE A DICIEMBRE)
# =============================================================================
# Fuente: INE, IPC general nacional. Variacion diciembre/diciembre.
# 2025 y 2026 son estimaciones provisionales (revisar antes de cierre).
IPC_ANUAL_DIC = {
    2013: 0.003, 2014: -0.010, 2015: 0.000, 2016: 0.016, 2017: 0.011,
    2018: 0.012, 2019: 0.008, 2020: -0.005, 2021: 0.065, 2022: 0.057,
    2023: 0.031, 2024: 0.028, 2025: 0.029, 2026: 0.030,
}


def obtener_inflacion_acumulada(anio_base: int, anio_destino: int = 2026) -> float:
    """Devuelve el multiplicador de IPC acumulado entre dos anios."""
    if anio_base == anio_destino:
        return 1.0
    multiplicador = 1.0
    for anio in range(anio_base + 1, anio_destino + 1):
        multiplicador *= (1 + IPC_ANUAL_DIC[anio])
    return multiplicador


INFLACION_A_2026 = {anio: obtener_inflacion_acumulada(anio, 2026) for anio in range(2012, 2027)}


# =============================================================================
# 2. PARAMETROS POR ANIO
# =============================================================================
_BASE_MAX = {
    2012: 39150.0, 2013: 41108.4, 2014: 43164.0, 2015: 43272.0, 2016: 43704.0,
    2017: 45014.4, 2018: 45014.4, 2019: 48841.2, 2020: 48841.2, 2021: 48841.2,
    2022: 49672.8, 2023: 53946.0, 2024: 56646.0, 2025: 58914.0, 2026: 61214.4,
}

_MINIMO_EXENTO_RETENCION = {
    2012: 11162, 2013: 11162, 2014: 11162, 2015: 12000, 2016: 12000, 2017: 12000,
    2018: 12643, 2019: 14000, 2020: 14000, 2021: 14000, 2022: 14000, 2023: 15000,
    2024: 15876, 2025: 15876, 2026: 15876,
}


def _ss_tipos_base() -> dict:
    """Tipos generales de cotizacion: [empresa, trabajador]."""
    return {
        'comunes':   [0.236,  0.047],
        'desempleo': [0.055,  0.0155],
        'fogasa':    [0.002,  0.0],
        'fp':        [0.006,  0.001],
        'atep':      [0.015,  0.0],
    }


def _mei(anio: int) -> list:
    """Mecanismo de Equidad Intergeneracional [empresa, trabajador]."""
    if anio == 2023: return [0.005,  0.001]
    if anio == 2024: return [0.0058, 0.0012]
    if anio == 2025: return [0.0067, 0.0013]
    if anio >= 2026: return [0.0075, 0.0015]
    return [0.0, 0.0]


def _solidaridad(anio: int) -> list:
    """Cuota adicional de solidaridad sobre exceso de base maxima.

    Tramos definidos como (factor_sobre_base_max, tipo). El primer tramo
    es 1.10x la base maxima, el segundo 1.50x, el tercero `inf`.
    """
    if anio == 2025:
        return [(1.10, 0.0092), (1.50, 0.0100), (float('inf'), 0.0117)]
    if anio >= 2026:
        return [(1.10, 0.0115), (1.50, 0.0125), (float('inf'), 0.0146)]
    return []


def _tramos_irpf(anio: int) -> list:
    """Escala estatal+autonomica de referencia. (limite_superior, tipo_marginal)."""
    if anio <= 2014:
        return [(17707, 0.2475), (33007, 0.30), (53407, 0.40), (120000, 0.47),
                (175000, 0.49), (300000, 0.51), (float('inf'), 0.52)]
    if anio == 2015:
        return [(12450, 0.195), (20200, 0.245), (34000, 0.305), (60000, 0.38),
                (float('inf'), 0.46)]
    if 2016 <= anio <= 2020:
        return [(12450, 0.19), (20200, 0.24), (35200, 0.30), (60000, 0.37),
                (float('inf'), 0.45)]
    return [(12450, 0.19), (20200, 0.24), (35200, 0.30), (60000, 0.37),
            (300000, 0.45), (float('inf'), 0.47)]


def _art20_meta(anio: int) -> dict:
    """Metadatos de la reduccion del art.20 LIRPF (para hojas de control)."""
    if anio <= 2014:
        return {"U_Inf": 9180, "R_Max": 4080, "U_Sup": 13260, "R_Min": 2652}
    if 2015 <= anio <= 2017:
        return {"U_Inf": 11250, "R_Max": 3700, "U_Sup": 14450, "R_Min": 0}
    if anio == 2018:
        return {"U_Inf": "Transitorio", "R_Max": "Transitorio",
                "U_Sup": "Transitorio", "R_Min": "Transitorio"}
    if 2019 <= anio <= 2022:
        return {"U_Inf": 13115, "R_Max": 5565, "U_Sup": 16825, "R_Min": 0}
    if anio == 2023:
        return {"U_Inf": 14047.5, "R_Max": 6498, "U_Sup": 19747.5, "R_Min": 0}
    return {"U_Inf": 14852, "R_Max": 7302, "U_Sup": 19747.5, "R_Min": 0}


def _build_reduccion_trabajo(anio: int):
    """Devuelve la funcion de reduccion del art.20 vigente en `anio`."""

    def reduccion(rn_previo: float) -> float:
        if anio <= 2014:
            if rn_previo <= 9180: return 4080.0
            if rn_previo <= 13260: return 4080.0 - 0.35 * (rn_previo - 9180.0)
            return 2652.0
        if 2015 <= anio <= 2017:
            if rn_previo <= 11250: return 3700.0
            if rn_previo <= 14450: return 3700.0 - 1.15625 * (rn_previo - 11250.0)
            return 0.0
        if anio == 2018:  # regimen transitorio: media de 2017 y 2019
            pre = (3700.0 if rn_previo <= 11250 else
                   (3700.0 - 1.15625 * (rn_previo - 11250.0) if rn_previo <= 14450 else 0.0))
            post = (5565.0 if rn_previo <= 13115 else
                    (max(0.0, 5565.0 - 1.5 * (rn_previo - 13115.0)) if rn_previo <= 16825 else 0.0))
            return (pre / 2.0) + (post / 2.0)
        if 2019 <= anio <= 2022:
            if rn_previo <= 13115: return 5565.0
            if rn_previo <= 16825: return max(0.0, 5565.0 - 1.5 * (rn_previo - 13115.0))
            return 0.0
        if anio == 2023:
            if rn_previo <= 14047.50: return 6498.0
            if rn_previo <= 19747.50: return max(0.0, 6498.0 - 1.14 * (rn_previo - 14047.50))
            return 0.0
        if anio >= 2024:
            if rn_previo <= 14852: return 7302.0
            if rn_previo <= 17673.52: return 7302.0 - 1.75 * (rn_previo - 14852.0)
            if rn_previo <= 19747.50: return 2364.34 - 1.14 * (rn_previo - 17673.52)
            return 0.0
        return 0.0

    return reduccion


def _build_deduccion_smi(anio: int):
    """Deduccion por rentas bajas vinculada al SMI (introducida en 2025)."""

    def deduccion(bruto: float) -> float:
        if anio == 2026:
            if bruto <= 17094: return 590.89
            return max(0.0, 590.89 - 0.20 * (bruto - 17094.0))
        if anio == 2025:
            if bruto <= 16576: return 340.0
            if bruto <= 18276: return max(0.0, 340.0 - 0.20 * (bruto - 16576.0))
            return 0.0
        return 0.0

    return deduccion


def obtener_parametros(anio: int) -> dict:
    """Devuelve un dict con todos los parametros normativos del anio."""
    p = {
        'anio': anio,
        'base_max': _BASE_MAX[anio],
        'ss_tipos': _ss_tipos_base(),
        'mei': _mei(anio),
        'solidaridad': _solidaridad(anio),
        'irpf_minimo': 5151 if anio <= 2014 else 5550,
        'minimo_exento': _MINIMO_EXENTO_RETENCION[anio],
        'gastos_fijos': 0 if anio <= 2014 else 2000,
        'tramos_irpf': _tramos_irpf(anio),
        'art20_meta': _art20_meta(anio),
        'reduccion_trabajo': _build_reduccion_trabajo(anio),
        'deduccion_smi': _build_deduccion_smi(anio),
    }
    return p
