const http = require('http');
const fs = require('fs');
const path = require('path');
const mqtt = require('mqtt');
const socketIo = require('socket.io');
const WebSocket = require('ws');

const port = process.env.PORT || 3000;

// 1. CONEXIÓN A EMQX
const mqttClient = mqtt.connect('mqtts://z1ff7801.ala.us-east-1.emqxsl.com:8883', {
    username: 'Evelyn',
    password: 'AcordesDelCorazonNocturno',
    rejectUnauthorized: false
});

// 2. SERVIDOR HTTP
const server = http.createServer((req, res) => {
    let filePath = '.' + (req.url === '/' ? '/index.html' : req.url);
    const extname = path.extname(filePath);
    const mimeTypes = {
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.png': 'image/png',
        '.jpg': 'image/jpg'
    };
    let contentType = mimeTypes[extname] || 'text/html';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            res.writeHead(404);
            res.end('File not found');
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
        }
    });
});

// 3. SOCKET.IO
const io = socketIo(server, {
    maxHttpBufferSize: 1e7 
});
// hacer mas pequenno el buffer 
// cubernet balanceo de carga 
// buscar oro que no sea soket <algo para videos>
// --- EL CAMBIO ESTÁ AQUÍ ---
io.on('connection', (socket) => {
    console.log('¡Cliente web conectado! ID:', socket.id);

    // Los eventos DEBEN estar aquí dentro
    socket.on('comando-movimiento', (valor) => {
        console.log("RECIBIDO DESDE WEB:", valor);
        mqttClient.publish('evelyn/robot/mover', valor.toString());
    });

    socket.on('disconnect', () => {
        console.log('El cliente se desconectó');
    });
});
// ---------------------------
const wss = new WebSocket.Server({ server }); 

wss.on('connection', (ws) => {
    console.log('¡ESP32-CAM conectado por canal binario!');

    ws.on('message', (message) => {
        // message ya viene como un Buffer (binario)
        // Lo convertimos a Base64 solo para mostrarlo en el <img> de la web
        const base64Image = message.toString('base64');
        io.emit('streaming-video', base64Image);
    });
});

// 4. LÓGICA MQTT
mqttClient.on('connect', () => {
    console.log("¡Conectado al Broker EMQX!");
    mqttClient.subscribe(['evelyn/robot/camara', 'evelyn/robot/estado']);
});

mqttClient.on('message', (topic, message) => {
    if (topic === 'evelyn/robot/camara') {
        io.emit('streaming-video', message.toString());
    }
});

// 5. ARRANCAR SERVIDOR
server.listen(port, () => {
    console.log(`Servidor activo en puerto ${port}`);
});