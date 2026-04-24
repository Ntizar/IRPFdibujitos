"""Reproduce el Excel original de auditoria a partir del paquete refactorizado.

Salida: Auditoria_Integral_Nominas_e_Inflacion_2012_2026.xlsx
"""

import numpy as np
import pandas as pd

from irpfdibujitos import (
    obtener_parametros,
    INFLACION_A_2026,
    calcular_nomina_detallada,
    calcular_nomina_agregada,
)


def generar_hojas_control() -> tuple:
    general, tramos = [], []
    for anio in range(2012, 2027):
        p = obtener_parametros(anio)
        tipo_emp = sum(x[0] for x in p['ss_tipos'].values())
        tipo_tra = sum(x[1] for x in p['ss_tipos'].values())
        general.append({
            "Anio": anio,
            "Base Max. Anual": p['base_max'],
            "SS Empleador %": round(tipo_emp * 100, 2),
            "SS Empleado %": round(tipo_tra * 100, 2),
            "MEI Empleador %": round(p['mei'][0] * 100, 3),
            "MEI Empleado %": round(p['mei'][1] * 100, 3),
            "Gastos Fijos Art.19": p['gastos_fijos'],
            "Min. Contribuyente": p['irpf_minimo'],
            "Min. Exento Retencion": p['minimo_exento'],
            "Art.20 Umbral Inf": p['art20_meta']['U_Inf'],
            "Art.20 Red. Maxima": p['art20_meta']['R_Max'],
            "Art.20 Umbral Sup": p['art20_meta']['U_Sup'],
            "Art.20 Red. Minima": p['art20_meta']['R_Min'],
        })
        for i, (lim, tip) in enumerate(p['tramos_irpf']):
            tramos.append({
                "Anio": anio,
                "N Tramo": i + 1,
                "Hasta Base": lim if lim != float('inf') else "En adelante",
                "Tipo %": round(tip * 100, 2),
            })
    return pd.DataFrame(general), pd.DataFrame(tramos)


def procesar_anio(anio: int) -> pd.DataFrame:
    p = obtener_parametros(anio)
    salarios = np.arange(0, 100001, 1)
    return pd.DataFrame([calcular_nomina_detallada(float(b), p) for b in salarios])


def generar_comparativa_inflacion() -> pd.DataFrame:
    salarios_2026 = np.arange(15000, 100001, 1000)
    p_2026 = obtener_parametros(2026)
    ref_2026 = {b: calcular_nomina_agregada(float(b), p_2026) for b in salarios_2026}

    filas = []
    for anio in range(2012, 2027):
        p_anio = obtener_parametros(anio)
        inf_acum = INFLACION_A_2026[anio]
        for bruto_26 in salarios_2026:
            bruto_nom = bruto_26 / inf_acum
            n = calcular_nomina_agregada(bruto_nom, p_anio)
            neto_aj = n['neto'] * inf_acum
            neto_2026_real = ref_2026[bruto_26]['neto']
            dif = neto_aj - neto_2026_real
            filas.append({
                "Anio a Comparar": anio,
                "Salario Equivalente (2026)": int(bruto_26),
                "Multiplicador IPC Acum.": round(inf_acum, 4),
                "IPC Acumulado (%)": f"{round((inf_acum - 1) * 100, 2)}%",
                "Salario Bruto Nominal": round(bruto_nom, 2),
                "Coste Lab. (Euros 2026)": round(n['coste_laboral'] * inf_acum, 2),
                "SS Emp. (Euros 2026)": round(n['ss_empresa'] * inf_acum, 2),
                "SS Tra. (Euros 2026)": round(n['ss_trabajador'] * inf_acum, 2),
                "IRPF (Euros 2026)": round(n['irpf'] * inf_acum, 2),
                "Neto Real en su Anio": round(neto_aj, 2),
                "Neto Real en 2026": round(neto_2026_real, 2),
                "Variacion Mensual (12 pagas)": round(dif / 12, 2),
                "Perdida/Ganancia Anual Poder Adq.": round(dif, 2),
            })
    return pd.DataFrame(filas)


def main():
    fichero = 'Auditoria_Integral_Nominas_e_Inflacion_2012_2026.xlsx'
    print("Generando Excel completo. Puede tardar un par de minutos...")
    with pd.ExcelWriter(fichero, engine='openpyxl') as writer:
        print("- Hojas de control normativo")
        df_gen, df_tra = generar_hojas_control()
        df_gen.to_excel(writer, sheet_name='CONTROL_GENERAL', index=False)
        df_tra.to_excel(writer, sheet_name='CONTROL_TRAMOS_IRPF', index=False)

        print("- Comparativa IPC")
        generar_comparativa_inflacion().to_excel(writer, sheet_name='COMPARATIVA_INFLACION', index=False)

        for anio in range(2012, 2027):
            print(f"- Detallado anio {anio}")
            procesar_anio(anio).to_excel(writer, sheet_name=f'DAT_{anio}', index=False)

    print(f"Listo: {fichero}")


if __name__ == "__main__":
    main()
