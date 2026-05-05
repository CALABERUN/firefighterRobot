// Conectamos con el servidor Node.js (Railway o Local)
  const socket = io(); 
// Esta única función controla todo
  function enviarComando(valor) {
      console.log("Enviando estado:", valor);
      socket.emit('comando-movimiento', valor.toString());
  }

  // Si usas el control de Play, esta función sumará los bits
  function enviarComandoMando(mando) {
    let valor = 0;
    if (mando.arriba)    valor += 1;
    if (mando.abajo)     valor += 2;
    if (mando.izquierda) valor += 4;
    if (mando.derecha)   valor += 8;
    if (mando.botonFuego) valor = 11; 

    socket.emit('comando-movimiento', valor.toString());
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

    if (recibiendo) {
        chunks.push(data);
    }
