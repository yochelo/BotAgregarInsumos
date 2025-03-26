import pandas as pd
import json
import sys
import os

# 📂 Ruta dinámica
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
RUTA_DATOS = os.path.join(BASE_DIR, "datos")
RUTA_EXCEL = os.path.join(RUTA_DATOS, "nne_equivalencias.xlsx")
RUTA_JSON = os.path.join(RUTA_DATOS, "nne_equivalencias.json")
RUTA_LOG = os.path.join(RUTA_DATOS, "log_conversion.txt")  # 💡 Guardamos el log en /datos

# 📥 Leer Excel
try:
    df = pd.read_excel(RUTA_EXCEL, header=None, dtype=str)
    print("✅ Excel leído correctamente.")
except Exception as e:
    print(f"❌ Error al leer el Excel: {e}")
    sys.exit()

# 📌 Construir diccionario
lista_equivalencias = []

for index, row in df.iterrows():
    sigheos_nne = str(row[3]).strip() if not pd.isna(row[3]) else None
    proveedor_nne = []

    for col in [5, 8, 11]:
        valor = str(int(row[col])) if not pd.isna(row[col]) else None

        if valor:
            proveedor_nne.append(valor)

    if sigheos_nne and proveedor_nne:
        lista_equivalencias.append({
            "sigheos_nne": sigheos_nne,
            "proveedor_nne": proveedor_nne
        })


# 💾 Guardar JSON
try:
    with open(RUTA_JSON, "w", encoding="utf-8") as f:
        json.dump(lista_equivalencias, f, ensure_ascii=False, indent=4)

    print(f"✅ JSON generado correctamente en:\n{RUTA_JSON}")

except Exception as e:
    print(f"❌ Error guardando JSON: {e}")

print("\n🟢 Proceso terminado.")
input("Presioná Enter para salir...")
