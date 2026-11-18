
const http = require('http');

const {
  SerialPort,
  ReadlineParser
} = require('serialport');

<<<<<<< HEAD
// CAMBIA COM3 POR EL PUERTO DE TU ARDUINO
const PUERTO_ARDUINO = 'COM4';
=======
// =====================================
// COLONIA DOMOTICA INTELIGENTE
// SERVIDOR DE LAS 4 CASAS Y 6 POSTES
// =====================================

const PUERTO_HTTP = 3002;
const PUERTO_ARDUINO = 'COM7';
const VELOCIDAD = 9600;

let arduinoListo = false;
let ordenPendiente = null;
let ultimaRespuesta = 'Sin mensajes';

// =====================================
// CONEXION SERIAL
// =====================================
>>>>>>> 9768f5f584ed49ec0c3184dacec96f415f2f73b4

const arduino = new SerialPort({
  path: PUERTO_ARDUINO,
  baudRate: VELOCIDAD,
  autoOpen: false
});

// LEE CADA MENSAJE COMPLETO DEL ARDUINO
const lector = arduino.pipe(
  new ReadlineParser({
    delimiter: '\n'
  })
);

// =====================================
// RESPUESTAS HTTP
// =====================================

function responder(res, codigo, datos) {

  if (res.writableEnded) {
    return;
  }

  res.writeHead(codigo, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'no-store'
  });

  res.end(JSON.stringify(datos));
}

// =====================================
// TERMINAR UNA ORDEN
// =====================================

function terminarOrden(codigo, datos) {

  if (!ordenPendiente) {
    return;
  }

  const actual = ordenPendiente;

  ordenPendiente = null;

  clearTimeout(actual.temporizador);

  responder(actual.res, codigo, datos);
}

// =====================================
// RECIBIR MENSAJES DE ARDUINO
// =====================================

lector.on('data', linea => {

  const mensaje = String(linea).trim();

  if (!mensaje) {
    return;
  }

  ultimaRespuesta = mensaje;

  console.log('[RECIBIDO]', mensaje);

  // ARDUINO INICIO CORRECTAMENTE
  if (
    mensaje === 'COLONIA_DOMOTICA_LISTA'
  ) {

    arduinoListo = true;

    console.log('Arduino listo para recibir ordenes');

    return;
  }

  if (!ordenPendiente) {
    return;
  }

  const comando = ordenPendiente.comando;

  // CONFIRMACION CORRECTA
  if (mensaje === 'OK:' + comando) {

    console.log('[CONFIRMADO]', comando);

    terminarOrden(200, {
      ok: true,
      comando: comando,
      mensaje: 'Arduino confirmo la orden'
    });

    return;
  }

  // ARDUINO RESPONDIO CON ERROR
  if (mensaje.startsWith('ERROR:')) {

    terminarOrden(422, {
      ok: false,
      error: mensaje
    });

  }
});

// =====================================
// ESTADO DEL PUERTO
// =====================================

arduino.on('open', () => {

  arduinoListo = false;

  console.log('Puerto abierto:', PUERTO_ARDUINO);
  console.log('Esperando que Arduino inicie...');

});

arduino.on('error', error => {

  console.log('[ERROR SERIAL]', error.message);

  arduinoListo = false;

  terminarOrden(503, {
    error: 'Error de comunicacion con Arduino'
  });

});

arduino.on('close', () => {

  arduinoListo = false;

  console.log('Arduino desconectado');

  terminarOrden(503, {
    error: 'Se desconecto el Arduino'
  });

});

// =====================================
// VERIFICAR ORDENES PERMITIDAS
// =====================================

function ordenValida(comando) {

  if (typeof comando !== 'string') {
    return false;
  }

  // LUCES Y PUERTAS
  if (
    /^CASA[1-4]_(LUZ_ON|LUZ_OFF|PUERTA_ABRIR|PUERTA_CERRAR)$/.test(comando)
  ) {
    return true;
  }

  // VENTANAS
  if (
    /^CASA[12]_VENTANA_(ABRIR|CERRAR)$/.test(comando)
  ) {
    return true;
  }

  // TENDEDEROS
  if (
    /^CASA[34]_TENDEDERO_(EXTENDER|GUARDAR)$/.test(comando)
  ) {
    return true;
  }

  // POSTES INDIVIDUALES
  if (
    /^POSTE[1-6]_(ON|OFF)$/.test(comando)
  ) {
    return true;
  }

  // TODOS LOS POSTES
  if (
    /^POSTES_TODOS_(ON|OFF)$/.test(comando)
  ) {
    return true;
  }

  return false;
}

// =====================================
// ENVIAR ORDEN AL ARDUINO
// =====================================

function enviarOrden(comando, res) {

  if (!arduino.isOpen || !arduinoListo) {

    responder(res, 503, {
      error: 'Arduino no esta listo'
    });

    return;
  }

  if (ordenPendiente) {

    responder(res, 409, {
      error: 'Arduino esta procesando otra orden'
    });

    return;
  }

  console.log('[ENVIANDO]', comando);

  const temporizador = setTimeout(() => {

    console.log(
      '[SIN RESPUESTA]',
      comando
    );

    terminarOrden(504, {
      ok: false,
      error:
        'Arduino no respondio la orden. ' +
        'Revisa los mensajes de la terminal.'
    });

  }, 6500);

  // GUARDAR LA ORDEN ANTES DE ENVIARLA
  ordenPendiente = {
    comando,
    res,
    temporizador
  };

  // ENVIAR CON SALTO DE LINEA
  arduino.write(
    comando + '\n',
    'utf8',
    error => {

      if (error) {

        console.log(
          '[ERROR AL ENVIAR]',
          error.message
        );

        terminarOrden(500, {
          error: 'No se pudo escribir en COM7'
        });

        return;
      }

      // CONFIRMAR QUE LOS DATOS SALIERON
      // DEL BUFFER DEL PUERTO SERIAL
      arduino.drain(errorDrenaje => {

        if (errorDrenaje) {

          console.log(
            '[ERROR DE ENVIO]',
            errorDrenaje.message
          );

          terminarOrden(500, {
            error: 'Error al transmitir los datos'
          });

          return;
        }

        console.log('[TRANSMITIDO]', comando);

      });
    }
  );
}

// =====================================
// SERVIDOR HTTP
// =====================================

const servidor = http.createServer((req, res) => {

  // CORS
  if (req.method === 'OPTIONS') {

    responder(res, 200, {
      ok: true
    });

    return;
  }

  // COMPROBAR CONEXION
  if (
    req.method === 'GET' &&
    req.url === '/salud'
  ) {

    responder(res, 200, {
      servidor: 'funcionando',
      arduino: arduino.isOpen
        ? 'conectado'
        : 'desconectado',
      listo: arduinoListo,
      puerto: PUERTO_ARDUINO,
      ultimaRespuesta: ultimaRespuesta
    });

    return;
  }

  // CONTROL DE DISPOSITIVOS
  if (
    req.method === 'POST' &&
    req.url === '/control'
  ) {

    let cuerpo = '';

    req.on('data', parte => {

      cuerpo += parte.toString();

      if (cuerpo.length > 2000) {

        responder(res, 413, {
          error: 'Mensaje demasiado grande'
        });

      }
    });

    req.on('end', () => {

      if (res.writableEnded) {
        return;
      }

      try {

        const datos = JSON.parse(cuerpo);

        const comando = datos.accion;

        if (!ordenValida(comando)) {

          responder(res, 400, {
            error: 'Comando no permitido'
          });

          return;
        }

        enviarOrden(comando, res);

      } catch (error) {

        responder(res, 400, {
          error: 'Datos incorrectos'
        });

      }
    });

    return;
  }

  responder(res, 404, {
    error: 'Ruta no encontrada'
  });

});

// =====================================
// INICIAR SERVIDOR
// =====================================

servidor.listen(
  PUERTO_HTTP,
  '0.0.0.0',
  () => {

    console.log('==============================');
    console.log('     COLONIA DOMOTICA');
    console.log('==============================');
    console.log('Servidor: puerto 3002');
    console.log('Arduino:', PUERTO_ARDUINO);
    console.log('==============================');

  }
);

// ABRIR COM7 DESPUES DE CONFIGURAR TODO
arduino.open(error => {

  if (error) {

    console.log(
      'No se pudo abrir COM7:',
      error.message
    );

  }
});
