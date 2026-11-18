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
import Chatbot from './PANTALLAS/Chatbot';
import Historial from './PANTALLAS/Historial';

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

// IMPORTANTE:
// COLOCA AQUI LA IP ACTUAL DE TU COMPUTADORA.
// USA LA MISMA IP CON LA QUE YA TE FUNCIONO.
const URL_CASA1 = 'http://192.168.0.8:3002';

// COMPONENTE DE CONTROL
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

// APLICACION PRINCIPAL
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

  // HISTORIAL DE ACTIVIDADES
  const [historial, setHistorial] = useState([]);
  const historialActual = useRef([]);
  const colaGuardadoHistorial = useRef(Promise.resolve());

  const registrarActividad = (categoria, descripcion, casa = null, modo = 'Simulación') => {
    const actividad = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      fecha: new Date().toISOString(),
      usuario: usuario.trim().toLowerCase(),
      autor: nombreSesion,
      categoria,
      descripcion,
      casa,
      modo
    };

    const actualizadas = [actividad, ...historialActual.current]
      .slice(0, LIMITE_HISTORIAL);

    historialActual.current = actualizadas;
    setHistorial(actualizadas);

    // Guardar en orden para no perder eventos al pulsar rápido varios controles.
    colaGuardadoHistorial.current = colaGuardadoHistorial.current
      .catch(() => {})
      .then(() => AsyncStorage.setItem(
        CLAVE_HISTORIAL,
        JSON.stringify(actualizadas)
      ));

    colaGuardadoHistorial.current.catch(error => {
      console.error('No se pudo guardar el historial:', error);
      Alert.alert(
        'Historial no guardado',
        'La actividad aparece en pantalla, pero no se pudo guardar en este dispositivo.'
      );
    });
  };

  // CONEXION CON ARDUINO
  const [enviandoCasa1, setEnviandoCasa1] = useState(false);
  const [mensajeCasa1, setMensajeCasa1] = useState(
    'Sistema preparado para controlar la Casa 1.'
  );

  const bloqueoEnvio = useRef(false);

  // CUATRO CASAS
  const [casas, setCasas] = useState([
    { luz: false, puerta: false, especial: false },
    { luz: false, puerta: false, especial: false },
    { luz: false, puerta: false, especial: false },
    { luz: false, puerta: false, especial: false }
  ]);

  // SEIS POSTES
  const [postes, setPostes] = useState([
    false, false, false, false, false, false
  ]);

  // CARGAR USUARIOS E HISTORIAL GUARDADOS
  useEffect(() => {
    async function cargarDatos() {
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
        Alert.alert('Aviso', 'No se pudo cargar el historial de actividades.');
      } finally {
        setCargando(false);
      }
    }

    cargarDatos();
  }, []);

  // CASAS OCUPADAS
  const casasOcupadas = cuentas.map(
    cuenta => cuenta.casa
  );

  // REGISTRAR USUARIO
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

    const listaNueva = [...cuentas, nuevaCuenta];

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

  // INICIAR SESION
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

  // CERRAR SESION
  const cerrarSesion = () => {

    setRol('');
    setUsuario('');
    setContrasena('');
    setTipoCuenta('usuario');
    setPestana('inicio');
    setNombreSesion('');
  };

  // =========================================
  // CONTROL FLUIDO DE LAS CASAS
  // =========================================

  const cambiarCasa = async (numero, componente) => {

    // VERIFICAR PERMISOS
    if (
      rol !== 'admin' &&
      !(rol === 'usuario' && numero === casaAsignada)
    ) {
      return;
    }

    // CASAS 2, 3 Y 4: SIMULACION
    if (numero !== 0) {
      const nuevoEstado = !casas[numero][componente];

      setCasas(anteriores =>
        anteriores.map((casa, i) =>
          i === numero
            ? { ...casa, [componente]: nuevoEstado }
            : casa
        )
      );

      registrarActividad(
        'casas',
        descripcionControlCasa(numero, componente, nuevoEstado),
        numero + 1,
        'Simulación'
      );
      return;
    }

    // CASA 1: VENTANA PENDIENTE
    if (componente === 'especial') {

      Alert.alert(
        'Ventana pendiente',
        'Necesitamos alimentación adecuada para controlar los dos servomotores.'
      );

      return;
    }

    // EVITAR ENVIAR DOS ORDENES AL MISMO TIEMPO
    if (bloqueoEnvio.current) {
      return;
    }

    // ESTADOS ANTERIOR Y NUEVO
    const estadoAnterior = casas[0][componente];
    const nuevoEstado = !estadoAnterior;

    // COMANDO PARA ARDUINO
    let comando = '';

    if (componente === 'luz') {
      comando = nuevoEstado
        ? 'LUZ_ON'
        : 'LUZ_OFF';
    }

    else if (componente === 'puerta') {
      comando = nuevoEstado
        ? 'PUERTA_ABRIR'
        : 'PUERTA_CERRAR';
    }

    if (!comando) {
      return;
    }

    bloqueoEnvio.current = true;
    setEnviandoCasa1(true);

    // RESPUESTA INMEDIATA EN PANTALLA
    setCasas(anteriores =>
      anteriores.map((casa, i) =>
        i === 0
          ? {
              ...casa,
              [componente]: nuevoEstado
            }
          : casa
      )
    );

    setMensajeCasa1(
      'Enviando orden al Arduino...'
    );

    // TIEMPO MAXIMO PARA LA RESPUESTA
    const controlador = new AbortController();

    const temporizador = setTimeout(() => {
      controlador.abort();
    }, 7000);

    try {

      // ENVIAR ORDEN A NODE.JS
      const respuesta = await fetch(
        URL_CASA1 + '/control',
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

      if (!respuesta.ok) {
        throw new Error(
          datos.error || 'El servidor no aceptó la orden.'
        );
      }

      // ORDEN ACEPTADA
      setMensajeCasa1(
        'Orden enviada al Arduino: ' + comando
      );

      // Solo registrar si el servidor aceptó la orden (no confirma movimiento físico).
      registrarActividad(
        'casas',
        descripcionControlCasa(numero, componente, nuevoEstado),
        numero + 1,
        'Orden aceptada por servidor'
      );

    } catch (error) {

      // RECUPERAR ESTADO ANTERIOR
      setCasas(anteriores =>
        anteriores.map((casa, i) =>
          i === 0
            ? {
                ...casa,
                [componente]: estadoAnterior
              }
            : casa
        )
      );

      if (error.name === 'AbortError') {

        setMensajeCasa1(
          'El servidor tardó demasiado en responder.'
        );

      } else {

        setMensajeCasa1(
          'Error de conexión con el Arduino.'
        );
      }

      Alert.alert(
        'Error de conexión',
        'No se pudo confirmar la orden. Revisa la conexión del Arduino y el servidor del puerto 3002.'
      );

    } finally {

      clearTimeout(temporizador);

      bloqueoEnvio.current = false;
      setEnviandoCasa1(false);
    }
  };

  // =========================================
  // CONTROLAR POSTES
  // =========================================

  const cambiarPoste = numero => {
    if (rol !== 'admin') return;

    const nuevoEstado = !postes[numero];
    setPostes(anteriores =>
      anteriores.map((encendido, i) =>
        i === numero ? nuevoEstado : encendido
      )
    );

    registrarActividad(
      'postes',
      `Poste ${numero + 1} ${nuevoEstado ? 'encendido' : 'apagado'}`,
      null,
      'Control desde la aplicación'
    );
  };

  const cambiarTodosPostes = encender => {
    if (rol !== 'admin') return;

    const cambiados = postes.filter(estado => estado !== encender).length;
    if (cambiados === 0) return;

    setPostes(Array(6).fill(encender));
    registrarActividad(
      'postes',
      `${cambiados} poste${cambiados === 1 ? '' : 's'} ${encender ? 'encendido' : 'apagado'}${cambiados === 1 ? '' : 's'} con acción general`,
      null,
      'Control desde la aplicación'
    );
  };

  // =========================================
  // MOSTRAR CASA
  // =========================================

  const mostrarCasa = numero => {

    const casa = casas[numero];
    const tieneVentana = numero < 2;

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

        {numero === 0 ? (

          <View style={styles.avisoCasaFisica}>

            <Ionicons
              name="hardware-chip-outline"
              size={19}
              color="#7DD3FC"
            />

            <Text style={styles.textoAvisoCasaFisica}>
              Control físico de la Casa 1
            </Text>

          </View>

        ) : (

          <Text style={styles.notaSimulacion}>
            Esta casa funciona en modo simulación.
          </Text>

        )}

        {/* ILUMINACION */}
        <Control
          nombre="Iluminación"
          icono={casa.luz ? 'bulb' : 'bulb-outline'}
          activo={casa.luz}
          textoActivo="Encendida"
          textoInactivo="Apagada"
          botonActivo="Apagar"
          botonInactivo="Encender"
          accion={() => cambiarCasa(numero, 'luz')}
          deshabilitado={numero === 0 && enviandoCasa1}
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
          deshabilitado={numero === 0 && enviandoCasa1}
        />

        {/* VENTANA O TENDEDERO */}
        <Control
          nombre={tieneVentana ? 'Ventana' : 'Tendedero'}
          icono={
            tieneVentana
              ? casa.especial
                ? 'window-open'
                : 'window-closed'
              : 'shirt-outline'
          }
          material={tieneVentana}
          activo={casa.especial}
          textoActivo={
            tieneVentana ? 'Abierta' : 'Extendido'
          }
          textoInactivo={
            tieneVentana ? 'Cerrada' : 'Guardado'
          }
          botonActivo={
            tieneVentana ? 'Cerrar' : 'Guardar'
          }
          botonInactivo={
            tieneVentana ? 'Abrir' : 'Extender'
          }
          accion={() => cambiarCasa(numero, 'especial')}
          deshabilitado={numero === 0}
        />

        {/* MENSAJE DEL ARDUINO */}
        {numero === 0 && (

          <View>

            {enviandoCasa1 && (
              <ActivityIndicator
                size="small"
                color="#38BDF8"
                style={{ marginTop: 12 }}
              />
            )}

            <Text style={styles.mensajeArduino}>
              {mensajeCasa1}
            </Text>

            <Text style={styles.notaSimulacion}>
              La ventana se habilitará cuando tengamos
              alimentación adecuada para ambos servos.
            </Text>

            <Text style={styles.notaSimulacion}>
              El estado mostrado representa la última
              orden solicitada. No confirma la posición
              física del dispositivo.
            </Text>

          </View>

        )}

      </View>
    );
  };

  // PANTALLA DE CARGA
  if (cargando) {
    return (
      <View style={styles.centrado}>

        <ActivityIndicator
          size="large"
          color="#38BDF8"
        />

        <Text>Cargando colonia...</Text>

      </View>
    );
  }

  // PANTALLA DE REGISTRO
  if (rol === '' && mostrarRegistro) {

    return (
      <Registro
        registrar={registrarUsuario}
        casasOcupadas={casasOcupadas}
        volver={() => setMostrarRegistro(false)}
      />
    );
  }

  // PANTALLA DE LOGIN
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

  // DATOS DEL PANEL
  const lucesEncendidas = casas.filter(
    casa => casa.luz
  ).length;

  const postesEncendidos = postes.filter(Boolean).length;

  const miCasa = casas[casaAsignada];

  // MENU DE NAVEGACION
  const menu = rol === 'admin'
    ? [
        { id: 'inicio', nombre: 'Inicio', icono: 'grid-outline' },
        { id: 'casas', nombre: 'Casas', icono: 'home-outline' },
        { id: 'postes', nombre: 'Postes', icono: 'bulb-outline' },
        { id: 'historial', nombre: 'Historial', icono: 'time-outline' }
      ]
    : [
        { id: 'inicio', nombre: 'Inicio', icono: 'home-outline' },
        { id: 'casa', nombre: 'Mi casa', icono: 'options-outline' },
        { id: 'perfil', nombre: 'Mi perfil', icono: 'person-outline' },
        { id: 'historial', nombre: 'Historial', icono: 'time-outline' }
      ];

  // PANTALLA PRINCIPAL
  return (
    <View style={styles.fondo}>

      <StatusBar barStyle="light-content" backgroundColor="#080F1D" />

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

              <View style={styles.dato}>

                <Text style={styles.numero}>4</Text>

                <Text style={styles.descripcion}>
                  Casas
                </Text>

              </View>

              <View style={styles.dato}>

                <Text style={styles.numero}>
                  {cuentas.length}
                </Text>

                <Text style={styles.descripcion}>
                  Ocupadas
                </Text>

              </View>

              <View style={styles.dato}>

                <Text style={styles.numero}>
                  {lucesEncendidas}
                </Text>

                <Text style={styles.descripcion}>
                  Luces encendidas
                </Text>

              </View>

              <View style={styles.dato}>

                <Text style={styles.numero}>
                  {postesEncendidos}
                </Text>

                <Text style={styles.descripcion}>
                  Postes encendidos
                </Text>

              </View>

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

              {postes.map((encendido, i) => (

                <Control
                  key={i}
                  nombre={`Poste ${i + 1}`}
                  icono={
                    encendido ? 'bulb' : 'bulb-outline'
                  }
                  activo={encendido}
                  textoActivo="Encendido"
                  textoInactivo="Apagado"
                  botonActivo="Apagar"
                  botonInactivo="Encender"
                  accion={() => cambiarPoste(i)}
                />

              ))}

              <TouchableOpacity
                style={styles.botonGrande}
                onPress={() => cambiarTodosPostes(true)}
              >

                <Text style={styles.textoBlanco}>
                  Encender todos
                </Text>

              </TouchableOpacity>

              <TouchableOpacity
                style={styles.botonGrande}
                onPress={() => cambiarTodosPostes(false)}
              >

                <Text style={styles.textoBlanco}>
                  Apagar todos
                </Text>

              </TouchableOpacity>

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

// ESTILOS
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
    shadowOffset: { width: 0, height: 5 }
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