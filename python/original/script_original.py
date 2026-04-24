import pandas as pd
import numpy as np

# =============================================================================
# 1. MODULO MACROECONOMICO: INFLACION ACUMULADA (DICIEMBRE A DICIEMBRE)
# =============================================================================
IPC_ANUAL_DIC = {
    2013: 0.003, 2014: -0.010, 2015: 0.000, 2016: 0.016, 2017: 0.011,
    2018: 0.012, 2019: 0.008, 2020: -0.005, 2021: 0.065, 2022: 0.057,
    2023: 0.031, 2024: 0.028, 2025: 0.029, 2026: 0.030
}

def obtener_inflacion_acumulada(anio_base, anio_destino=2026):
    if anio_base == anio_destino: return 1.0
    multiplicador = 1.0
    for anio in range(anio_base + 1, anio_destino + 1):
        multiplicador *= (1 + IPC_ANUAL_DIC[anio])
    return multiplicador

INFLACION_A_2026 = {anio: obtener_inflacion_acumulada(anio, 2026) for anio in range(2012, 2027)}

# =============================================================================
# 2. NORMATIVA FISCAL Y LABORAL (IRPF Y SS)
# =============================================================================
def obtener_parametros(anio):
    p = {}

    # Bases y Tipos Generales SS
    p['base_max'] = {
        2012: 39150.0, 2013: 41108.4, 2014: 43164.0, 2015: 43272.0, 2016: 43704.0, 2017: 45014.4,
        2018: 45014.4, 2019: 48841.2, 2020: 48841.2, 2021: 48841.2, 2022: 49672.8, 2023: 53946.0,
        2024: 56646.0, 2025: 58914.0, 2026: 61214.4
    }[anio]

    p['ss_tipos'] = {
        'comunes': [0.236, 0.047], 'desempleo': [0.055, 0.0155],
        'fogasa': [0.002, 0.0], 'fp': [0.006, 0.001], 'atep': [0.015, 0.0]
    }

    # MEI y Solidaridad
    if anio == 2023: p['mei'] = [0.005, 0.001]
    elif anio == 2024: p['mei'] = [0.0058, 0.0012]
    elif anio == 2025: p['mei'] = [0.0067, 0.0013]
    elif anio >= 2026: p['mei'] = [0.0075, 0.0015]
    else: p['mei'] = [0.0, 0.0]

    if anio == 2025: p['solidaridad'] = [(1.10, 0.0092), (1.50, 0.0100), (float('inf'), 0.0117)]
    elif anio >= 2026: p['solidaridad'] = [(1.10, 0.0115), (1.50, 0.0125), (float('inf'), 0.0146)]
    else: p['solidaridad'] = []

    # Minimos y Gastos
    p['irpf_minimo'] = 5151 if anio <= 2014 else 5550
    p['minimo_exento'] = {
        2012: 11162, 2013: 11162, 2014: 11162, 2015: 12000, 2016: 12000, 2017: 12000,
        2018: 12643, 2019: 14000, 2020: 14000, 2021: 14000, 2022: 14000, 2023: 15000,
        2024: 15876, 2025: 15876, 2026: 15876
    }[anio]
    p['gastos_fijos'] = 0 if anio <= 2014 else 2000

    # Reduccion Art 20 (y Metadatos para control)
    def get_art20_params(a):
        if a <= 2014: return {"U_Inf": 9180, "R_Max": 4080, "U_Sup": 13260, "R_Min": 2652}
        elif 2015 <= a <= 2017: return {"U_Inf": 11250, "R_Max": 3700, "U_Sup": 14450, "R_Min": 0}
        elif a == 2018: return {"U_Inf": "Transitorio", "R_Max": "Transitorio", "U_Sup": "Transitorio", "R_Min": "Transitorio"}
        elif 2019 <= a <= 2022: return {"U_Inf": 13115, "R_Max": 5565, "U_Sup": 16825, "R_Min": 0}
        elif a == 2023: return {"U_Inf": 14047.5, "R_Max": 6498, "U_Sup": 19747.5, "R_Min": 0}
        else: return {"U_Inf": 14852, "R_Max": 7302, "U_Sup": 19747.5, "R_Min": 0}
    p['art20_meta'] = get_art20_params(anio)

    def reduccion_trabajo(rn_previo):
        if anio <= 2014:
            if rn_previo <= 9180: return 4080.0
            elif rn_previo <= 13260: return 4080.0 - 0.35 * (rn_previo - 9180.0)
            else: return 2652.0
        elif 2015 <= anio <= 2017:
            if rn_previo <= 11250: return 3700.0
            elif rn_previo <= 14450: return 3700.0 - 1.15625 * (rn_previo - 11250.0)
            else: return 0.0
        elif anio == 2018: # Regimen Transitorio
            pre = 3700.0 if rn_previo <= 11250 else (3700.0 - 1.15625 * (rn_previo - 11250.0) if rn_previo <= 14450 else 0.0)
            post = 5565.0 if rn_previo <= 13115 else (max(0.0, 5565.0 - 1.5 * (rn_previo - 13115.0)) if rn_previo <= 16825 else 0.0)
            return (pre / 2.0) + (post / 2.0)
        elif 2019 <= anio <= 2022:
            if rn_previo <= 13115: return 5565.0
            elif rn_previo <= 16825: return max(0.0, 5565.0 - 1.5 * (rn_previo - 13115.0))
            else: return 0.0
        elif anio == 2023:
            if rn_previo <= 14047.50: return 6498.0
            elif rn_previo <= 19747.50: return max(0.0, 6498.0 - 1.14 * (rn_previo - 14047.50))
            else: return 0.0
        elif anio >= 2024:
            if rn_previo <= 14852: return 7302.0
            elif rn_previo <= 17673.52: return 7302.0 - 1.75 * (rn_previo - 14852.0)
            elif rn_previo <= 19747.50: return 2364.34 - 1.14 * (rn_previo - 17673.52)
            else: return 0.0
        return 0.0
    p['reduccion_trabajo'] = reduccion_trabajo

    # Escalas IRPF
    if anio <= 2014: p['tramos_irpf'] = [(17707, 0.2475), (33007, 0.30), (53407, 0.40), (120000, 0.47), (175000, 0.49), (300000, 0.51), (float('inf'), 0.52)]
    elif anio == 2015: p['tramos_irpf'] = [(12450, 0.195), (20200, 0.245), (34000, 0.305), (60000, 0.38), (float('inf'), 0.46)]
    elif 2016 <= anio <= 2020: p['tramos_irpf'] = [(12450, 0.19), (20200, 0.24), (35200, 0.30), (60000, 0.37), (float('inf'), 0.45)]
    else: p['tramos_irpf'] = [(12450, 0.19), (20200, 0.24), (35200, 0.30), (60000, 0.37), (300000, 0.45), (float('inf'), 0.47)]

    # Deduccion SMI
    def deduccion_smi(bruto):
        if anio == 2026:
            if bruto <= 17094: return 590.89
            else: return max(0.0, 590.89 - 0.20 * (bruto - 17094.0))
        elif anio == 2025:
            if bruto <= 16576: return 340.0
            elif bruto <= 18276: return max(0, 340.0 - 0.20 * (bruto - 16576.0))
        return 0.0
    p['deduccion_smi'] = deduccion_smi

    return p

# (Resto del script original disponible en el commit inicial del repo,
# integro y sin modificaciones, para trazabilidad de la propuesta original.)
