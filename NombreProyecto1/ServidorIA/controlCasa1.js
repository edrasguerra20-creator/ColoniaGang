'use strict';

// Un único servidor HTTP para las cuatro casas y seis postes.
// Conserva el protocolo ya utilizado por la app y el Arduino.
const http = require('http');
const { SerialPort, ReadlineParser } = require('serialport');
const { crearProgramador, comandoPara } = require('./automatizaciones');

const PUERTO_HTTP = Number(process.env.PUERTO_HTTP || 3002);
const PUERTO_ARDUINO = process.env.PUERTO_ARDUINO || 'COM7';
const BAUDIOS = 9600;
const ESPERA_CONFIRMACION_MS = 22000;

const arduino = new SerialPort({ path: PUERTO_ARDUINO, baudRate: BAUDIOS, autoOpen: false });
const lector = arduino.pipe(new ReadlineParser({ delimiter: '\n' }));
let arduinoListo = false;
let ultimaRespuesta = 'Sin datos';
let pendiente = null;

function registro(etiqueta, texto = '') {
  console.log(`[${new Date().toLocaleTimeString()}] ${etiqueta}`, texto);
}

function responder(res, codigo, datos) {
  if (res.writableEnded || res.destroyed) return;
  res.writeHead(codigo, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'no-store'
  });
  res.end(JSON.stringify(datos));
}

function terminarOrden(orden, error, datos) {
  if (pendiente !== orden) return;
  pendiente = null;
  clearTimeout(orden.temporizador);
  if (error) orden.reject(error);
  else orden.resolve(datos);
}

function crearError(mensaje, codigo) {
  const error = new Error(mensaje);
  error.codigo = codigo;
  return error;
}

lector.on('data', linea => {
  const mensaje = String(linea).trim();
  if (!mensaje) return;
  ultimaRespuesta = mensaje;
  registro('[RECIBIDO]', mensaje);
  if (mensaje === 'COLONIA_DOMOTICA_LISTA') {
    arduinoListo = true;
    registro('[ARDUINO LISTO]');
    return;
  }
  const orden = pendiente;
  if (!orden) return;
  if (mensaje === `OK:${orden.comando}`) {
    terminarOrden(orden, null, { ok: true, comando: orden.comando });
  } else if (mensaje.startsWith('ERROR:')) {
    terminarOrden(orden, crearError(mensaje, 409));
  }
});

arduino.on('error', error => {
  arduinoListo = false;
  registro('[ERROR SERIAL]', error.message);
  if (pendiente) terminarOrden(pendiente, crearError(error.message, 503));
});
arduino.on('close', () => {
  arduinoListo = false;
  registro('[PUERTO CERRADO]');
  if (pendiente) terminarOrden(pendiente, crearError('Arduino se desconectó.', 503));
});

function comandoValido(comando) {
  return typeof comando === 'string' && (
    /^CASA[1-4]_(LUZ_(ON|OFF)|PUERTA_(ABRIR|CERRAR))$/.test(comando) ||
    /^CASA[12]_VENTANA_(ABRIR|CERRAR)$/.test(comando) ||
    /^CASA[34]_TENDEDERO_(EXTENDER|GUARDAR)$/.test(comando) ||
    /^POSTE[1-6]_(ON|OFF)$/.test(comando) ||
    /^POSTES_TODOS_(ON|OFF)$/.test(comando) ||
    /^(LUZ_(ON|OFF)|PUERTA_(ABRIR|CERRAR)|VENTANA_(ABRIR|CERRAR))$/.test(comando)
  );
}

function enviarComando(comando) {
  if (!comandoValido(comando)) return Promise.reject(crearError('Comando no admitido.', 400));
  if (!arduino.isOpen || !arduinoListo) {
    return Promise.reject(crearError(`Arduino no está listo. Revisa ${PUERTO_ARDUINO} y cierra el Monitor Serie.`, 503));
  }
  if (pendiente) return Promise.reject(crearError('Otra orden está en proceso.', 'OCUPADO'));
  return new Promise((resolve, reject) => {
    const orden = { comando, resolve, reject, temporizador: null };
    pendiente = orden;
    orden.temporizador = setTimeout(() => {
      terminarOrden(orden, crearError('Arduino no confirmó la orden dentro de 22 segundos.', 504));
    }, ESPERA_CONFIRMACION_MS);
    registro('[ENVIANDO]', comando);
    try {
      arduino.write(comando + '\n', error => {
        if (error) terminarOrden(orden, crearError(error.message, 503));
        else registro('[ESCRITURA COMPLETADA]', comando);
      });
    } catch (error) {
      terminarOrden(orden, crearError(error.message, 503));
    }
  });
}

const programador = crearProgramador({ enviarComando });

function leerJson(req, res, callback) {
  let cuerpo = '';
  let excedido = false;
  req.on('data', bloque => {
    cuerpo += bloque.toString('utf8');
    if (cuerpo.length > 8192 && !excedido) {
      excedido = true;
      responder(res, 413, { ok: false, error: 'Solicitud demasiado grande.' });
    }
  });
  req.on('end', () => {
    if (excedido) return;
    try {
      const datos = JSON.parse(cuerpo);
      if (!datos || typeof datos !== 'object' || Array.isArray(datos)) throw Error('JSON debe ser un objeto');
      callback(datos);
    } catch (error) {
      responder(res, 400, { ok: false, error: 'JSON incorrecto.' });
    }
  });
  req.on('error', error => responder(res, 400, { ok: false, error: error.message }));
}

const servidor = http.createServer((req, res) => {
  const ruta = (req.url || '/').split('?')[0];
  if (req.method === 'OPTIONS') return responder(res, 204, {});
  if (req.method === 'GET' && ruta === '/salud') {
    return responder(res, 200, {
      servidor: 'funcionando',
      arduino: arduino.isOpen ? 'conectado' : 'desconectado',
      listo: arduinoListo,
      puerto: PUERTO_ARDUINO,
      ultimaRespuesta
    });
  }
  if (req.method === 'GET' && ruta === '/automatizaciones') {
    return responder(res, 200, { ok: true, automatizaciones: programador.listar() });
  }
  if (req.method === 'POST' && ruta === '/automatizaciones') {
    return leerJson(req, res, datos => {
      try {
        // Solo se aceptan dispositivos y órdenes del protocolo conocido.
        if (!comandoPara(Number(datos.casa), datos.dispositivo, datos.accion)) {
          throw crearError('Casa, dispositivo o acción inválida.', 400);
        }
        const trabajo = programador.crear(datos);
        responder(res, 201, { ok: true, automatizacion: trabajo });
      } catch (error) {
        responder(res, error.codigo || 500, { ok: false, error: error.message });
      }
    });
  }
  if (req.method === 'DELETE' && /^\/automatizaciones\/[0-9a-f-]{36}$/.test(ruta)) {
    try {
      const trabajo = programador.cancelar(ruta.split('/')[2]);
      return responder(res, 200, { ok: true, automatizacion: trabajo });
    } catch (error) {
      return responder(res, error.codigo || 500, { ok: false, error: error.message });
    }
  }
  if (req.method === 'POST' && ruta === '/control') {
    return leerJson(req, res, datos => {
      if (!comandoValido(datos.accion)) {
        return responder(res, 400, { ok: false, error: 'Comando incorrecto.' });
      }
      enviarComando(datos.accion)
        .then(resultado => responder(res, 200, resultado))
        .catch(error => responder(res, typeof error.codigo === 'number' ? error.codigo : 409,
          { ok: false, error: error.message }));
    });
  }
  responder(res, 404, { ok: false, error: 'Ruta no encontrada.' });
});

servidor.on('error', error => {
  console.error('Error de servidor:', error.message);
  process.exitCode = 1;
});

servidor.listen(PUERTO_HTTP, '0.0.0.0', () => {
  console.log(`Colonia Domótica | HTTP: ${PUERTO_HTTP} | Arduino: ${PUERTO_ARDUINO} | Baudios: ${BAUDIOS}`);
  arduino.open(error => {
    if (error) registro('[NO SE PUDO ABRIR]', error.message);
    else registro('[ESPERANDO ARDUINO]', PUERTO_ARDUINO);
  });
});
