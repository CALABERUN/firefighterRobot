const http = require('http');
const fs = require('fs');
const path = require('path');
const mqtt = require('mqtt');
const socketIo = require('socket.io'); // Necesitarás: npm install socket.io

const port = process.env.PORT || 3000; // Railway asigna el puerto automáticamente

// 1. CONEXIÓN SEGURA A EMQX
const mqttClient = mqtt.connect('mqtts://z1ff7801.ala.us-east-1.emqxsl.com:8883', {
    username: 'Evelyn',
    password: 'AcordesDelCorazonNocturno',
    rejectUnauthorized: false // Importante para TLS sin certificado manual
});

mqttClient.on('connect', () => {
    console.log("¡Conectado al Broker EMQX (Puerto 8883)!");
});

// 2. SERVIDOR HTTP (Para servir tu index.html)
const server = http.createServer((req, res) => {
    let filePath = '.' + (req.url === '/' ? '/index.html' : req.url);
    const extname = path.extname(filePath);
    let contentType = 'text/html';

    const mimeTypes = {
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.png': 'image/png',
        '.jpg': 'image/jpg'
    };
    contentType = mimeTypes[extname] || 'text/html';

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

// 3. SOCKET.IO (Para recibir clics de la web y mandarlos a MQTT)
const io = require('socket.io')(server);

io.on('connection', (socket) => {
    console.log('Usuario conectado a la web');

    // Cuando el HTML hace socket.emit('comando-movimiento', ...)
    socket.on('comando-movimiento', (letra) => {
        console.log("Moviendo a:", letra);
        // Lo mandamos al ESP32 por MQTT
        mqttClient.publish('evelyn/robot/mover', letra);
    });

    // Cuando el HTML hace socket.emit('comando-led', ...)
    socket.on('comando-led', (estado) => {
        
        mqttClient.publish('evelyn/robot/boton', estado);
    });
});
// 1. Suscribirse al canal de la cámara
mqttClient.on('connect', () => {
    mqttClient.subscribe('evelyn/robot/camara');
});

// 2. Cuando llegue una foto, mandarla a la web
mqttClient.on('message', (topic, message) => {
    if (topic === 'evelyn/robot/camara') {
        // 'message' es el texto Base64 que envió el ESP32
        io.emit('streaming-video', message.toString());
    }
});
server.listen(port, () => {
    console.log(`Servidor corriendo en puerto ${port}`);
});