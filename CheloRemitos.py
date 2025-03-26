from colorama import Fore, Style
from colorama import init, Fore, Style
init(autoreset=True)  # 🔥 Esto resetea automáticamente los colores después de cada print
import time
import os
import json
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.support.ui import Select

# Configuración para Chrome en modo depuración
debugging_port = 9223
options = webdriver.ChromeOptions()
options.debugger_address = f"localhost:{debugging_port}"

driver_path = r"C:\Users\lgv\Desktop\Chelo\chromedriver_win32\chromedriver.exe"
service = Service(driver_path)
driver = webdriver.Chrome(service=service, options=options)
wait = WebDriverWait(driver, 15)

# Leer el JSON
json_path = r"C:\Users\lgv\Desktop\Chelo\Remitos\datos\datos.json"
with open(json_path, "r", encoding="utf-8") as f:
    datos = json.load(f)

remito = datos.get("remito", "")
pedido = datos.get("pedido", "")
productos = datos.get("productos", [])

# Aquí es donde comenzamos con la interacción en la web
# Esperar y seleccionar "HOSPITAL ALVAREZ" en Origen
try:
    campo_origen = wait.until(expected_conditions.presence_of_element_located((By.NAME, "idorigen")))
    select_origen = Select(campo_origen)
    select_origen.select_by_visible_text("HOSPITAL ALVAREZ")
    print("Se ha seleccionado 'HOSPITAL ALVAREZ' en el campo de origen.")
except Exception as e:
    print(f"Error al seleccionar origen: {str(e)}")

# Esperar a que el dropdown de destino esté presente
try:
    campo_destino = wait.until(expected_conditions.presence_of_element_located((By.NAME, "iddestino")))

    # Crear objeto Select
    select_destino = Select(campo_destino)

    # Seleccionar la opción "BIOMEDICOS"
    select_destino.select_by_visible_text("BIOMEDICOS")
    print("Se ha seleccionado 'BIOMEDICOS' en el campo de destino.")
except Exception as e:
    print(f"Error al seleccionar destino: {str(e)}")

# Esperar y completar el campo "Nro. de Remito"
try:
    campo_remito = wait.until(expected_conditions.presence_of_element_located((By.NAME, "remito")))
    campo_remito.clear()  # Limpiar cualquier valor previo
    campo_remito.send_keys(remito)  # Ingresar el valor desde el JSON
    print(f"Se ha ingresado el Nro. de Remito: {remito}")
except Exception as e:
    print(f"Error al ingresar el Nro. de Remito: {str(e)}")

# Esperar y completar el campo "Nro. de Orden de Compra"
try:
    campo_orden_compra = wait.until(expected_conditions.presence_of_element_located((By.NAME, "nro_orden_compra")))
    campo_orden_compra.clear()  # Limpiar cualquier valor previo
    campo_orden_compra.send_keys("O.C. 15/8")  # Ingresar el valor fijo
    print('Se ha ingresado "O.C. 15/8" en el campo de Nro. de Orden de Compra.')
except Exception as e:
    print(f"Error al ingresar el Nro. de Orden de Compra: {str(e)}")

# Esperar y completar el campo "Nro. de Pedido"
try:
    campo_pedido = wait.until(expected_conditions.presence_of_element_located((By.NAME, "nro_pedido")))
    campo_pedido.clear()  # Limpiar cualquier valor previo
    campo_pedido.send_keys(pedido)  # Ingresar el valor desde el JSON
    print(f"Se ha ingresado el Nro. de Pedido: {pedido}")
except Exception as e:
    print(f"Error al ingresar el Nro. de Pedido: {str(e)}")

# Esperar y hacer clic en el botón "ENVIAR"
try:
    boton_enviar = wait.until(expected_conditions.element_to_be_clickable((By.XPATH, "//input[@type='button' and @value='Enviar']")))
    boton_enviar.click()
    print("Se ha hecho clic en el botón ENVIAR.")
except Exception as e:
    print(f"Error al hacer clic en el botón ENVIAR: {str(e)}")
    
# ------------------------------

# Leer equivalencias NNE
equivalencias_path = r"C:\Users\lgv\Desktop\Chelo\Remitos\datos\nne_equivalencias.json"

with open(equivalencias_path, "r", encoding="utf-8") as f:
    equivalencias = json.load(f)

# Convertimos las equivalencias en un diccionario para acceso rápido
diccionario_nne = {}

for item in equivalencias:
    sigheos_nne = item.get("sigheos_nne")
    proveedor_nne_list = item.get("proveedor_nne", [])
    for prov_nne in proveedor_nne_list:
        diccionario_nne[prov_nne.strip()] = sigheos_nne.strip()

print("📌 Diccionario de equivalencias cargado correctamente.")

# ----------- BUCLE ------------------
nne_errores = []

def procesar_producto(producto, es_primer_producto):
    
    # 🔹 PRIMER PASO: HACER CLIC EN "INGRESAR INSUMO" (solo en el primer producto)
    if es_primer_producto:
        try:
            boton_ingresar_insumo = wait.until(expected_conditions.element_to_be_clickable((By.LINK_TEXT, "Ingresar Insumo")))
            boton_ingresar_insumo.click()
            print("🔵 Se ha hecho clic en 'Ingresar Insumo'.")
        except Exception as e:
            print(f"❌ Error al hacer clic en 'Ingresar Insumo': {str(e)}")
            return False

    while True:
        # 🔍 Verificamos si el NNE tiene equivalencia
        nne_original = producto['nne'].strip()
        nne_equivalente = diccionario_nne.get(nne_original, nne_original)  # Si no tiene equivalencia, queda igual

        try:
            # 🔹 LIMPIAMOS CAMPO Y ENVIAMOS EL NNE CON ESPACIO ADELANTE
            campo_busqueda = wait.until(expected_conditions.presence_of_element_located((By.NAME, "__buscar")))
            campo_busqueda.clear()
            time.sleep(0.5)
            campo_busqueda.send_keys(f" {nne_equivalente}")
            print(f'✅ Se ha ingresado "{nne_equivalente}" en el campo de búsqueda.')

            # 🔹 HACEMOS CLIC EN BUSCAR
            boton_buscar = wait.until(expected_conditions.element_to_be_clickable((By.XPATH, "//input[@type='button' and @value='Buscar por sistema']")))
            boton_buscar.click()
            print("✅ Se ha hecho clic en 'Buscar por sistema'.")

        except Exception as e:
            print(f"❌ Error al ingresar el NNE en el campo de búsqueda: {str(e)}")
            return False

        # 🔹 CAMBIAMOS A LA VENTANA EMERGENTE Y BUSCAMOS EL NNE
        try:
            main_window = driver.current_window_handle
            wait.until(lambda d: len(d.window_handles) > 1)
            new_window = [window for window in driver.window_handles if window != main_window][0]
            driver.switch_to.window(new_window)
            print("🔀 Se ha cambiado a la ventana emergente.")

            # 🔍 BUSCAMOS EL NNE EXACTO (sin espacio)
            xpath_nne = f"//a[text()='{nne_equivalente}']"
            elemento_nne = WebDriverWait(driver, 3).until(
                expected_conditions.element_to_be_clickable((By.XPATH, xpath_nne))
            )
            print(f"✅ Se ha encontrado y seleccionado el insumo con NNE: {nne_equivalente}")
            elemento_nne.click()

            # Volvemos a la ventana principal
            driver.switch_to.window(main_window)
            print("🔙 Se ha regresado a la ventana principal.")

        except Exception as e:
            print(f"❌ Error al encontrar/clickeando NNE '{nne_equivalente}' en ventana emergente: {str(e)}")
            
            # Cerramos ventana emergente si quedó abierta
            if len(driver.window_handles) > 1:
                driver.close()
            driver.switch_to.window(main_window)
            return False

        # 🟢 COMPLETAMOS CAMPOS DE DETALLE DEL LOTE
        try:
            campo_lote = wait.until(expected_conditions.presence_of_element_located((By.NAME, "nrolote")))
            campo_lote.clear()
            campo_lote.send_keys(producto["lote"])
            print(f'🟢 Lote: {producto["lote"]}')
        except Exception as e:
            print(f"❌ Error al ingresar el número de lote: {str(e)}")

        try:
            campo_cantidad = wait.until(expected_conditions.presence_of_element_located((By.NAME, "cantidad")))
            campo_cantidad.clear()
            campo_cantidad.send_keys(producto["cantidad"])
            print(f'🟢 Cantidad: {producto["cantidad"]}')
        except Exception as e:
            print(f"❌ Error al ingresar la cantidad: {str(e)}")

        try:
            campo_precio = wait.until(expected_conditions.presence_of_element_located((By.NAME, "precio")))
            campo_precio.clear()
            campo_precio.send_keys(producto["precio"])
            print(f'🟢 Precio unitario: {producto["precio"]}')
        except Exception as e:
            print(f"❌ Error al ingresar el precio unitario: {str(e)}")

        try:
            campo_vencimiento = wait.until(expected_conditions.presence_of_element_located((By.NAME, "vencimiento")))
            campo_vencimiento.clear()
            campo_vencimiento.send_keys(producto["vencimiento"])
            print(f'🟢 Vencimiento: {producto["vencimiento"]}')
        except Exception as e:
            print(f"❌ Error al ingresar la fecha de vencimiento: {str(e)}")

        try:
            campo_marca = wait.until(expected_conditions.presence_of_element_located((By.NAME, "nomcom")))
            campo_marca.clear()
            campo_marca.send_keys(producto.get("marca", ""))
            print(f'🟢 Marca: {producto.get("marca", "")}')
        except Exception as e:
            print(f"❌ Error al ingresar la marca: {str(e)}")

        try:
            boton_enviar = wait.until(expected_conditions.element_to_be_clickable((By.XPATH, '//input[@type="button" and @value="Enviar"]')))
            boton_enviar.click()
            print("✅ Se ha presionado el botón 'ENVIAR'.")
        except Exception as e:
            print(f"❌ Error al presionar el botón ENVIAR: {str(e)}")

        # 🔄 SOLO hacemos clic en "Ingresar Insumo" si NO es el último producto
        if indice_producto_actual < total_productos - 1:
            try:
                boton_ingresar_insumo = wait.until(expected_conditions.element_to_be_clickable((By.LINK_TEXT, "Ingresar Insumo")))
                boton_ingresar_insumo.click()
                print(f"🔄 Se ha hecho clic en 'Ingresar Insumo' para procesar el siguiente producto ({indice_producto_actual + 2} de {total_productos}).")
            except Exception as e:
                print(f"⚠️ Error al hacer clic en 'Ingresar Insumo': {str(e)}")
        else:
            print("✅ Último producto ingresado. No es necesario hacer clic en 'Ingresar Insumo'.")

        break  # Producto procesado correctamente, salimos del while

    return True



# 🔹 BUCLE PRINCIPAL PARA ITERAR SOBRE LOS PRODUCTOS
total_productos = len(productos)
indice_producto_actual = 0

if not productos:
    print("No hay productos para procesar. Finalizando...")
    exit()

while indice_producto_actual < total_productos:
    try:
        # El primer producto requiere hacer clic en "Ingresar Insumo", los demás no
        es_primer_producto = indice_producto_actual == 0

        resultado = procesar_producto(productos[indice_producto_actual], es_primer_producto)
        
        if resultado:  # Solo incrementamos si el producto se procesó correctamente
            indice_producto_actual += 1
        else:
            print(f"Saltando producto {indice_producto_actual + 1} y pasando al siguiente.")
            indice_producto_actual += 1  # 🔹 Se asegura de avanzar al siguiente producto

    except Exception as e:
        print(f"Error en el flujo del bucle: {str(e)}")
        break

if nne_errores:
    print(Fore.RED + "\n🔴 LISTADO DE NNE NO ENCONTRADOS:" + Style.RESET_ALL)
    for nne in nne_errores:
        print(Fore.RED + f"   - {nne}" + Style.RESET_ALL)
else:
    print(Fore.GREEN + "\n✅ No hubo errores de NNE. Todo procesado correctamente." + Style.RESET_ALL)


input("Presiona Enter para salir...")
