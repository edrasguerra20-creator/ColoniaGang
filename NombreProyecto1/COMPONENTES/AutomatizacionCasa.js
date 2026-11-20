import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const UNIDADES = [
  { id: 'segundos', titulo: 'Segundos', factor: 1 },
  { id: 'minutos', titulo: 'Minutos', factor: 60 },
  { id: 'horas', titulo: 'Horas', factor: 3600 }
];

function nombreDispositivo(casa, dispositivo) {
  if (dispositivo === 'luz') return 'Luces';
  if (dispositivo === 'puerta') return 'Puerta';
  return casa <= 2 ? 'Ventana' : 'Tendedero';
}

function nombreAccion(casa, dispositivo, accion) {
  const activar = accion === 'activar';
  if (dispositivo === 'luz') return activar ? 'Encender' : 'Apagar';
  if (dispositivo === 'especial' && casa >= 3) return activar ? 'Extender' : 'Guardar';
  return activar ? 'Abrir' : 'Cerrar';
}

function cuentaAtras(fecha, ahora) {
  const restante = Math.max(0, Math.ceil((Date.parse(fecha) - ahora) / 1000));
  const horas = Math.floor(restante / 3600);
  const minutos = Math.floor((restante % 3600) / 60);
  const segundos = restante % 60;
  return horas ? `${horas} h ${minutos} min ${segundos} s` :
    minutos ? `${minutos} min ${segundos} s` : `${segundos} s`;
}

function Selector({ opciones, valor, cambiar }) {
  return (
    <View style={styles.opciones}>
      {opciones.map(opcion => (
        <TouchableOpacity
          key={opcion.id}
          onPress={() => cambiar(opcion.id)}
          style={[styles.opcion, valor === opcion.id && styles.opcionActiva]}
          accessibilityRole="button"
          accessibilityState={{ selected: valor === opcion.id }}
        >
          <Text style={[styles.textoOpcion, valor === opcion.id && styles.textoOpcionActiva]}>
            {opcion.titulo}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function AutomatizacionCasa({ casa, trabajos, onCrear, onCancelar, errorConexion }) {
  const [abierto, setAbierto] = useState(false);
  const [dispositivo, setDispositivo] = useState('luz');
  const [accion, setAccion] = useState('activar');
  const [duracion, setDuracion] = useState('1');
  const [unidad, setUnidad] = useState('minutos');
  const [ocupado, setOcupado] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [ahora, setAhora] = useState(Date.now());

  useEffect(() => {
    if (!abierto) return undefined;
    const intervalo = setInterval(() => setAhora(Date.now()), 1000);
    return () => clearInterval(intervalo);
  }, [abierto]);

  const dispositivos = [
    { id: 'luz', titulo: 'Luces' },
    { id: 'puerta', titulo: 'Puerta' },
    { id: 'especial', titulo: casa <= 2 ? 'Ventana' : 'Tendedero' }
  ];
  const acciones = [
    { id: 'activar', titulo: nombreAccion(casa, dispositivo, 'activar') },
    { id: 'desactivar', titulo: nombreAccion(casa, dispositivo, 'desactivar') }
  ];
  const pendientes = trabajos.filter(item => item.estado === 'pendiente' || item.estado === 'ejecutando');
  const recientes = trabajos.filter(item => item.estado !== 'pendiente' && item.estado !== 'ejecutando').slice(0, 3);

  const programar = async () => {
    const valor = Number(duracion.trim());
    const multiplicador = UNIDADES.find(item => item.id === unidad).factor;
    const segundos = valor * multiplicador;
    if (!Number.isSafeInteger(segundos) || segundos < 1 || segundos > 604800) {
      setMensaje('Ingresa un número entero válido (máximo 7 días).');
      return;
    }
    setOcupado(true);
    setMensaje('');
    try {
      await onCrear(casa, dispositivo, accion, segundos);
      setMensaje('Automatización guardada en el servidor.');
    } catch (error) {
      setMensaje(`No se programó: ${error.message}`);
    } finally {
      setOcupado(false);
    }
  };

  const cancelar = async id => {
    setOcupado(true);
    setMensaje('');
    try {
      await onCancelar(id, casa);
      setMensaje('Automatización cancelada.');
    } catch (error) {
      setMensaje(`No se canceló: ${error.message}`);
    } finally {
      setOcupado(false);
    }
  };

  return (
    <View style={styles.contenedor}>
      <TouchableOpacity
        style={styles.cabecera}
        onPress={() => setAbierto(!abierto)}
        accessibilityRole="button"
        accessibilityLabel={`Automatizaciones de la casa ${casa}`}
      >
        <Ionicons name="timer-outline" size={21} color="#7DD3FC" />
        <View style={{ flex: 1 }}>
          <Text style={styles.titulo}>Automatizar dispositivos</Text>
          <Text style={styles.subtitulo}>
            {pendientes.length ? `${pendientes.length} programación(es) pendiente(s)` : 'Programar encendido, apagado o movimiento'}
          </Text>
        </View>
        <Ionicons name={abierto ? 'chevron-up' : 'chevron-down'} size={20} color="#A5B4C9" />
      </TouchableOpacity>

      {abierto && (
        <View style={styles.formulario}>
          <Text style={styles.etiqueta}>1. ¿Qué dispositivo quieres controlar?</Text>
          <Selector opciones={dispositivos} valor={dispositivo} cambiar={valor => { setDispositivo(valor); setAccion('activar'); }} />

          <Text style={styles.etiqueta}>2. ¿Qué debe hacer?</Text>
          <Selector opciones={acciones} valor={accion} cambiar={setAccion} />

          <Text style={styles.etiqueta}>3. ¿Después de cuánto tiempo?</Text>
          <TextInput
            style={styles.entrada}
            value={duracion}
            onChangeText={setDuracion}
            keyboardType="number-pad"
            maxLength={7}
            placeholder="Ejemplo: 10"
            placeholderTextColor="#75869F"
            accessibilityLabel="Cantidad de tiempo"
          />
          <Selector opciones={UNIDADES} valor={unidad} cambiar={setUnidad} />

          <TouchableOpacity
            style={[styles.botonProgramar, ocupado && styles.deshabilitado]}
            onPress={programar}
            disabled={ocupado}
            accessibilityRole="button"
          >
            {ocupado ? <ActivityIndicator color="#FFFFFF" /> : <Ionicons name="calendar-outline" size={19} color="#FFFFFF" />}
            <Text style={styles.textoBoton}>Guardar automatización</Text>
          </TouchableOpacity>

          {mensaje ? <Text style={styles.mensaje}>{mensaje}</Text> : null}
          {errorConexion ? <Text style={styles.error}>Sin conexión con el servidor: {errorConexion}</Text> : null}
          <Text style={styles.advertencia}>
            El tiempo se cuenta en la computadora del servidor. La acción requiere que Node.js y Arduino sigan funcionando.
          </Text>

          {(pendientes.length > 0 || recientes.length > 0) && (
            <>
              <Text style={styles.encabezadoLista}>Programaciones de esta casa</Text>
              {[...pendientes, ...recientes].map(trabajo => (
                <View key={trabajo.id} style={styles.trabajo}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.nombreTrabajo}>
                      {nombreAccion(casa, trabajo.dispositivo, trabajo.accion)} {nombreDispositivo(casa, trabajo.dispositivo).toLowerCase()}
                    </Text>
                    <Text style={styles.detalleTrabajo}>
                      {trabajo.estado === 'pendiente'
                        ? `En ${cuentaAtras(trabajo.ejecutarEn, ahora)}`
                        : trabajo.estado === 'ejecutando'
                          ? 'Enviando orden a Arduino...'
                          : trabajo.estado === 'completada'
                            ? 'Orden confirmada por Arduino'
                            : trabajo.estado === 'cancelada'
                              ? 'Cancelada'
                              : `Error: ${trabajo.error || 'Sin confirmación'}`}
                    </Text>
                  </View>
                  {trabajo.estado === 'pendiente' && (
                    <TouchableOpacity
                      style={styles.botonCancelar}
                      onPress={() => cancelar(trabajo.id)}
                      disabled={ocupado}
                      accessibilityRole="button"
                    >
                      <Text style={styles.textoCancelar}>Cancelar</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { marginTop: 15, borderRadius: 14, backgroundColor: '#0D2234', borderWidth: 1, borderColor: '#23506A' },
  cabecera: { padding: 13, flexDirection: 'row', gap: 10, alignItems: 'center' },
  titulo: { color: '#F0F7FF', fontSize: 15, fontWeight: 'bold' },
  subtitulo: { color: '#9CB2C9', fontSize: 11, marginTop: 4 },
  formulario: { paddingHorizontal: 13, paddingBottom: 15 },
  etiqueta: { color: '#DAE9F7', fontSize: 13, marginTop: 13, marginBottom: 8, fontWeight: '600' },
  opciones: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  opcion: { paddingVertical: 9, paddingHorizontal: 10, borderRadius: 9, borderWidth: 1, borderColor: '#3B5168', backgroundColor: '#172B40' },
  opcionActiva: { backgroundColor: '#087EAA', borderColor: '#38BDF8' },
  textoOpcion: { color: '#B8C9DA', fontSize: 12, fontWeight: '600' },
  textoOpcionActiva: { color: '#FFFFFF' },
  entrada: { borderWidth: 1, borderColor: '#44617A', borderRadius: 10, backgroundColor: '#111C2E', color: '#FFFFFF', fontSize: 19, paddingHorizontal: 13, paddingVertical: 10, marginBottom: 9 },
  botonProgramar: { marginTop: 16, padding: 13, borderRadius: 10, backgroundColor: '#087EAA', borderWidth: 1, borderColor: '#38BDF8', flexDirection: 'row', gap: 9, justifyContent: 'center', alignItems: 'center' },
  textoBoton: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 13 },
  deshabilitado: { opacity: 0.5 },
  mensaje: { color: '#7DD3FC', marginTop: 10, fontSize: 12 },
  error: { color: '#FDA4AF', marginTop: 10, fontSize: 12 },
  advertencia: { color: '#8FA6BF', marginTop: 12, fontSize: 11, lineHeight: 17 },
  encabezadoLista: { color: '#EAF4FF', fontSize: 13, fontWeight: 'bold', marginTop: 18, marginBottom: 7 },
  trabajo: { flexDirection: 'row', paddingVertical: 10, gap: 8, alignItems: 'center', borderTopColor: '#294058', borderTopWidth: 1 },
  nombreTrabajo: { color: '#E3EFFE', fontSize: 13, fontWeight: '600' },
  detalleTrabajo: { color: '#A7B9CA', fontSize: 11, marginTop: 4 },
  botonCancelar: { borderWidth: 1, borderColor: '#FB7185', borderRadius: 9, padding: 8 },
  textoCancelar: { color: '#FDA4AF', fontWeight: 'bold', fontSize: 11 }
});
