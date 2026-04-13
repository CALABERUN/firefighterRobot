const http = require('http');
const fs = require('fs');
const path = require('path');
const mqtt = require('mqtt');
const socketIo = require('socket.io');
const WebSocket = require('ws');

const port = process.env.PORT || 3000;

// ==========================
// 1. MQTT (EMQX)
// ==========================
const mqttClient = mqtt.connect('mqtts://z1ff7801.ala.us-east-1.emqxsl.com:8883', {
    username: 'Evelyn',
    password: 'AcordesDelCorazonNocturno',
    rejectUnauthorized: false
});

mqttClient.on('connect', () => {
    console.log("MQTT conectado");

    mqttClient.subscribe([
        'evelyn/robot/estado'
    ]);
});

// ==========================
// 2. HTTP SERVER
// ==========================
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
const wss = new WebSocket.Server({ 
    server,
    path: '/'
});

// ==========================
// 3. SOCKET.IO (WEB)
// ==========================
const io = socketIo(server, {
    maxHttpBufferSize: 1e7,
    perMessageDeflate: false
});


io.on('connection', (socket) => {
    console.log('Web conectada:', socket.id);

    // 📤 WEB → MQTT (CONTROL ROBOT)
    socket.on('comando-movimiento', (valor) => {
        console.log("WEB → MQTT:", valor);

        mqttClient.publish(
            'evelyn/robot/mover',
            valor.toString()
        );
    });

    // 📤 WEB → MQTT (BOTÓN / LED)
    socket.on('boton-led', (estado) => {
        console.log("LED:", estado);

        mqttClient.publish(
            'evelyn/robot/boton',
            estado.toString()
        );
    });

    socket.on('disconnect', () => {
        console.log('Web desconectada:', socket.id);
    });
});

// ==========================
// 4. MQTT → WEB
// ==========================
mqttClient.on('message', (topic, message) => {

    // 📡 ESTADO ROBOT
    if (topic === 'evelyn/robot/estado') {
        io.emit('estado-robot', message.toString());
    }
});


wss.on('connection', (ws) => {
    console.log('ESP32 conectado por WS');

    let frameChunks = [];
    let receiving = false;
    const MAX_FRAME_SIZE = 200000;

    ws.on('message', (data, isBinary) => {

        if (!isBinary) {
            const msg = data.toString();

            if (msg === "START") {
                frameChunks = [];
                receiving = true;
                return;
            }

            if (msg === "END") {
                const finalImage = Buffer.concat(frameChunks);

                console.log("Frame size:", finalImage.length);

                io.emit('streaming-video', finalImage);

                receiving = false;
                return;
            }
        }

if (receiving && isBinary) {
    frameChunks.push(data);

    let totalSize = frameChunks.reduce((acc, b) => acc + b.length, 0);

    if (totalSize > MAX_FRAME_SIZE) {
        console.log("Frame demasiado grande, descartado");
        frameChunks = [];
        receiving = false;
    }
}
    });

    ws.on('close', () => {
        console.log('ESP32 desconectado');
    });

    ws.on('error', (err) => {
        console.log('WS error:', err.message);
    });
});


// ==========================
// 5. START SERVER
// ==========================
server.listen(port, () => {
    console.log(`Servidor activo en puerto ${port}`);
});
