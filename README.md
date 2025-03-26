# 🤖 Bot de Carga de Insumos para SIGHEOS

Este proyecto automatiza el ingreso de insumos médicos al sistema hospitalario **SIGHEOS** a partir de pedidos físicos. Usa un enfoque multietapa que integra OCR, APIs propias, procesamiento en navegador y un bot en Python con Selenium.

> 📌 Este repositorio incluye el código fuente completo y abierto. Podés revisarlo, comentarlo o adaptarlo a tu entorno. ¡Todo suma!

---

## 🧠 Flujo del sistema

1. 📷 Se escanea el pedido en papel con una app OCR (TextFairy)
2. 📲 Una app móvil (Kotlin – Puente) envía el texto crudo a la PC vía API
3. 🌐 Una **API web local** (HTML + CSS + JS) modula los datos:
   - Limpieza de caracteres
   - Autoordenamiento de marcas
   - Equivalencias de insumos
4. 💾 Se genera `datos.json` listo para inyección
5. 🤖 El bot en Python (`CheloRemitos.py`) ingresa los datos automáticamente en SIGHEOS mediante Selenium

---

## 🧩 Componentes del proyecto

- `CheloRemitos.py` → Bot automatizador en Python con Selenium
- `remitos.html` + `index.js` → Interfaz local para modular pedidos
- `ConvertirExcel-Json.py` → Conversor alternativo desde Excel
- `datos.json` → Archivo de datos finales a despachar
- `marcas.json` → Autocompletado y registro de nuevas marcas
- `nne_equivalencias.json` → Equivalencias entre insumos proveedor/SIGHEOS

---

## 📁 Estructura del proyecto

/BotAgregarInsumos
├── CheloRemitos.py
├── ConvertirExcel-Json.py
├── index.js
├── public/
│   └── remitos.html
├── datos/
│   ├── datos.json
│   ├── marcas.json
│   ├── nne_equivalencias.json
│   └── nne_equivalencias.xlsx
├── app-debug.apk         (no incluido en el repo)
├── server.bat            (script para correr en localhost)
└── README.md

---

## 🧰 Tecnologías utilizadas

- Python + Selenium
- HTML, CSS y JavaScript
- JSON para almacenamiento estructurado
- APIs locales simuladas
- OCR externo desde celular

---

## 🔐 Licencia

Este proyecto se distribuye bajo la [Licencia MIT](LICENSE), lo que significa que podés:

- ✅ Usarlo libremente
- ✅ Modificarlo y adaptarlo
- ✅ Compartirlo
- ❌ Pero no responsabilizar al autor por posibles daños o mal uso

---

📧 mazzara.marcelo@gmail.com  
🌍 Ciudad de Buenos Aires, Argentina
