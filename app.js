const http = require('http');
const fs = require('fs');
const path = require('path');
const mqtt = require('mqtt');
const socketIo = require('socket.io');

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

// 3. SOCKET.IO (Configurado para video pesado)
const io = socketIo(server, {
    maxHttpBufferSize: 1e7 // 10MB para soportar Base64
});

io.on('connection', (socket) => {
    console.log('Cliente web conectado');

    socket.on('comando-movimiento', (letra) => {
        mqttClient.publish('evelyn/robot/mover', letra);
    });

    socket.on('comando-led', (estado) => {
        mqttClient.publish('evelyn/robot/boton', estado);
    });
});

// 4. LÓGICA MQTT (Suscripción y Recepción)
mqttClient.on('connect', () => {
    console.log("¡Conectado al Broker EMQX!");
    // Nos suscribimos a la cámara y al estado
    mqttClient.subscribe(['evelyn/robot/camara', 'evelyn/robot/estado']);
});

mqttClient.on('message', (topic, message) => {
    if (topic === 'evelyn/robot/camara') {
        // Enviamos la imagen Base64 directamente a la web
        io.emit('streaming-video', message.toString());
    }
});

// 5. ARRANCAR SERVIDOR
server.listen(port, () => {
    console.log(`Servidor activo en puerto ${port}`);
});