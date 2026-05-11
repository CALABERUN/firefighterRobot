const socket = io();
let gamepadIndex = null;
let usandoPantalla = false;
let ultimoValor = -1;
const teclas = {
    w: false,
    a: false,
    s: false,
    d: false,
    f: false
};

window.addEventListener('keydown', (event) => {
    const tecla = event.key.toLowerCase();

    if (tecla in teclas) {
        teclas[tecla] = true;
    }
});

window.addEventListener('keyup', (event) => {
    const tecla = event.key.toLowerCase();

    if (tecla in teclas) {
        teclas[tecla] = false;
    }
});
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

function loop() {
    // Si el usuario usa botones táctiles,
    // el gamepad no interfiere
    if (usandoPantalla) {

        requestAnimationFrame(loop);
        return;
    }

    let valor = 0;

    if (teclas.w) valor = 1;
    if (teclas.s) valor = 4;
    if (teclas.a) valor = 2;
    if (teclas.d) valor = 8;
    if (teclas.f) valor = 11;
    
    const gamepads = navigator.getGamepads();
    const gp = gamepads[gamepadIndex];

    if (gp) {
    if (gp.buttons[4].pressed)  valor =11;
    else if (gp.buttons[12].pressed) valor = 1;
    else if (gp.buttons[13].pressed) valor = 2;
    else if (gp.buttons[14].pressed) valor = 4;
    else if (gp.buttons[15].pressed) valor = 8;

    }


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
loop();


