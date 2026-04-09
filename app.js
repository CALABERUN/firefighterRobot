const http = require('http');
const fs = require('fs');
const path = require('path');
const mqtt = require('mqtt');
const socketIo = require('socket.io');
const WebSocket = require('ws');

const port = process.env.PORT || 3000;

const mqttClient = mqtt.connect('mqtts://z1ff7801.ala.us-east-1.emqxsl.com:8883', {
    username: 'Evelyn',
    password: 'AcordesDelCorazonNocturno',
    rejectUnauthorized: false
});

const server = http.createServer((req, res) => {
    let fileName = req.url === '/' ? 'index.html' : req.url;
    let filePath = path.join(__dirname, fileName); 
    
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
            res.end('Archivo no encontrado');
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
        }
    });
});

const io = socketIo(server, { cors: { origin: "*" } });

// SOPORTE PARA WEBSOCKET (Video del ESP32)
const wss = new WebSocket.Server({ noServer: true });

server.on('upgrade', (request, socket, head) => {
    const pathname = new URL(request.url, `http://${request.headers.host}`).pathname;
    if (pathname === '/') {
        wss.handleUpgrade(request, socket, head, (ws) => {
            wss.emit('connection', ws, request);
        });
    }
});

wss.on('connection', (ws) => {
    console.log("¡ESP32 conectado para envío de video!");
    ws.on('message', (data) => {
        // IMPORTANTE: Como el ESP32 ya manda Base64, 
        // solo lo convertimos a string y lo mandamos a la web.
        io.emit('streaming-video', data.toString());
    });
});

io.on('connection', (socket) => {
    console.log('Cliente web conectado');
    socket.on('comando-movimiento', (valor) => {
        console.log("Comando enviado a MQTT:", valor);
        mqttClient.publish('evelyn/robot/mover', valor.toString());
    });
});

mqttClient.on('connect', () => {
    console.log("¡Conectado al Broker EMQX!");
    mqttClient.subscribe(['evelyn/robot/mover', 'evelyn/robot/boton']);
});

server.listen(port, () => {
    console.log(`Servidor activo en puerto ${port}`);
});