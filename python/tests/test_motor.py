"""Tests basicos. Sirven de baseline; los fiscalistas anadiran casos auditados."""

import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.abspath(os.path.join(HERE, "..")))

import pytest
from irpfdibujitos import (
    obtener_parametros,
    calcular_nomina_agregada,
    INFLACION_A_2026,
    obtener_inflacion_acumulada,
)


@pytest.mark.parametrize("anio", list(range(2012, 2027)))
def test_parametros_existen(anio):
    p = obtener_parametros(anio)
    assert p['base_max'] > 0
    assert p['tramos_irpf']
    assert p['minimo_exento'] > 0


@pytest.mark.parametrize("anio", list(range(2012, 2027)))
def test_neto_no_supera_bruto(anio):
    p = obtener_parametros(anio)
    for bruto in [10_000, 20_000, 35_000, 60_000, 90_000]:
        n = calcular_nomina_agregada(bruto, p)
        assert n['neto'] <= bruto, f"{anio} bruto {bruto}"
        assert n['neto'] >= 0


@pytest.mark.parametrize("anio", list(range(2012, 2027)))
def test_monotonia_neto(anio):
    """A mas bruto, mas neto (o igual). Si esto falla hay un bug serio."""
    p = obtener_parametros(anio)
    netos = [calcular_nomina_agregada(b, p)['neto'] for b in range(10_000, 100_001, 5000)]
    for a, b in zip(netos, netos[1:]):
        assert b >= a - 0.01, f"neto baja al subir bruto en {anio}"


def test_ipc_2026_es_uno():
    assert INFLACION_A_2026[2026] == 1.0


def test_ipc_acumulado_2012_creciente():
    inf = obtener_inflacion_acumulada(2012, 2026)
    assert inf > 1.20  # acumulado real >20% sin duda
