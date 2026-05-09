const socket = io();
let gamepadIndex = null;
let usandoPantalla = false;
let ultimoValor = -1;

function enviarComando(valor) {

    const validos = [0, 1, 2, 4, 8, 11];

    if (!validos.includes(valor)) {
        return;
    }

    // Evita reenviar el mismo valor
    if (valor === ultimoValor) return;

    ultimoValor = valor;

    console.log("Enviando:", valor);

    socket.emit('comando-movimiento', valor.toString());
}

window.addEventListener("gamepadconnected", (e) => {

    console.log("Control conectado:", e.gamepad.id);

    gamepadIndex = e.gamepad.index;

    loop();
});
window.addEventListener('keydown', (event) => {

    if (event.code in teclas) {
        teclas[event.code] = true;
    }
});

window.addEventListener('keyup', (event) => {

    if (event.code in teclas) {
        teclas[event.code] = false;
    }
});
function loop() {
    // Si el usuario usa botones táctiles,
    // el gamepad no interfiere
    if (usandoPantalla) {

        requestAnimationFrame(loop);
        return;s
    }

    let valor = 0;

    if (teclas.KeyW) valor =1;
    if (teclas.KeyS) valor =2;
    if (teclas.KeyA) valor =4;
    if (teclas.KeyD) valor =8;
    if (teclas.KeyF) valor =11;
    const gamepads = navigator.getGamepads();
    const gp = gamepads[gamepadIndex];

    if (!gp) {

        requestAnimationFrame(loop);
        return;
    }


    if (gp.buttons[4].pressed)  valor =11;
    else if (gp.buttons[12].pressed) valor = 1;
    else if (gp.buttons[13].pressed) valor = 2;
    else if (gp.buttons[14].pressed) valor = 4;
    else if (gp.buttons[15].pressed) valor = 8;
    

    enviarComando(valor);

    requestAnimationFrame(loop);
}

    
    const imgElement = document.getElementById('Camera');

socket.on('streaming-video', (data) => {

    let arrayBuffer;

    if (data instanceof ArrayBuffer) {
        arrayBuffer = data;
    } else {
        arrayBuffer = new Uint8Array(data).buffer;
    }

    const blob = new Blob([arrayBuffer], { type: 'image/jpeg' });
    const url = URL.createObjectURL(blob);

    imgElement.src = url;
});


