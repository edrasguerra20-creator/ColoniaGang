
import React, { useEffect, useRef, useState } from 'react';

import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  Alert
} from 'react-native';

import {
  Ionicons,
  MaterialCommunityIcons
} from '@expo/vector-icons';

import AsyncStorage from '@react-native-async-storage/async-storage';

import Login from './PANTALLAS/Login';
import Registro from './PANTALLAS/Registro';
import AutomatizacionCasa from './COMPONENTES/AutomatizacionCasa';
import Chatbot from './PANTALLAS/Chatbot';
import Historial from './PANTALLAS/Historial';

// ============================================
// COLONIA DOMOTICA
// ============================================

const CLAVE = '@ColoniaGang_Usuarios';
const CLAVE_HISTORIAL = '@ColoniaGang_Historial_v1';
const LIMITE_HISTORIAL = 100;

// Texto que se guarda cuando cambia un control de una casa.
function descripcionControlCasa(numero, componente, encendido) {
  const elemento = componente === 'luz'
    ? 'Luz'
    : componente === 'puerta'
      ? 'Puerta'
      : numero < 2 ? 'Ventana' : 'Tendedero';

  const estado = componente === 'luz'
    ? (encendido ? 'encendida' : 'apagada')
    : componente === 'puerta' || numero < 2 && componente === 'especial'
      ? (encendido ? 'abierta' : 'cerrada')
      : (encendido ? 'extendido' : 'guardado');

  return `${elemento} ${estado} — Casa ${numero + 1}`;
}

// IP DE LA COMPUTADORA
const URL_ARDUINO = 'http://192.168.0.8:3002';

// TIEMPO DE ESPERA
const ESPERA_APP = 30000;

// TODOS LOS BOTONES DE SERVOS HABILITADOS
const SERVOS_HABILITADOS = true;

// ============================================
// COMPONENTE DE CONTROL
// ============================================

function Control({
  nombre,
  icono,
  material = false,
  activo,
  textoActivo,
  textoInactivo,
  botonActivo,
  botonInactivo,
  accion,
  deshabilitado = false
}) {
  const Icono = material
    ? MaterialCommunityIcons
    : Ionicons;

  return (
    <View style={styles.control}>
      <View style={styles.iconoControl}>
        <Icono
          name={icono}
          size={25}
          color="#38BDF8"
        />
      </View>

      <View style={styles.controlInfo}>
        <Text style={styles.controlNombre}>
          {nombre}
        </Text>

        <Text style={styles.controlEstado}>
          {activo ? textoActivo : textoInactivo}
        </Text>
      </View>

      <TouchableOpacity
        style={[
          styles.botonControl,
          activo && styles.botonSecundario,
          deshabilitado && styles.botonDeshabilitado
        ]}
        onPress={accion}
        disabled={deshabilitado}
      >
        <Text style={styles.textoBlanco}>
          {activo ? botonActivo : botonInactivo}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ============================================
// APLICACION PRINCIPAL
// ============================================

export default function App() {

  // INICIO DE SESION
  const [usuario, setUsuario] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [tipoCuenta, setTipoCuenta] = useState('usuario');
  const [rol, setRol] = useState('');

  // REGISTRO
  const [mostrarRegistro, setMostrarRegistro] = useState(false);
  const [cuentas, setCuentas] = useState([]);
  const [cargando, setCargando] = useState(true);

  // NAVEGACION
  const [pestana, setPestana] = useState('inicio');
  const [casaAsignada, setCasaAsignada] = useState(0);
  const [nombreSesion, setNombreSesion] = useState('');

  // HISTORIAL: se conserva en el dispositivo, como en la versión original.
  const [historial, setHistorial] = useState([]);
  const historialActual = useRef([]);
  const colaGuardadoHistorial = useRef(Promise.resolve());

  const registrarActividad = (categoria, descripcion, casa = null, modo = 'Control físico') => {
    const actividad = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      fecha: new Date().toISOString(),
      usuario: usuario.trim().toLowerCase(),
      autor: nombreSesion || usuario,
      categoria, descripcion, casa, modo
    };
    const nuevas = [actividad, ...historialActual.current].slice(0, LIMITE_HISTORIAL);
    historialActual.current = nuevas;
    setHistorial(nuevas);
    colaGuardadoHistorial.current = colaGuardadoHistorial.current
      .catch(() => {})
      .then(() => AsyncStorage.setItem(CLAVE_HISTORIAL, JSON.stringify(nuevas)));
    colaGuardadoHistorial.current.catch(error => console.error('Error guardando historial:', error));
  };

  // PROGRAMACIONES COMPARTIDAS EN EL SERVIDOR DE ARDUINO.
  const [automatizaciones, setAutomatizaciones] = useState([]);
  const [errorAutomatizaciones, setErrorAutomatizaciones] = useState('');
  const completadasVistas = useRef(new Set());

  // ARDUINO
  const [enviando, setEnviando] = useState(false);
  const bloqueoEnvio = useRef(false);

  const [mensajesCasas, setMensajesCasas] = useState(
    Array(4).fill('Lista para enviar ordenes.')
  );

  const [mensajePostes, setMensajePostes] = useState(
    'Postes listos para recibir ordenes.'
  );

  // CUATRO CASAS
  const [casas, setCasas] = useState(
    Array.from({ length: 4 }, () => ({
      luz: false,
      puerta: false,
      especial: false
    }))
  );

  // SEIS POSTES
  const [postes, setPostes] = useState(
    Array(6).fill(false)
  );

  // ==========================================
  // CARGAR USUARIOS
  // ==========================================

  useEffect(() => {
    const cargarUsuarios = async () => {
      try {
        const guardados = await AsyncStorage.getItem(CLAVE);
        if (guardados) {
          const lista = JSON.parse(guardados);
          if (Array.isArray(lista)) {
            setCuentas(lista);
          }
        }
      } catch (error) {
        Alert.alert('Aviso', 'No se pudieron cargar los usuarios.');
      }
      try {
        const guardado = await AsyncStorage.getItem(CLAVE_HISTORIAL);
        if (guardado) {
          const lista = JSON.parse(guardado);
          if (Array.isArray(lista)) {
            const actividades = lista.slice(0, LIMITE_HISTORIAL);
            historialActual.current = actividades;
            setHistorial(actividades);
          }
        }
      } catch (error) {
        console.error('No se pudo cargar el historial:', error);
      } finally {
        setCargando(false);
      }
    };

    cargarUsuarios();
  }, []);

  useEffect(() => {
    if (!rol) return undefined;
    let activo = true;
    let consultando = false;
    const actualizar = async () => {
      if (consultando) return;
      consultando = true;
      const controlador = new AbortController();
      const finEspera = setTimeout(() => controlador.abort(), 6000);
      try {
        const respuesta = await fetch(URL_ARDUINO + '/automatizaciones', { signal: controlador.signal });
        const datos = await respuesta.json();
        if (!respuesta.ok || !datos.ok || !Array.isArray(datos.automatizaciones)) {
          throw new Error(datos.error || 'Respuesta incorrecta.');
        }
        if (!activo) return;
        setAutomatizaciones(datos.automatizaciones);
        setErrorAutomatizaciones('');
        // Actualizar los controles tras la confirmación de cada acción programada.
        for (const trabajo of datos.automatizaciones) {
          if (trabajo.estado !== 'completada' || completadasVistas.current.has(trabajo.id)) continue;
          completadasVistas.current.add(trabajo.id);
          const indice = trabajo.casa - 1;
          const encendido = trabajo.accion === 'activar';
          if (indice >= 0 && indice < 4 && ['luz', 'puerta', 'especial'].includes(trabajo.dispositivo)) {
            setCasas(anteriores => anteriores.map((casa, i) =>
              i === indice ? { ...casa, [trabajo.dispositivo]: encendido } : casa
            ));
            setMensajesCasas(anteriores => anteriores.map((mensaje, i) =>
              i === indice ? `Automatización confirmada: ${trabajo.comando}` : mensaje
            ));
          }
        }
      } catch (error) {
        if (activo) setErrorAutomatizaciones(error.name === 'AbortError'
          ? 'El servidor no responde.' : error.message);
      } finally {
        clearTimeout(finEspera);
        consultando = false;
      }
    };
    actualizar();
    const intervalo = setInterval(actualizar, 3000);
    return () => {
      activo = false;
      clearInterval(intervalo);
    };
  }, [rol]);

  const casasOcupadas = cuentas.map(
    cuenta => cuenta.casa
  );

  // ==========================================
  // REGISTRAR USUARIO
  // ==========================================

  const registrarUsuario = async (
    nombre,
    nuevoUsuario,
    nuevaContrasena,
    casaElegida
  ) => {

    const usuarioLimpio = nuevoUsuario
      .trim()
      .toLowerCase();

    if (
      !nombre.trim() ||
      !usuarioLimpio ||
      !nuevaContrasena
    ) {
      Alert.alert(
        'Error',
        'Completa todos los campos.'
      );
      return false;
    }

    const existe = cuentas.some(
      cuenta => cuenta.usuario === usuarioLimpio
    );

    if (
      existe ||
      usuarioLimpio === 'admin' ||
      usuarioLimpio === 'usuario'
    ) {
      Alert.alert(
        'Error',
        'Ese nombre de usuario ya existe.'
      );
      return false;
    }

    if (
      ![0, 1, 2, 3].includes(casaElegida) ||
      casasOcupadas.includes(casaElegida)
    ) {
      Alert.alert(
        'Casa ocupada',
        'Selecciona una casa disponible.'
      );
      return false;
    }

    const nuevaCuenta = {
      nombre: nombre.trim(),
      usuario: usuarioLimpio,
      contrasena: nuevaContrasena,
      casa: casaElegida
    };

    const listaNueva = [
      ...cuentas,
      nuevaCuenta
    ];

    try {
      await AsyncStorage.setItem(
        CLAVE,
        JSON.stringify(listaNueva)
      );

      setCuentas(listaNueva);
      setUsuario(usuarioLimpio);
      setContrasena('');
      setTipoCuenta('usuario');
      setMostrarRegistro(false);

      Alert.alert(
        'Cuenta creada',
        `¡Listo! Adquiriste la Casa ${casaElegida + 1}.`
      );

      return true;
    } catch (error) {
      Alert.alert(
        'Error',
        'No se pudo guardar la cuenta.'
      );
      return false;
    }
  };

  // ==========================================
  // INICIAR SESION
  // ==========================================

  const iniciarSesion = () => {
    const nombre = usuario.trim().toLowerCase();

    if (!nombre || !contrasena) {
      Alert.alert(
        'Error',
        'Ingresa tu usuario y contraseña.'
      );
      return;
    }

    // ADMINISTRADOR
    if (tipoCuenta === 'admin') {
      if (
        nombre === 'admin' &&
        contrasena === '1234'
      ) {
        setRol('admin');
        setNombreSesion('Administrador');
        setPestana('inicio');
      } else {
        Alert.alert(
          'Error',
          'Datos del administrador incorrectos.'
        );
      }
      return;
    }

    // USUARIO DE PRUEBA
    if (
      nombre === 'usuario' &&
      contrasena === '1234'
    ) {
      const casaLibre = [0, 1, 2, 3].find(
        i => !casasOcupadas.includes(i)
      );

      if (casaLibre === undefined) {
        Alert.alert(
          'Sin casas disponibles',
          'Ingresa con una cuenta registrada.'
        );
        return;
      }

      setRol('usuario');
      setCasaAsignada(casaLibre);
      setNombreSesion('Usuario de prueba');
      setPestana('inicio');
      return;
    }

    // USUARIO REGISTRADO
    const encontrada = cuentas.find(
      cuenta =>
        cuenta.usuario === nombre &&
        cuenta.contrasena === contrasena
    );

    if (!encontrada) {
      Alert.alert(
        'Error',
        'Usuario o contraseña incorrectos.'
      );
      return;
    }

    setRol('usuario');
    setCasaAsignada(encontrada.casa);
    setNombreSesion(encontrada.nombre);
    setPestana('inicio');
  };

  // ==========================================
  // CERRAR SESION
  // ==========================================

  const cerrarSesion = () => {
    setRol('');
    setUsuario('');
    setContrasena('');
    setTipoCuenta('usuario');
    setPestana('inicio');
    setNombreSesion('');
  };

  // ==========================================
  // ENVIAR ORDEN AL ARDUINO
  // ==========================================

  const enviarAlArduino = async comando => {
    const controlador = new AbortController();

    const temporizador = setTimeout(() => {
      controlador.abort();
    }, ESPERA_APP);

    try {
      const respuesta = await fetch(
        URL_ARDUINO + '/control',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            accion: comando
          }),
          signal: controlador.signal
        }
      );

      const datos = await respuesta.json();

      if (!respuesta.ok || datos.ok !== true) {
        throw new Error(
          datos.error ||
          'Arduino no confirmo la orden.'
        );
      }

      return datos;

    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error(
          'Se agotaron los 30 segundos de espera.'
        );
      }
      throw error;

    } finally {
      clearTimeout(temporizador);
    }
  };

  // ==========================================
  // PROGRAMAR O CANCELAR AUTOMATIZACIONES
  // ==========================================

  const solicitarAutomatizacion = async (ruta, metodo, cuerpo) => {
    const controlador = new AbortController();
    const finEspera = setTimeout(() => controlador.abort(), 10000);
    try {
      const respuesta = await fetch(URL_ARDUINO + ruta, {
        method: metodo,
        headers: { 'Content-Type': 'application/json' },
        ...(cuerpo ? { body: JSON.stringify(cuerpo) } : {}),
        signal: controlador.signal
      });
      const datos = await respuesta.json();
      if (!respuesta.ok || !datos.ok) throw new Error(datos.error || 'El servidor rechazó la solicitud.');
      return datos;
    } catch (error) {
      if (error.name === 'AbortError') throw new Error('Tiempo de espera agotado.');
      throw error;
    } finally {
      clearTimeout(finEspera);
    }
  };

  const crearAutomatizacion = async (numeroCasa, dispositivo, accion, segundos) => {
    if (rol !== 'admin' && !(rol === 'usuario' && numeroCasa === casaAsignada + 1)) {
      throw new Error('No tienes permiso para programar esta casa.');
    }
    const datos = await solicitarAutomatizacion('/automatizaciones', 'POST', {
      casa: numeroCasa, dispositivo, accion, segundos
    });
    setAutomatizaciones(anteriores => [datos.automatizacion, ...anteriores]);
    registrarActividad('casas', `Programó ${datos.automatizacion.comando} en ${segundos} s — Casa ${numeroCasa}`,
      numeroCasa, 'Automatización');
  };

  const cancelarAutomatizacion = async (id, numeroCasa) => {
    if (rol !== 'admin' && !(rol === 'usuario' && numeroCasa === casaAsignada + 1)) {
      throw new Error('No tienes permiso para cancelar esta casa.');
    }
    const datos = await solicitarAutomatizacion(`/automatizaciones/${id}`, 'DELETE');
    setAutomatizaciones(anteriores => anteriores.map(item =>
      item.id === id ? datos.automatizacion : item
    ));
    registrarActividad('casas', `Canceló programación — Casa ${numeroCasa}`,
      numeroCasa, 'Automatización');
  };

  // ==========================================
  // CONTROLAR LAS CUATRO CASAS
  // ==========================================

  const cambiarCasa = async (numero, componente) => {

    // PERMISOS
    if (
      rol !== 'admin' &&
      !(rol === 'usuario' && numero === casaAsignada)
    ) {
      return;
    }

    if (bloqueoEnvio.current) {
      return;
    }

    // TODOS LOS SERVOS HABILITADOS EN LA APP
    if (
      componente !== 'luz' &&
      !SERVOS_HABILITADOS
    ) {
      Alert.alert(
        'Servomotores desactivados',
        'Activa los servomotores para continuar.'
      );
      return;
    }

    const nuevoEstado = !casas[numero][componente];
    const prefijo = `CASA${numero + 1}_`;

    let comando = '';

    // LUCES
    if (componente === 'luz') {
      comando = prefijo + (
        nuevoEstado ? 'LUZ_ON' : 'LUZ_OFF'
      );
    }

    // PUERTAS
    if (componente === 'puerta') {
      comando = prefijo + (
        nuevoEstado
          ? 'PUERTA_ABRIR'
          : 'PUERTA_CERRAR'
      );
    }

    // VENTANAS Y TENDEDEROS
    if (componente === 'especial') {
      comando = numero < 2
        ? prefijo + (
            nuevoEstado
              ? 'VENTANA_ABRIR'
              : 'VENTANA_CERRAR'
          )
        : prefijo + (
            nuevoEstado
              ? 'TENDEDERO_EXTENDER'
              : 'TENDEDERO_GUARDAR'
          );
    }

    if (!comando) {
      return;
    }

    bloqueoEnvio.current = true;
    setEnviando(true);

    setMensajesCasas(anteriores =>
      anteriores.map((mensaje, i) =>
        i === numero
          ? `Enviando ${comando}...`
          : mensaje
      )
    );

    try {
      await enviarAlArduino(comando);

      // ACTUALIZAR SOLO CON CONFIRMACION
      setCasas(anteriores =>
        anteriores.map((casa, i) =>
          i === numero
            ? {
                ...casa,
                [componente]: nuevoEstado
              }
            : casa
        )
      );

      setMensajesCasas(anteriores =>
        anteriores.map((mensaje, i) =>
          i === numero
            ? `Arduino confirmo: ${comando}`
            : mensaje
        )
      );
      registrarActividad('casas', descripcionControlCasa(numero, componente, nuevoEstado),
        numero + 1, 'Orden confirmada por Arduino');

    } catch (error) {
      setMensajesCasas(anteriores =>
        anteriores.map((mensaje, i) =>
          i === numero
            ? `No confirmado: ${error.message}`
            : mensaje
        )
      );

      Alert.alert(
        `Casa ${numero + 1}: orden no confirmada`,
        error.message
      );

    } finally {
      bloqueoEnvio.current = false;
      setEnviando(false);
    }
  };

  // ==========================================
  // CONTROLAR TODOS LOS POSTES
  // ==========================================

  const cambiarTodosPostes = async encender => {
    if (rol !== 'admin' || bloqueoEnvio.current) {
      return;
    }

    const comando =
      `POSTES_TODOS_${encender ? 'ON' : 'OFF'}`;

    bloqueoEnvio.current = true;
    setEnviando(true);
    setMensajePostes(`Enviando ${comando}...`);

    try {
      await enviarAlArduino(comando);

      setPostes(
        Array(6).fill(encender)
      );

      setMensajePostes(
        `Arduino confirmo: ${comando}`
      );
      registrarActividad('postes', `Se ordenó ${encender ? 'encender' : 'apagar'} los 6 postes`,
        null, 'Orden confirmada por Arduino');

    } catch (error) {
      setMensajePostes(
        `No confirmado: ${error.message}`
      );

      Alert.alert(
        'Postes: orden no confirmada',
        error.message
      );

    } finally {
      bloqueoEnvio.current = false;
      setEnviando(false);
    }
  };

  // ==========================================
  // MOSTRAR CONTROLES DE UNA CASA
  // ==========================================

  const mostrarCasa = numero => {
    const casa = casas[numero];
    const ventana = numero < 2;

    const residente = cuentas.find(
      cuenta => cuenta.casa === numero
    );

    return (
      <View style={styles.tarjeta} key={numero}>

        <View style={styles.tituloCasa}>
          <Ionicons
            name="home-outline"
            size={29}
            color="#38BDF8"
          />

          <View style={{ flex: 1 }}>
            <Text style={styles.tituloTarjeta}>
              Casa {numero + 1}
              {numero === 3 ? ' Premium' : ''}
            </Text>

            <Text style={styles.descripcion}>
              {rol === 'admin'
                ? residente
                  ? `Residente: ${residente.nombre}`
                  : 'Disponible'
                : 'Tu vivienda asignada'}
            </Text>
          </View>
        </View>

        <View style={styles.avisoCasaFisica}>
          <Ionicons
            name="hardware-chip-outline"
            size={19}
            color="#7DD3FC"
          />

          <Text style={styles.textoAvisoCasaFisica}>
            Control físico de la Casa {numero + 1}
          </Text>
        </View>

        {/* LUZ */}

        <Control
          nombre="Iluminación"
          icono={casa.luz ? 'bulb' : 'bulb-outline'}
          activo={casa.luz}
          textoActivo="Encendida"
          textoInactivo="Apagada"
          botonActivo="Apagar"
          botonInactivo="Encender"
          accion={() => cambiarCasa(numero, 'luz')}
          deshabilitado={enviando}
        />

        {/* PUERTA */}

        <Control
          nombre="Puerta"
          icono={casa.puerta ? 'door-open' : 'door-closed'}
          material={true}
          activo={casa.puerta}
          textoActivo="Abierta"
          textoInactivo="Cerrada"
          botonActivo="Cerrar"
          botonInactivo="Abrir"
          accion={() => cambiarCasa(numero, 'puerta')}
          deshabilitado={
            enviando || !SERVOS_HABILITADOS
          }
        />

        {/* VENTANA O TENDEDERO */}

        <Control
          nombre={ventana ? 'Ventana' : 'Tendedero'}
          icono={
            ventana
              ? casa.especial
                ? 'window-open'
                : 'window-closed'
              : 'shirt-outline'
          }
          material={ventana}
          activo={casa.especial}
          textoActivo={
            ventana ? 'Abierta' : 'Extendido'
          }
          textoInactivo={
            ventana ? 'Cerrada' : 'Guardado'
          }
          botonActivo={
            ventana ? 'Cerrar' : 'Guardar'
          }
          botonInactivo={
            ventana ? 'Abrir' : 'Extender'
          }
          accion={() => cambiarCasa(numero, 'especial')}
          deshabilitado={
            enviando || !SERVOS_HABILITADOS
          }
        />

        {/* ESTADO */}

        {enviando && (
          <ActivityIndicator
            color="#38BDF8"
            style={{ marginTop: 12 }}
          />
        )}

        <Text style={styles.mensajeArduino}>
          {mensajesCasas[numero]}
        </Text>

        <Text style={styles.notaSimulacion}>
          El estado se actualiza cuando Arduino
          confirma la orden. Esto no comprueba
          la posición física del mecanismo.
        </Text>

        <AutomatizacionCasa
          casa={numero + 1}
          trabajos={automatizaciones.filter(item => item.casa === numero + 1)}
          onCrear={crearAutomatizacion}
          onCancelar={cancelarAutomatizacion}
          errorConexion={errorAutomatizaciones}
        />

      </View>
    );
  };

  // ==========================================
  // PANTALLA DE CARGA
  // ==========================================

  if (cargando) {
    return (
      <View style={styles.centrado}>
        <ActivityIndicator
          size="large"
          color="#38BDF8"
        />

        <Text style={styles.descripcion}>
          Cargando colonia...
        </Text>
      </View>
    );
  }

  // ==========================================
  // REGISTRO
  // ==========================================

  if (rol === '' && mostrarRegistro) {
    return (
      <Registro
        registrar={registrarUsuario}
        casasOcupadas={casasOcupadas}
        volver={() => setMostrarRegistro(false)}
      />
    );
  }

  // ==========================================
  // LOGIN
  // ==========================================

  if (rol === '') {
    return (
      <Login
        usuario={usuario}
        setUsuario={setUsuario}
        contrasena={contrasena}
        setContrasena={setContrasena}
        tipoCuenta={tipoCuenta}
        setTipoCuenta={setTipoCuenta}
        iniciarSesion={iniciarSesion}
        irRegistro={() => setMostrarRegistro(true)}
      />
    );
  }

  // ==========================================
  // DATOS DEL PANEL
  // ==========================================

  const lucesEncendidas = casas.filter(
    casa => casa.luz
  ).length;

  const postesEncendidos = postes.filter(Boolean).length;
  const miCasa = casas[casaAsignada];

  const menu = rol === 'admin'
    ? [
        {
          id: 'inicio',
          nombre: 'Inicio',
          icono: 'grid-outline'
        },
        {
          id: 'casas',
          nombre: 'Casas',
          icono: 'home-outline'
        },
        {
          id: 'postes',
          nombre: 'Postes',
          icono: 'bulb-outline'
        },
        { id: 'historial', nombre: 'Historial', icono: 'time-outline' }
      ]
    : [
        {
          id: 'inicio',
          nombre: 'Inicio',
          icono: 'home-outline'
        },
        {
          id: 'casa',
          nombre: 'Mi casa',
          icono: 'options-outline'
        },
        {
          id: 'perfil',
          nombre: 'Mi perfil',
          icono: 'person-outline'
        },
        { id: 'historial', nombre: 'Historial', icono: 'time-outline' }
      ];

  // ==========================================
  // INTERFAZ PRINCIPAL
  // ==========================================

  return (
    <View style={styles.fondo}>

      <StatusBar
        barStyle="light-content"
        backgroundColor="#080F1D"
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.contenido}
      >

        {/* ENCABEZADO */}

        <View style={styles.encabezado}>

          <View style={styles.logo}>
            <Ionicons
              name="home-outline"
              size={28}
              color="#FFFFFF"
            />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.titulo}>
              Colonia Domótica
            </Text>

            <Text style={styles.descripcion}>
              {rol === 'admin'
                ? 'Panel de administrador'
                : `Bienvenido, ${nombreSesion}`}
            </Text>
          </View>

          <TouchableOpacity onPress={cerrarSesion}>
            <Ionicons
              name="log-out-outline"
              size={27}
              color="#DC2626"
            />
          </TouchableOpacity>

        </View>

        {/* ADMINISTRADOR - INICIO */}

        {rol === 'admin' && pestana === 'inicio' && (
          <View>

            <Text style={styles.seccion}>
              Resumen de la colonia
            </Text>

            <View style={styles.resumen}>
              {[
                ['4', 'Casas'],
                [String(cuentas.length), 'Ocupadas'],
                [String(lucesEncendidas), 'Luces encendidas'],
                [String(postesEncendidos), 'Postes encendidos']
              ].map(([numero, etiqueta]) => (
                <View
                  key={etiqueta}
                  style={styles.dato}
                >
                  <Text style={styles.numero}>
                    {numero}
                  </Text>

                  <Text style={styles.descripcion}>
                    {etiqueta}
                  </Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={styles.botonGrande}
              onPress={() => setPestana('casas')}
            >
              <Ionicons
                name="home-outline"
                size={21}
                color="#FFFFFF"
              />

              <Text style={styles.textoBlanco}>
                Administrar casas
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.botonGrande}
              onPress={() => setPestana('postes')}
            >
              <Ionicons
                name="bulb-outline"
                size={21}
                color="#FFFFFF"
              />

              <Text style={styles.textoBlanco}>
                Controlar postes
              </Text>
            </TouchableOpacity>

          </View>
        )}

        {/* ADMINISTRADOR - CASAS */}

        {rol === 'admin' && pestana === 'casas' && (
          <View>
            <Text style={styles.seccion}>
              Casas inteligentes
            </Text>

            {casas.map((casa, i) => mostrarCasa(i))}
          </View>
        )}

        {/* ADMINISTRADOR - POSTES */}

        {rol === 'admin' && pestana === 'postes' && (
          <View>
            <Text style={styles.seccion}>
              Alumbrado público
            </Text>

            <View style={styles.tarjeta}>

              {/* Estado informativo: no se permite controlar postes por separado. */}
              {postes.map((encendido, i) => (
                <View key={i} style={styles.control}>
                  <View style={styles.iconoControl}>
                    <Ionicons
                      name={encendido ? 'bulb' : 'bulb-outline'}
                      size={25}
                      color="#38BDF8"
                    />
                  </View>
                  <View style={styles.controlInfo}>
                    <Text style={styles.controlNombre}>
                      Poste {i + 1}
                    </Text>
                    <Text style={styles.controlEstado}>
                      {encendido ? 'Encendido' : 'Apagado'}
                    </Text>
                  </View>
                </View>
              ))}

              <TouchableOpacity
                style={[
                  styles.botonGrande,
                  enviando && styles.botonDeshabilitado
                ]}
                onPress={() => cambiarTodosPostes(true)}
                disabled={enviando}
              >
                <Text style={styles.textoBlanco}>
                  Encender todos
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.botonGrande,
                  enviando && styles.botonDeshabilitado
                ]}
                onPress={() => cambiarTodosPostes(false)}
                disabled={enviando}
              >
                <Text style={styles.textoBlanco}>
                  Apagar todos
                </Text>
              </TouchableOpacity>

              {enviando && (
                <ActivityIndicator
                  color="#38BDF8"
                  style={{ marginTop: 12 }}
                />
              )}

              <Text style={styles.mensajeArduino}>
                {mensajePostes}
              </Text>

            </View>
          </View>
        )}

        {/* HISTORIAL: ADMIN VE TODO; RESIDENTE SOLO SUS ACCIONES */}
        {pestana === 'historial' && (
          <Historial
            actividades={rol === 'admin'
              ? historial
              : historial.filter(actividad =>
                  actividad.usuario === usuario.trim().toLowerCase() &&
                  actividad.categoria === 'casas'
                )}
            esAdmin={rol === 'admin'}
          />
        )}

        {/* USUARIO - INICIO */}

        {rol === 'usuario' && pestana === 'inicio' && (
          <View>
            <Text style={styles.seccion}>
              Mi vivienda inteligente
            </Text>

            <View style={styles.tarjeta}>

              <Ionicons
                name="home-outline"
                size={44}
                color="#38BDF8"
              />

              <Text style={styles.tituloTarjeta}>
                Casa {casaAsignada + 1}
              </Text>

              <Text style={styles.descripcion}>
                Luz: {miCasa.luz ? 'Encendida' : 'Apagada'}
              </Text>

              <Text style={styles.descripcion}>
                Puerta: {miCasa.puerta ? 'Abierta' : 'Cerrada'}
              </Text>

              <TouchableOpacity
                style={styles.botonGrande}
                onPress={() => setPestana('casa')}
              >
                <Ionicons
                  name="options-outline"
                  size={21}
                  color="#FFFFFF"
                />

                <Text style={styles.textoBlanco}>
                  Controlar mi casa
                </Text>
              </TouchableOpacity>

            </View>
          </View>
        )}

        {/* USUARIO - MI CASA */}

        {rol === 'usuario' && pestana === 'casa' && (
          <View>
            <Text style={styles.seccion}>
              Controles de mi casa
            </Text>

            {mostrarCasa(casaAsignada)}
          </View>
        )}

        {/* USUARIO - PERFIL */}

        {rol === 'usuario' && pestana === 'perfil' && (
          <View>
            <Text style={styles.seccion}>
              Mi perfil
            </Text>

            <View style={styles.tarjeta}>

              <Ionicons
                name="person-circle-outline"
                size={60}
                color="#38BDF8"
              />

              <Text style={styles.tituloTarjeta}>
                {nombreSesion}
              </Text>

              <Text style={styles.descripcion}>
                Usuario: {usuario}
              </Text>

              <Text style={styles.descripcion}>
                Rol: Residente
              </Text>

              <Text style={styles.descripcion}>
                Casa asignada: {casaAsignada + 1}
              </Text>

              <TouchableOpacity
                style={[
                  styles.botonGrande,
                  { backgroundColor: '#DC2626' }
                ]}
                onPress={cerrarSesion}
              >
                <Ionicons
                  name="log-out-outline"
                  size={21}
                  color="#FFFFFF"
                />

                <Text style={styles.textoBlanco}>
                  Cerrar sesión
                </Text>
              </TouchableOpacity>

            </View>
          </View>
        )}

      </ScrollView>

      {/* BARRA DE NAVEGACION */}

      <View style={styles.barra}>
        {menu.map(item => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.pestana,
              pestana === item.id && styles.pestanaActiva
            ]}
            onPress={() => setPestana(item.id)}
          >
            <Ionicons
              name={item.icono}
              size={24}
              color={
                pestana === item.id
                  ? '#7DD3FC'
                  : '#94A3B8'
              }
            />

            <Text
              style={[
                styles.textoPestana,
                pestana === item.id && styles.textoActivo
              ]}
            >
              {item.nombre}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* DOMOTIBOT IA */}

      <Chatbot
        rol={rol}
        casas={casas}
        postes={postes}
        casaAsignada={casaAsignada}
      />

    </View>
  );
}

// ============================================
// ESTILOS
// ============================================

const styles = StyleSheet.create({

  fondo: {
    flex: 1,
    backgroundColor: '#080F1D'
  },

  contenido: {
    padding: 18,
    paddingTop: 44,
    paddingBottom: 110
  },

  centrado: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#080F1D'
  },

  encabezado: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
    gap: 13,
    backgroundColor: '#111C2E',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#22334D'
  },

  logo: {
    backgroundColor: '#087EAA',
    padding: 13,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#38BDF8'
  },

  titulo: {
    color: '#F1F7FF',
    fontSize: 21,
    fontWeight: 'bold'
  },

  seccion: {
    color: '#F1F7FF',
    fontSize: 23,
    fontWeight: 'bold',
    marginBottom: 16
  },

  descripcion: {
    color: '#9AAFC8',
    fontSize: 13,
    marginTop: 5
  },

  tarjeta: {
    backgroundColor: '#111C2E',
    padding: 18,
    borderRadius: 19,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#22334D',
    elevation: 5,
    shadowColor: '#000000',
    shadowOpacity: 0.22,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 5
    }
  },

  tituloCasa: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14
  },

  tituloTarjeta: {
    color: '#F1F7FF',
    fontSize: 19,
    fontWeight: 'bold',
    marginTop: 6
  },

  control: {
    borderTopWidth: 1,
    borderTopColor: '#26364D',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 9
  },

  iconoControl: {
    backgroundColor: '#102D43',
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#1D526F'
  },

  controlInfo: {
    flex: 1
  },

  controlNombre: {
    color: '#E7F0FC',
    fontWeight: 'bold',
    fontSize: 14
  },

  controlEstado: {
    color: '#91A6C0',
    fontSize: 12,
    marginTop: 4
  },

  botonControl: {
    backgroundColor: '#087EAA',
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 11,
    minWidth: 78,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#38BDF8'
  },

  botonSecundario: {
    backgroundColor: '#26364D',
    borderColor: '#40536D'
  },

  botonDeshabilitado: {
    opacity: 0.55
  },

  avisoCasaFisica: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#102D43',
    borderRadius: 12,
    padding: 11,
    gap: 8,
    marginBottom: 9,
    borderWidth: 1,
    borderColor: '#1D526F'
  },

  textoAvisoCasaFisica: {
    color: '#7DD3FC',
    fontWeight: 'bold',
    fontSize: 12,
    flex: 1
  },

  notaSimulacion: {
    color: '#91A6C0',
    fontSize: 12,
    marginTop: 8,
    marginBottom: 8,
    lineHeight: 18
  },

  mensajeArduino: {
    color: '#7DD3FC',
    fontSize: 13,
    marginTop: 13,
    fontWeight: 'bold'
  },

  textoBlanco: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold'
  },

  botonGrande: {
    backgroundColor: '#087EAA',
    padding: 15,
    borderRadius: 13,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 9,
    marginTop: 13,
    borderWidth: 1,
    borderColor: '#38BDF8'
  },

  resumen: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },

  dato: {
    backgroundColor: '#111C2E',
    padding: 18,
    borderRadius: 17,
    width: '48%',
    marginBottom: 13,
    borderWidth: 1,
    borderColor: '#22334D'
  },

  numero: {
    color: '#38BDF8',
    fontSize: 28,
    fontWeight: 'bold'
  },

  barra: {
    flexDirection: 'row',
    backgroundColor: '#0D1727',
    borderTopWidth: 1,
    borderTopColor: '#26364D',
    paddingTop: 10,
    paddingBottom: 15,
    paddingHorizontal: 5
  },

  pestana: {
    flex: 1,
    alignItems: 'center',
    padding: 9,
    borderRadius: 13
  },

  pestanaActiva: {
    backgroundColor: '#12344B',
    borderWidth: 1,
    borderColor: '#1D526F'
  },

  textoPestana: {
    color: '#8295AE',
    fontWeight: 'bold',
    fontSize: 12,
    marginTop: 4
  },

  textoActivo: {
    color: '#7DD3FC'
  }

});
