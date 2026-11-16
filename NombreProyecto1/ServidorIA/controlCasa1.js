
const http = require('http');
const { SerialPort } = require('serialport');

const PUERTO_SERVIDOR = 3002;

// CAMBIA COM3 POR EL PUERTO DE TU ARDUINO
const PUERTO_ARDUINO = 'COM3';

const arduino = new SerialPort({
  path: PUERTO_ARDUINO,
  baudRate: 9600,
  autoOpen: false
});

arduino.open((error) => {
  if (error) {
    console.log('No se pudo abrir el Arduino:', error.message);
  }
});

arduino.on('open', () => {
  console.log('Arduino conectado en ' + PUERTO_ARDUINO);
});

arduino.on('data', (datos) => {
  console.log('Arduino:', datos.toString().trim());
});

arduino.on('error', (error) => {
  console.log('Error del Arduino:', error.message);
});

const comandos = [
  'PUERTA_ABRIR',
  'PUERTA_CERRAR',
  'VENTANA_ABRIR',
  'VENTANA_CERRAR',
  'LUZ_ON',
  'LUZ_OFF'
];

function responder(res, codigo, datos) {
  res.writeHead(codigo, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });

  res.end(JSON.stringify(datos));
}

const servidor = http.createServer((req, res) => {

  if (req.method === 'OPTIONS') {
    responder(res, 200, { correcto: true });
    return;
  }

  if (req.method === 'GET' && req.url === '/salud') {
    responder(res, 200, {
      servidor: 'funcionando',
      arduino: arduino.isOpen ? 'conectado' : 'desconectado',
      puerto: PUERTO_ARDUINO
    });
    return;
  }

  if (req.method === 'POST' && req.url === '/control') {
    let contenido = '';

    req.on('data', parte => {
      contenido += parte.toString();
    });

    req.on('end', () => {
      try {
        const datos = JSON.parse(contenido);

        if (!comandos.includes(datos.accion)) {
          responder(res, 400, {
            error: 'Comando no permitido'
          });
          return;
        }

        if (!arduino.isOpen) {
          responder(res, 503, {
            error: 'Arduino desconectado'
          });
          return;
        }

        arduino.write(datos.accion + '\n', (error) => {
          if (error) {
            responder(res, 500, {
              error: 'No se pudo enviar la orden'
            });
            return;
          }

          responder(res, 200, {
            mensaje: 'Orden enviada al Arduino',
            accion: datos.accion
          });
        });

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

servidor.listen(PUERTO_SERVIDOR, '0.0.0.0', () => {
  console.log('CONTROL CASA 1');
  console.log('Servidor activo en puerto ' + PUERTO_SERVIDOR);
});
