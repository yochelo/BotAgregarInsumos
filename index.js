const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const rutaArchivo = "C:/Users/20214715466/Desktop/biomedicos/Remitos/datos/datos.json";
const { Server } = require('socket.io');
const fs = require("fs");
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.use(express.text());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));  // Servir archivos estáticos

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "remitos.html"));
});
// RUTA PARA WEBSOCKETS
io.on("connection", (socket) => {
    console.log("🔌 Cliente conectado a WebSocket");

    socket.on("disconnect", () => {
        console.log("❌ Cliente desconectado");
    });
});

// guardar-dataset

app.post('/guardar-dataset', (req, res) => {
    const rutaArchivo = path.join(__dirname, 'datos.txt');
    const nuevoContenido = req.body.datos;

    fs.writeFile(rutaArchivo, nuevoContenido, 'utf8', (err) => {
        if (err) {
            console.error("❌ Error al guardar el archivo:", err);
            return res.status(500).send("Error al guardar el archivo.");
        }
        res.send("✅ Dataset guardado correctamente.");
    });
});


// Recibe desde txt


app.get('/cargar-desde-txt', (req, res) => {
    const rutaArchivo = path.join(__dirname, 'prueba.txt'); // Archivo en la misma carpeta del backend

    fs.readFile(rutaArchivo, 'utf8', (err, data) => {
        if (err) {
            console.error("❌ Error al leer el archivo:", err);
            return res.status(500).send("Error al leer el archivo.");
        }

        if (!data.trim()) {
            console.log("⚠️ El archivo está vacío.");
            return res.status(400).send("Error: El archivo está vacío.");
        }

        console.log("📂 Datos cargados desde archivo:", data);
        datosRecibidos = data;  // Guardamos los datos en la variable global
        io.emit("nuevosDatos", data); // 🔥 Enviar los datos crudos al frontend

        res.send("✅ Datos cargados correctamente.");
    });
});


// Recibe desde puente

app.post('/recibir', (req, res) => {
    const datos = req.body;

    if (!datos || datos.trim() === "") {
        console.log("❌ No se recibieron datos en /recibir");
        return res.status(400).send("Error: No se recibió ningún dato válido");
    }

    console.log("📥 Datos recibidos de Puente:", datos);
    datosRecibidos = datos;  // Guardamos los datos en la variable global
    io.emit("nuevosDatos", datos); // 🔥 Enviar los datos crudos al frontend

    res.send("✅ Datos recibidos correctamente");
});

// Función Ordenar
app.post("/ordenar", (req, res) => {
    const { datos } = req.body;

    if (!datos) {
        return res.status(400).send("❌ No se recibieron datos para ordenar.");
    }

    let resultado = Ordenar(datos); // ✅ Llamamos a Ordenar() con el texto actualizado

    console.log("📌 Resultado de Ordenar:", resultado);

    io.emit("datosOrdenados", resultado); // 🔥 Enviar los datos ordenados al frontend (esto faltaba)
    
    res.json(resultado); // ✅ Además, devolver el resultado al frontend por si se necesita
});



function Ordenar(texto) {
    let resultado = {};

    resultado.numeroRemito = NumeroRemito(texto);
    resultado.numeroPedido = NumeroPedido(texto);
    resultado.cantidades = ExtraerCantidades(texto);
    resultado.marca = ExtraerMarca(texto);
    resultado.lotes = ExtraerLotes(texto);  // Próximo módulo 📦
    resultado.vencimientos = ExtraerVencimientos(texto);  // Próximo módulo 🗓️*/
    resultado.nne = ExtraerNNE(texto);  // Próximo módulo 🔍
    //resultado.precios = ExtraerPrecios(texto);  // Se definirán manualmente más tarde//

    return resultado;
}

// Modulo Extraer el numero de remito
function NumeroRemito(texto) {
    const regex = /\b\d{4}[-\s]\d{8}\b/;  // Permite guión o espacio en medio
    const match = texto.match(regex);
    console.log("📌 Número de remito detectado:", match ? match[0] : "No encontrado");
    return match ? match[0] : null;
}

function NumeroPedido(texto) {
    console.log("📌 Buscando número de pedido en el texto...");

    // Expresión regular para encontrar el número antes de "URGENCIA" o "PROGRAMADO"
    const regex = /(\d+)\s+(?=URGENCIA|PROGRAMADO)/gi;
    
    let match = null;
    let matches = [...texto.matchAll(regex)]; // Captura todas las coincidencias

    if (matches.length > 0) {
        match = matches[matches.length - 1]; // Toma la última coincidencia encontrada
    }

    console.log("📌 Número de pedido detectado:", match ? match[1] : "No encontrado");
    return match ? match[1] : null;  // Devuelve solo el número antes de "URGENCIA" o "PROGRAMADO"
}



//funcion extraer cantidades

function ExtraerNNE(texto) {
    console.log("📌 Iniciando extracción de NNE...");
    
    // 1️⃣ Buscar todas las fechas en el formato correcto
    const regexFecha = /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}\b/g;
    let fechas = [...texto.matchAll(regexFecha)].map(m => m[0]);

    if (fechas.length === 0) {
        console.error("❌ No se detectaron fechas en el texto.");
        return [];
    }

    // 2️⃣ Buscar la línea con "transporte" (límite superior)
    const regexTransporte = /\b[tT][rR][aA]?[nN][sS][pP]?[oO0][rR][tT][eE]\b/;
    let lineas = texto.split("\n");
    let lineaTransporteIndex = lineas.findIndex(linea => regexTransporte.test(linea) || linea.includes("RICHARD"));
    console.log("🚚 Línea de transporte detectada en el índice:", lineaTransporteIndex);

    if (lineaTransporteIndex === -1) {
        console.error("❌ No se encontró la línea de 'transporte'.");
        return [];
    }

    // 3️⃣ Buscar la última fecha antes de "transporte" yendo hacia atrás
    let indiceFecha = -1;
    for (let i = lineaTransporteIndex - 1; i >= 0; i--) {  // Vamos hacia atrás
        let matchFecha = lineas[i].match(regexFecha);
        if (matchFecha) {
            indiceFecha = i;
            console.log("📅 Última fecha encontrada antes de transporte:", matchFecha[0], "en la línea", i);
            break;  // Nos detenemos en la PRIMERA fecha encontrada yendo para atrás
        }
    }

    if (indiceFecha === -1) {
        console.error("❌ No se encontró una fecha antes de transporte.");
        return [];
    }

    let nneDatos = [];

    // 4️⃣ Extraer solo los valores entre la fecha detectada y "transporte"
    for (let i = indiceFecha + 1; i < lineaTransporteIndex; i++) {
        console.log("🔹 Analizando línea:", lineas[i]);

        let numeros = lineas[i].match(/\b\d+\b/g);
        if (numeros) {
            nneDatos.push(...numeros);
            console.log("✅ Números encontrados en esta línea:", numeros);
        }
    }

    console.log("📌 NNE Extraídos:", nneDatos);
    return nneDatos.length > 0 ? nneDatos : [];
}

function ExtraerCantidades(texto) {
    // Expresión regular mejorada para capturar "9 00" y "9,00"
    const regex = /\b\d{1,}\s00\b|\b\d{1,},00\b/g;

    let cantidades = texto.match(regex);  // Busca coincidencias

    if (!cantidades) return [];  // Si no encuentra nada, devuelve un array vacío

    return cantidades.map(cantidad => {
        if (cantidad.includes(",")) {
            return parseInt(cantidad.replace(",", "."));  // Convierte "9,00" en 9
        } 
        if (cantidad.includes(" 00")) {
            return parseInt(cantidad.split(" ")[0]);  // Convierte "9 00" en 9
        }
        return parseInt(cantidad);  // Si viene como "900", lo deja igual
    });
}

const MARCAS_FILE = path.join(__dirname, 'datos', 'marcas.json');

let marcasSet = new Set();
let marcasIndexadas = {};

function cargarMarcasDesdeArchivo() {
    try {
        const data = JSON.parse(fs.readFileSync('datos/marcas.json', 'utf8'));
        marcasSet = new Set(data.marcas);
        marcasIndexadas = data.relaciones || {};
        console.log("✅ Marcas cargadas desde archivo.");
    } catch (error) {
        console.error("⚠️ Error cargando marcas.json, iniciando vacío:", error);
        marcasSet = new Set();
        marcasIndexadas = {};
    }
}

// Cargar al iniciar
cargarMarcasDesdeArchivo();

function limpiarTexto(texto) {
    return texto
        .toLowerCase()
        .replace(/\s+/g, " ") // 🔥 Eliminamos espacios dobles
        .replace(/ /g, "-")   // 🔥 Reemplazamos espacios por "-"
        .trim();
}


function guardarMarcas() {
    console.log("📌 Guardando marcas en marcas.json...");

    let marcasParaGuardar = Array.from(marcasSet).map(marca => marca.replace(/-/g, " ")); // 🔥 Eliminamos "-"

    fs.writeFile("datos/marcas.json", JSON.stringify({ marcas: marcasParaGuardar }, null, 2), "utf8", (err) => {
        if (err) {
            console.error("❌ Error guardando marcas:", err);
        } else {
            console.log("✅ Marcas guardadas correctamente en marcas.json.");
        }
    });
}

app.post("/procesar-marca", (req, res) => {
    const { marca } = req.body;
    if (!marca) return res.status(400).json({ error: "No se recibió ninguna marca." });

    console.log("📌 Recibida nueva marca desde el frontend:", marca);
    let marcaProcesada = procesarMarca(marca);

    res.json({ marca: marcaProcesada });
});



function procesarMarca(marca) {
    if (!marca) return null;

    // Normalizar la marca (eliminar espacios extras y convertir a minúscula con "-")
    const marcaNormalizada = limpiarTexto(marca);

    console.log("📌 Intentando procesar marca:", marcaNormalizada);

    // Si la marca ya existe en el set, no la agregamos
    if (marcasSet.has(marcaNormalizada)) {
        console.log("✅ La marca ya existe en el set, no se agrega.");
        return marcaNormalizada;
    } else {
        console.log("🆕 Nueva marca detectada, agregándola al set:", marcaNormalizada);
        marcasSet.add(marcaNormalizada); // Agregar al set
        guardarMarcas(); // Guardar en marcas.json
        return marcaNormalizada;
    }
}


function ExtraerMarca(texto) {
    console.log("📌 Iniciando extracción de Marca...");

    let textoLimpio = `-${limpiarTexto(texto)}-`; // 🔥 Mantenemos los "-" para evitar solapamientos
    let marcasEncontradas = [];

    // 🔥 Ordenamos las marcas de mayor a menor longitud para priorizar "dc premium" sobre "dc"
    let marcasArray = Array.from(marcasSet)
        .map(m => `-${limpiarTexto(m)}-`)
        .sort((a, b) => b.length - a.length); 

    console.log("🔍 Texto limpio:", textoLimpio);
    console.log("🔍 Marcas normalizadas ordenadas:", marcasArray);

    let index = 0;
    while (index < textoLimpio.length) {
        let encontrada = false;
        let mejorMatch = null;

        for (let marca of marcasArray) {
            let pos = textoLimpio.indexOf(marca, index);

            if (pos !== -1 && pos === index) { // 🔥 Si la marca aparece en la posición exacta
                if (!mejorMatch || marca.length > mejorMatch.length) {
                    mejorMatch = marca; // 🔥 Guardamos la marca más larga encontrada en esta posición
                }
            }
        }

        if (mejorMatch) {
            marcasEncontradas.push(mejorMatch.replace(/-/g, " ")); // 🔥 Restauramos espacios
            index += mejorMatch.length - 1; // 🔥 Avanzamos el índice el tamaño de la mejor coincidencia
            encontrada = true;
        }

        if (!encontrada) {
            index++; // 🔥 Si no encontramos marca, avanzamos de a 1
        }
    }

    // 🔥 Si no encontró ninguna marca en el set, intentamos agregarla como nueva
    if (marcasEncontradas.length === 0 && texto.trim().length > 0) {
    console.log("⚠️ No se encontró la marca, intentando procesarla:", texto.trim());
    let nuevaMarca = procesarMarca(texto.trim());
    if (nuevaMarca) {
        marcasEncontradas.push(nuevaMarca);
    }
}


    console.log("📌 Marcas extraídas en orden:", marcasEncontradas);
    return marcasEncontradas.length > 0 ? marcasEncontradas : ["-"];
}


function NormalizarDatos(cantidades, lotes, vencimientos, nne, precios) {
    let maxLength = nne.length; // 🔥 Ahora NNE define la cantidad de filas
    console.log("📌 Ajustando datos a", maxLength, "filas");

    function rellenar(array) {
        while (array.length < maxLength) {
            array.push("???");  // Placeholder para evitar desfases
        }
        return array.slice(0, maxLength); // 🔥 Si hay extras, recortamos
    }

    return {
        cantidades: rellenar(cantidades),
	    marca: rellenar(marca),
        lotes: rellenar(lotes),
        vencimientos: rellenar(vencimientos),
        nne: rellenar(nne), // 🔥 Ahora también aseguramos que NNE tenga la cantidad correcta
        precios: rellenar(precios),
    };
}

function ExtraerVencimientos(texto) {
    console.log("📌 Ejecutando ExtraerVencimientos...");

    const regexFecha = /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}\b/g;
    let fechas = texto.match(regexFecha);
    
    if (!fechas) return [];

    // 🔄 Reformateamos todas las fechas al formato dd/mm/aaaa
    let fechasCorregidas = fechas.map(fecha => {
        let [dia, mes, anio] = fecha.split("/");

        dia = dia.padStart(2, "0"); // Si el día es un solo dígito, agrega un "0"
        mes = mes.padStart(2, "0"); // Si el mes es un solo dígito, agrega un "0"

        return `${dia}/${mes}/${anio}`;
    });

    console.log("📅 Fechas corregidas:", fechasCorregidas);
    
    return fechasCorregidas.slice(1); // Ignorar la primera fecha del dataset
}



function ExtraerLotes(texto) {
    console.log("📌 Ejecutando ExtraerLotes...");

    const regexFecha = /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}\b/g;
    let fechasMatch = [...texto.matchAll(regexFecha)]; // Extraemos todas las fechas con su posición
    let fechas = fechasMatch.map(m => m[0]); // Guardamos solo los valores de fecha
    let posiciones = fechasMatch.map(m => m.index); // Guardamos las posiciones en el texto

    console.log("📅 Fechas detectadas:", fechas);
    console.log("📍 Posiciones de fechas:", posiciones);
    
    if (fechas.length < 2) return []; // Si hay menos de 2 fechas, no podemos extraer lotes

    let lotes = [];
    let lineas = texto.split("\n"); // Dividimos el texto en líneas (párrafos)

    // 🔍 Encontramos la línea donde aparece la segunda fecha (ignoramos la primera)
    let segundaFechaLinea = lineas.find(linea => linea.includes(fechas[1]));

    if (!segundaFechaLinea) return []; // Si no encontramos la segunda fecha, salimos

    // 📌 Extraer el primer lote (todo lo que está antes de la segunda fecha en su mismo párrafo)
    let primerLote = segundaFechaLinea.split(fechas[1])[0].trim();
    lotes.push(primerLote || "-"); // Si el lote está vacío, poner "-"

    // 📌 Extraer los lotes entre cada par de fechas consecutivas
    for (let i = 1; i < fechas.length - 1; i++) {
        let inicio = posiciones[i] + fechas[i].length; // Posición después de la fecha actual
        let fin = posiciones[i + 1]; // Posición de la siguiente fecha

        let lote = texto.substring(inicio, fin).trim(); // Extraer contenido entre fechas

        if (!lote || /^\s*$/.test(lote)) { 
            lote = "-"; // Si el lote es vacío o solo espacios, poner "-"
        }

        console.log(`📦 Lote detectado entre ${fechas[i]} y ${fechas[i + 1]}: "${lote}"`);
        lotes.push(lote);
    }

    return lotes;
}


app.post("/guardar-json", (req, res) => {
    const jsonData = req.body;

    console.log("📌 JSON recibido en el backend:", jsonData);

    // Verificar si `productos` tiene datos
    if (!jsonData.productos || jsonData.productos.length === 0) {
        console.error("❌ Error: No hay productos en el JSON.");
        return res.status(400).json({ error: "No se recibieron productos válidos." });
    }

    fs.writeFile(rutaArchivo, JSON.stringify(jsonData, null, 2), (err) => {
        if (err) {
            console.error("❌ Error guardando JSON:", err);
            return res.status(500).json({ error: "Error al guardar JSON" });
        }
        console.log("✅ JSON guardado correctamente en:", rutaArchivo);
        res.json({ mensaje: "JSON guardado correctamente" });
    });
});

// Iniciar el servidor
const PORT = 3002;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor corriendo en http://0.0.0.0:${PORT}`);
});

