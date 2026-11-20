'use strict';

// Las programaciones viven en el servidor, no en el teléfono.
// Persisten en disco y se retoman si se reinicia Node.js.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DISPOSITIVOS = new Set(['luz', 'puerta', 'especial']);
const ACCIONES = new Set(['activar', 'desactivar']);
const MAX_SEGUNDOS = 7 * 24 * 60 * 60;
const MAX_ACTIVAS = 40;
const MAX_REGISTROS = 200;

function comandoPara(casa, dispositivo, accion) {
  if (!Number.isInteger(casa) || casa < 1 || casa > 4 ||
    !DISPOSITIVOS.has(dispositivo) || !ACCIONES.has(accion)) {
    return null;
  }
  const activar = accion === 'activar';
  const prefijo = `CASA${casa}_`;
  if (dispositivo === 'luz') return prefijo + (activar ? 'LUZ_ON' : 'LUZ_OFF');
  if (dispositivo === 'puerta') return prefijo + (activar ? 'PUERTA_ABRIR' : 'PUERTA_CERRAR');
  if (casa <= 2) return prefijo + (activar ? 'VENTANA_ABRIR' : 'VENTANA_CERRAR');
  return prefijo + (activar ? 'TENDEDERO_EXTENDER' : 'TENDEDERO_GUARDAR');
}

function crearProgramador({ archivo = path.join(__dirname, 'automatizaciones.json'), enviarComando, ahora = () => Date.now(), tickMs = 500 }) {
  if (typeof enviarComando !== 'function') throw new Error('Falta enviarComando');
  let trabajos = [];
  let ejecutando = false;

  function guardar() {
    const temporal = archivo + '.tmp';
    fs.writeFileSync(temporal, JSON.stringify(trabajos, null, 2), 'utf8');
    fs.renameSync(temporal, archivo);
  }

  try {
    const lectura = JSON.parse(fs.readFileSync(archivo, 'utf8'));
    if (Array.isArray(lectura)) trabajos = lectura.filter(item =>
      item && item.id && comandoPara(item.casa, item.dispositivo, item.accion)
    );
    // No abrir/cerrar mecanismos fuera de hora al volver de un apagón.
    // Los trabajos futuros sí se mantienen; los vencidos durante el apagón fallan.
    let cambios = false;
    trabajos.forEach(trabajo => {
      if (trabajo.estado === 'ejecutando' ||
          (trabajo.estado === 'pendiente' && Date.parse(trabajo.ejecutarEn) <= ahora())) {
        const interrumpida = trabajo.estado === 'ejecutando';
        trabajo.estado = 'error';
        trabajo.error = interrumpida
          ? 'El servidor se reinició durante la orden; comprueba el dispositivo.'
          : 'El tiempo venció mientras el servidor estaba detenido; no se envió la orden.';
        trabajo.finalizadaEn = new Date(ahora()).toISOString();
        cambios = true;
      }
    });
    if (cambios) guardar();
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }

  function listar() {
    return trabajos.slice().sort((a, b) => b.creadaEn.localeCompare(a.creadaEn));
  }

  function crear(datos) {
    const casa = Number(datos?.casa);
    const dispositivo = datos?.dispositivo;
    const accion = datos?.accion;
    const segundos = Number(datos?.segundos);
    const comando = comandoPara(casa, dispositivo, accion);
    if (!comando || !Number.isSafeInteger(segundos) || segundos < 1 || segundos > MAX_SEGUNDOS) {
      const error = new Error('Indica una casa (1-4), un dispositivo, una acción y de 1 segundo a 7 días.');
      error.codigo = 400;
      throw error;
    }
    if (trabajos.filter(t => t.estado === 'pendiente' || t.estado === 'ejecutando').length >= MAX_ACTIVAS) {
      const error = new Error('Hay demasiadas automatizaciones pendientes.');
      error.codigo = 409;
      throw error;
    }
    const instante = ahora();
    const trabajo = {
      id: crypto.randomUUID(), casa, dispositivo, accion, comando,
      segundos, creadaEn: new Date(instante).toISOString(),
      ejecutarEn: new Date(instante + segundos * 1000).toISOString(),
      estado: 'pendiente', error: null, finalizadaEn: null
    };
    trabajos.push(trabajo);
    // Retener pendientes y las últimas acciones ya finalizadas.
    const activas = trabajos.filter(t => t.estado === 'pendiente' || t.estado === 'ejecutando');
    const finalizadas = trabajos.filter(t => t.estado !== 'pendiente' && t.estado !== 'ejecutando')
      .sort((a, b) => b.creadaEn.localeCompare(a.creadaEn))
      .slice(0, MAX_REGISTROS - activas.length);
    trabajos = [...activas, ...finalizadas];
    guardar();
    return trabajo;
  }

  function cancelar(id) {
    const trabajo = trabajos.find(t => t.id === id);
    if (!trabajo) {
      const error = new Error('Automatización no encontrada.');
      error.codigo = 404;
      throw error;
    }
    if (trabajo.estado !== 'pendiente') {
      const error = new Error('Solo se pueden cancelar acciones pendientes.');
      error.codigo = 409;
      throw error;
    }
    trabajo.estado = 'cancelada';
    trabajo.finalizadaEn = new Date(ahora()).toISOString();
    guardar();
    return trabajo;
  }

  async function revisar() {
    if (ejecutando) return;
    const trabajo = trabajos
      .filter(t => t.estado === 'pendiente' && Date.parse(t.ejecutarEn) <= ahora())
      .sort((a, b) => a.ejecutarEn.localeCompare(b.ejecutarEn))[0];
    if (!trabajo) return;
    ejecutando = true;
    trabajo.estado = 'ejecutando';
    guardar();
    try {
      await enviarComando(trabajo.comando);
      trabajo.estado = 'completada';
      trabajo.error = null;
    } catch (error) {
      // Si una orden manual ocupa Arduino, conservar el trabajo sin ejecutarlo dos veces.
      if (error && error.codigo === 'OCUPADO') {
        trabajo.estado = 'pendiente';
      } else {
        trabajo.estado = 'error';
        trabajo.error = error?.message || 'No se pudo confirmar la orden en Arduino.';
      }
    } finally {
      if (trabajo.estado !== 'pendiente') trabajo.finalizadaEn = new Date(ahora()).toISOString();
      guardar();
      ejecutando = false;
    }
  }

  const intervalo = setInterval(() => {
    revisar().catch(err => console.error('[AUTOMATIZACIONES]', err));
  }, tickMs);
  if (typeof intervalo.unref === 'function') intervalo.unref();

  return { listar, crear, cancelar, revisar, detener: () => clearInterval(intervalo) };
}

module.exports = { crearProgramador, comandoPara };
