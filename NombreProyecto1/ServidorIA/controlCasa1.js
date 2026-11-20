
const http = require('http');
const { SerialPort, ReadlineParser } = require('serialport');

<<<<<<< HEAD
// ===========================================
// COLONIA DOMOTICA - SERVIDOR ARDUINO
// ===========================================
=======
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
>>>>>>> b696bbbfceebe964feb17b0976a0778001dccf18

// UN SOLO SERVIDOR PARA TODA LA MAQUETA
const PUERTO_HTTP = 3002;

// PUERTO ACTUAL DEL ARDUINO
const PUERTO_ARDUINO = 'COM7';

const BAUDIOS = 9600;

// TIEMPO DE ESPERA DEL SERVIDOR
const ESPERA_CONFIRMACION_MS = 22000;

let arduinoListo = false;
let ultimaRespuesta = 'Sin datos';
let pendiente = null;

<<<<<<< HEAD
// ===========================================
// CONEXION CON ARDUINO
// ===========================================
=======
// =====================================
// CONEXION SERIAL
// =====================================
>>>>>>> 9768f5f584ed49ec0c3184dacec96f415f2f73b4
>>>>>>> b696bbbfceebe964feb17b0976a0778001dccf18

const arduino = new SerialPort({
  path: PUERTO_ARDUINO,
  baudRate: BAUDIOS,
  autoOpen: false
});

const lector = arduino.pipe(
  new ReadlineParser({
    delimiter: '\n'
  })
);

// ===========================================
// MOSTRAR MENSAJES
// ===========================================

function registro(etiqueta, texto = '') {

  console.log(
    `[${new Date().toLocaleTimeString()}] ${etiqueta}`,
    texto
  );
}

// ===========================================
// RESPUESTAS HTTP
// ===========================================

function responder(res, codigo, datos) {

  if (res.writableEnded || res.destroyed) {
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

// ===========================================
// TERMINAR UNA ORDEN
// ===========================================

function terminarOrden(orden, codigo, datos) {

  if (pendiente !== orden) {
    return;
  }

  pendiente = null;

  clearTimeout(orden.temporizador);

  responder(
    orden.res,
    codigo,
    datos
  );
}

// ===========================================
// LEER RESPUESTAS DEL ARDUINO
// ===========================================

lector.on('data', linea => {

  const mensaje = String(linea).trim();

  if (!mensaje) {
    return;
  }

  ultimaRespuesta = mensaje;

  registro('[RECIBIDO]', mensaje);

  // ARDUINO LISTO
  if (mensaje === 'COLONIA_DOMOTICA_LISTA') {

    arduinoListo = true;

    registro('[ARDUINO LISTO]');

    return;
  }

  const orden = pendiente;

  if (!orden) {

    registro(
      '[RESPUESTA SIN ORDEN PENDIENTE]',
      mensaje
    );

    return;
  }

  // CONFIRMACION REAL
  if (mensaje === `OK:${orden.comando}`) {

    registro(
      '[CONFIRMADO]',
      orden.comando
    );

    terminarOrden(orden, 200, {
      ok: true,
      comando: orden.comando
    });

    return;
  }

  // ERROR EN EL ARDUINO
  if (mensaje.startsWith('ERROR:')) {

    registro(
      '[RECHAZADO]',
      `${orden.comando} -> ${mensaje}`
    );

    terminarOrden(orden, 409, {
      ok: false,
      comando: orden.comando,
      error: mensaje
    });
  }
});

// ===========================================
// ERRORES DEL PUERTO SERIAL
// ===========================================

arduino.on('error', error => {

  arduinoListo = false;

  registro(
    '[ERROR SERIAL]',
    error.message
  );

  if (pendiente) {

    terminarOrden(pendiente, 503, {
      ok: false,
      error: error.message
    });
  }
});

arduino.on('close', () => {

  arduinoListo = false;

  registro('[PUERTO CERRADO]');

  if (pendiente) {

    terminarOrden(pendiente, 503, {
      ok: false,
      error: 'Arduino se desconecto.'
    });
  }
});

// ===========================================
// VALIDAR COMANDOS
// ===========================================

function comandoValido(comando) {

  return (

    // LUCES Y PUERTAS DE LAS 4 CASAS
    /^CASA[1-4]_(LUZ_(ON|OFF)|PUERTA_(ABRIR|CERRAR))$/
      .test(comando) ||

    // VENTANAS DE LAS CASAS 1 Y 2
    /^CASA[12]_VENTANA_(ABRIR|CERRAR)$/
      .test(comando) ||

    // TENDEDEROS DE LAS CASAS 3 Y 4
    /^CASA[34]_TENDEDERO_(EXTENDER|GUARDAR)$/
      .test(comando) ||

    // SEIS POSTES
    /^POSTE[1-6]_(ON|OFF)$/
      .test(comando) ||

    // TODOS LOS POSTES
    /^POSTES_TODOS_(ON|OFF)$/
      .test(comando) ||

    // COMANDOS ANTIGUOS DE LA CASA 1
    /^(LUZ_(ON|OFF)|PUERTA_(ABRIR|CERRAR)|VENTANA_(ABRIR|CERRAR))$/
      .test(comando)
  );
}

// ===========================================
// ENVIAR ORDEN AL ARDUINO
// ===========================================

function enviarOrden(comando, res) {

  if (!arduino.isOpen || !arduinoListo) {

    responder(res, 503, {
      ok: false,
      error:
        'Arduino no esta listo. Revisa COM3 y cierra el Monitor Serie.'
    });

    return;
  }

  // NO ENVIAR DOS ORDENES A LA VEZ
  if (pendiente) {

    responder(res, 409, {
      ok: false,
      error:
        'Otra orden esta en proceso. Espera antes de enviar otra.'
    });

    return;
  }

  const orden = {
    comando: comando,
    res: res,
    temporizador: null
  };

  pendiente = orden;

  registro('[ENVIANDO]', comando);

  // ESPERAR CONFIRMACION DEL ARDUINO
  orden.temporizador = setTimeout(() => {

    if (pendiente === orden) {

      registro(
        '[SIN CONFIRMACION]',
        comando
      );

      terminarOrden(orden, 504, {
        ok: false,
        error:
          'Arduino no confirmo la orden dentro de 22 segundos.'
      });
    }

  }, ESPERA_CONFIRMACION_MS);

  try {

    // ENVIAR CON SALTO DE LINEA
    arduino.write(
      comando + '\n',
      error => {

        if (error) {

          registro(
            '[ERROR DE ESCRITURA]',
            error.message
          );

          if (pendiente === orden) {

            terminarOrden(orden, 503, {
              ok: false,
              error: error.message
            });
          }

        } else {

          // ESTE MENSAJE NO CONFIRMA
          // QUE ARDUINO EJECUTO LA ORDEN
          registro(
            '[ESCRITURA COMPLETADA]',
            comando
          );
        }
      }
    );

    registro(
      '[ESCRITURA SOLICITADA]',
      comando
    );

  } catch (error) {

    registro(
      '[ERROR DE ENVIO]',
      error.message
    );

    terminarOrden(orden, 503, {
      ok: false,
      error: error.message
    });
  }
}

// ===========================================
// SERVIDOR HTTP
// ===========================================

const servidor = http.createServer(
  (req, res) => {

    const ruta = (req.url || '/').split('?')[0];

    // PERMITIR PETICIONES
    if (req.method === 'OPTIONS') {

      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      });

      res.end();

      return;
    }

    // ======================================
    // CONSULTAR CONEXION
    // ======================================

    if (
      req.method === 'GET' &&
      ruta === '/salud'
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

    // ======================================
    // RECIBIR ORDEN DE EXPO GO
    // ======================================

    if (
      req.method === 'POST' &&
      ruta === '/control'
    ) {

      let cuerpo = '';
      let excedido = false;

      req.on('data', bloque => {

        cuerpo += bloque.toString('utf8');

        if (
          cuerpo.length > 8192 &&
          !excedido
        ) {

          excedido = true;

          responder(res, 413, {
            ok: false,
            error: 'Solicitud demasiado grande.'
          });
        }
      });

      req.on('end', () => {

        if (excedido) {
          return;
        }

        let datos;

        try {

          datos = JSON.parse(cuerpo);

        } catch (error) {

          responder(res, 400, {
            ok: false,
            error: 'JSON incorrecto.'
          });

          return;
        }

        const comando = datos && datos.accion;

        if (
          typeof comando !== 'string' ||
          !comandoValido(comando)
        ) {

          responder(res, 400, {
            ok: false,
            error: 'Datos incorrectos.'
          });

          return;
        }

        enviarOrden(comando, res);
      });

      return;
    }

    responder(res, 404, {
      error: 'Ruta no encontrada'
    });
  }
);

// ===========================================
// ERRORES DEL SERVIDOR
// ===========================================

servidor.on('error', error => {

  if (error.code === 'EADDRINUSE') {

    console.error(
      'El puerto 3002 ya esta ocupado. Cierra el servidor anterior.'
    );

  } else {

    console.error(
      'Error de servidor:',
      error.message
    );
  }

  process.exit(1);
});

// ===========================================
// INICIAR SERVIDOR Y ARDUINO
// ===========================================

servidor.listen(
  PUERTO_HTTP,
  '0.0.0.0',
  () => {

    console.log('==============================');
    console.log('     COLONIA DOMOTICA');
    console.log('==============================');

    console.log(
      'Servidor: puerto',
      PUERTO_HTTP
    );

    console.log(
      'Arduino:',
      PUERTO_ARDUINO
    );

    console.log('==============================');

    arduino.open(error => {

      if (error) {

        registro(
          '[NO SE PUDO ABRIR]',
          error.message
        );

        return;
      }

      registro(
        '[PUERTO ABIERTO]',
        PUERTO_ARDUINO
      );

      registro('[ESPERANDO ARDUINO]');
    });
  }
);
