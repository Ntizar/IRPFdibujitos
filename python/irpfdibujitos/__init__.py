"""IRPFdibujitos: motor abierto de calculo IRPF y salario neto 2012-2026."""

from .parametros import obtener_parametros, IPC_ANUAL_DIC, INFLACION_A_2026, obtener_inflacion_acumulada
from .motor import calcular_nomina_detallada, calcular_nomina_agregada, calcular_cuotas_por_tramo

__version__ = "0.1.0"
__all__ = [
    "obtener_parametros",
    "IPC_ANUAL_DIC",
    "INFLACION_A_2026",
    "obtener_inflacion_acumulada",
    "calcular_nomina_detallada",
    "calcular_nomina_agregada",
    "calcular_cuotas_por_tramo",
]
