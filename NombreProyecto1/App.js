
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

// CONFIGURACION
const CLAVE = '@ColoniaGang_Usuarios';

// ULTIMA IP QUE IDENTIFICAMOS EN TU COMPUTADORA
const URL_ARDUINO = 'http://192.168.1.3:3002';

// COMPONENTE DE LOS CONTROLES
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
  ocupado
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
          color="#2563EB"
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
          ocupado && styles.botonOcupado
        ]}
        onPress={accion}
        disabled={ocupado}
      >

        <Text style={styles.textoBlanco}>
          {ocupado
            ? 'Enviando...'
            : activo
              ? botonActivo
              : botonInactivo}
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

  const [nombreSesion, setNombreSesion] = useState('');
  const [casaAsignada, setCasaAsignada] = useState(0);

  // REGISTRO
  const [mostrarRegistro, setMostrarRegistro] = useState(false);
  const [cuentas, setCuentas] = useState([]);
  const [cargando, setCargando] = useState(true);

  // NAVEGACION
  const [pestana, setPestana] = useState('inicio');

  // COMUNICACION CON ARDUINO
  const [enviando, setEnviando] = useState(false);
  const bloqueo = useRef(false);

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

  // CARGAR USUARIOS
  useEffect(() => {

    async function cargar() {

      try {

        const guardados = await AsyncStorage.getItem(CLAVE);

        if (guardados) {

          const lista = JSON.parse(guardados);

          if (Array.isArray(lista)) {
            setCuentas(lista);
          }

        }

      } catch (error) {

        Alert.alert(
          'Aviso',
          'No se pudieron cargar las cuentas.'
        );

      } finally {

        setCargando(false);

      }
    }

    cargar();

  }, []);

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

    const lista = [...cuentas, nuevaCuenta];

    try {

      await AsyncStorage.setItem(
        CLAVE,
        JSON.stringify(lista)
      );

      setCuentas(lista);
      setUsuario(usuarioLimpio);
      setContrasena('');
      setTipoCuenta('usuario');
      setMostrarRegistro(false);

      Alert.alert(
        'Cuenta creada',
        `Adquiriste la Casa ${casaElegida + 1}.`
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

    // ADMINISTRADOR DE PRUEBA
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
          'Datos de administrador incorrectos.'
        );

      }

      return;
    }

    // USUARIO DE PRUEBA
    if (
      nombre === 'usuario' &&
      contrasena === '1234'
    ) {

      const libre = [0, 1, 2, 3].find(
        i => !casasOcupadas.includes(i)
      );

      if (libre === undefined) {

        Alert.alert(
          'Sin casas disponibles',
          'Utiliza una cuenta registrada.'
        );

        return;
      }

      setRol('usuario');
      setCasaAsignada(libre);
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
    setNombreSesion('');
    setPestana('inicio');

  };

  // ENVIAR UNA ORDEN AL ARDUINO
  const enviarAlArduino = async comando => {

    if (bloqueo.current) {
      return false;
    }

    bloqueo.current = true;
    setEnviando(true);

    const controlador = new AbortController();

    const limite = setTimeout(() => {
      controlador.abort();
    }, 9000);

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

      if (!respuesta.ok || !datos.ok) {

        throw new Error(
          datos.error ||
          'El Arduino no confirmó la orden.'
        );

      }

      return true;

    } catch (error) {

      let mensaje = error.message;

      if (error.name === 'AbortError') {

        mensaje = 'El servidor tardó demasiado en responder.';

      } else if (
        error.message === 'Network request failed'
      ) {

        mensaje =
          'No se pudo conectar con la computadora. ' +
          'Revisa la IP, el Wi-Fi y el servidor del puerto 3002.';

      }

      Alert.alert(
        'No se completó la orden',
        mensaje
      );

      return false;

    } finally {

      clearTimeout(limite);
      bloqueo.current = false;
      setEnviando(false);

    }
  };

  // CONTROLAR LAS CUATRO CASAS
  const cambiarCasa = async (numero, componente) => {

    // VERIFICAR PERMISOS
    if (
      rol !== 'admin' &&
      !(rol === 'usuario' && numero === casaAsignada)
    ) {
      return;
    }

    if (bloqueo.current) {
      return;
    }

    const encender = !casas[numero][componente];

    let accion = '';

    // LUZ
    if (componente === 'luz') {

      accion = encender
        ? 'LUZ_ON'
        : 'LUZ_OFF';

    }

    // PUERTA
    if (componente === 'puerta') {

      accion = encender
        ? 'PUERTA_ABRIR'
        : 'PUERTA_CERRAR';

    }

    // VENTANA O TENDEDERO
    if (componente === 'especial') {

      if (numero < 2) {

        accion = encender
          ? 'VENTANA_ABRIR'
          : 'VENTANA_CERRAR';

      } else {

        accion = encender
          ? 'TENDEDERO_EXTENDER'
          : 'TENDEDERO_GUARDAR';

      }
    }

    if (!accion) {
      return;
    }

    // EJEMPLO: CASA1_LUZ_ON
    const comando = `CASA${numero + 1}_${accion}`;

    const correcto = await enviarAlArduino(comando);

    // CAMBIAR ESTADO SOLO SI ARDUINO CONFIRMA
    if (correcto) {

      setCasas(anteriores =>
        anteriores.map((casa, i) =>
          i === numero
            ? {
                ...casa,
                [componente]: encender
              }
            : casa
        )
      );

    }
  };

  // CONTROL INDIVIDUAL DE POSTES
  const cambiarPoste = async numero => {

    if (rol !== 'admin' || bloqueo.current) {
      return;
    }

    const encender = !postes[numero];

    const comando =
      `POSTE${numero + 1}_${encender ? 'ON' : 'OFF'}`;

    const correcto = await enviarAlArduino(comando);

    if (correcto) {

      setPostes(anteriores =>
        anteriores.map((valor, i) =>
          i === numero ? encender : valor
        )
      );

    }
  };

  // ENCENDER O APAGAR TODOS LOS POSTES
  const cambiarTodosPostes = async encender => {

    if (rol !== 'admin' || bloqueo.current) {
      return;
    }

    const comando =
      `POSTES_TODOS_${encender ? 'ON' : 'OFF'}`;

    const correcto = await enviarAlArduino(comando);

    if (correcto) {
      setPostes(Array(6).fill(encender));
    }
  };

  // MOSTRAR UNA CASA
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
            color="#2563EB"
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
          ocupado={enviando}
        />

        {/* PUERTA */}
        <Control
          nombre="Puerta"
          icono={
            casa.puerta
              ? 'door-open'
              : 'door-closed'
          }
          material={true}
          activo={casa.puerta}
          textoActivo="Abierta"
          textoInactivo="Cerrada"
          botonActivo="Cerrar"
          botonInactivo="Abrir"
          accion={() => cambiarCasa(numero, 'puerta')}
          ocupado={enviando}
        />

        {/* VENTANA O TENDEDERO */}
        <Control
          nombre={
            tieneVentana
              ? 'Ventana'
              : 'Tendedero'
          }
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
            tieneVentana
              ? 'Abierta'
              : 'Extendido'
          }
          textoInactivo={
            tieneVentana
              ? 'Cerrada'
              : 'Guardado'
          }
          botonActivo={
            tieneVentana
              ? 'Cerrar'
              : 'Guardar'
          }
          botonInactivo={
            tieneVentana
              ? 'Abrir'
              : 'Extender'
          }
          accion={() => cambiarCasa(numero, 'especial')}
          ocupado={enviando}
        />

      </View>
    );
  };

  // PANTALLA DE CARGA
  if (cargando) {

    return (
      <View style={styles.centrado}>

        <ActivityIndicator
          size="large"
          color="#2563EB"
        />

        <Text>Cargando colonia...</Text>

      </View>
    );
  }

  // REGISTRO
  if (!rol && mostrarRegistro) {

    return (
      <Registro
        registrar={registrarUsuario}
        casasOcupadas={casasOcupadas}
        volver={() => setMostrarRegistro(false)}
      />
    );
  }

  // LOGIN
  if (!rol) {

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

  // MENU
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
        }
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
        }
      ];

  // PANTALLA PRINCIPAL
  return (
    <View style={styles.fondo}>

      <StatusBar barStyle="dark-content" />

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

        {/* ADMIN - INICIO */}
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
                  Luces activadas
                </Text>
              </View>

              <View style={styles.dato}>
                <Text style={styles.numero}>
                  {postesEncendidos}
                </Text>
                <Text style={styles.descripcion}>
                  Postes activados
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

        {/* ADMIN - CASAS */}
        {rol === 'admin' && pestana === 'casas' && (

          <View>

            <Text style={styles.seccion}>
              Casas inteligentes
            </Text>

            {casas.map((casa, i) => mostrarCasa(i))}

          </View>
        )}

        {/* ADMIN - POSTES */}
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
                    encendido
                      ? 'bulb'
                      : 'bulb-outline'
                  }
                  activo={encendido}
                  textoActivo="Encendido"
                  textoInactivo="Apagado"
                  botonActivo="Apagar"
                  botonInactivo="Encender"
                  accion={() => cambiarPoste(i)}
                  ocupado={enviando}
                />

              ))}

              <TouchableOpacity
                style={[
                  styles.botonGrande,
                  enviando && styles.botonOcupado
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
                  enviando && styles.botonOcupado
                ]}
                onPress={() => cambiarTodosPostes(false)}
                disabled={enviando}
              >

                <Text style={styles.textoBlanco}>
                  Apagar todos
                </Text>

              </TouchableOpacity>

            </View>

          </View>
        )}

        {/* RESIDENTE - INICIO */}
        {rol === 'usuario' && pestana === 'inicio' && (

          <View>

            <Text style={styles.seccion}>
              Mi vivienda inteligente
            </Text>

            <View style={styles.tarjeta}>

              <Ionicons
                name="home-outline"
                size={44}
                color="#2563EB"
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

        {/* RESIDENTE - CASA */}
        {rol === 'usuario' && pestana === 'casa' && (

          <View>

            <Text style={styles.seccion}>
              Controles de mi casa
            </Text>

            {mostrarCasa(casaAsignada)}

          </View>
        )}

        {/* RESIDENTE - PERFIL */}
        {rol === 'usuario' && pestana === 'perfil' && (

          <View>

            <Text style={styles.seccion}>
              Mi perfil
            </Text>

            <View style={styles.tarjeta}>

              <Ionicons
                name="person-circle-outline"
                size={60}
                color="#2563EB"
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

      {/* NAVEGACION */}
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
                  ? '#2563EB'
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
    backgroundColor: '#EDF4FF'
  },

  contenido: {
    padding: 18,
    paddingTop: 40,
    paddingBottom: 100
  },

  centrado: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12
  },

  encabezado: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
    gap: 12
  },

  logo: {
    backgroundColor: '#2563EB',
    padding: 12,
    borderRadius: 14
  },

  titulo: {
    color: '#1E3A8A',
    fontSize: 21,
    fontWeight: 'bold'
  },

  seccion: {
    color: '#1E3A8A',
    fontSize: 23,
    fontWeight: 'bold',
    marginBottom: 15
  },

  descripcion: {
    color: '#64748B',
    fontSize: 13,
    marginTop: 5
  },

  tarjeta: {
    backgroundColor: '#FFFFFF',
    padding: 17,
    borderRadius: 16,
    marginBottom: 15,
    elevation: 2
  },

  tituloCasa: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12
  },

  tituloTarjeta: {
    color: '#1E3A8A',
    fontSize: 19,
    fontWeight: 'bold',
    marginTop: 6
  },

  control: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    gap: 8
  },

  iconoControl: {
    backgroundColor: '#EFF6FF',
    width: 42,
    height: 42,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center'
  },

  controlInfo: {
    flex: 1
  },

  controlNombre: {
    color: '#334155',
    fontWeight: 'bold',
    fontSize: 14
  },

  controlEstado: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 3
  },

  botonControl: {
    backgroundColor: '#2563EB',
    paddingVertical: 11,
    paddingHorizontal: 9,
    borderRadius: 9,
    minWidth: 80,
    alignItems: 'center'
  },

  botonSecundario: {
    backgroundColor: '#475569'
  },

  botonOcupado: {
    opacity: 0.5
  },

  textoBlanco: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold'
  },

  botonGrande: {
    backgroundColor: '#2563EB',
    padding: 15,
    borderRadius: 11,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 9,
    marginTop: 12
  },

  resumen: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },

  dato: {
    backgroundColor: '#FFFFFF',
    padding: 17,
    borderRadius: 14,
    width: '48%',
    marginBottom: 12
  },

  numero: {
    color: '#2563EB',
    fontSize: 27,
    fontWeight: 'bold'
  },

  barra: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 10,
    paddingBottom: 15
  },

  pestana: {
    flex: 1,
    alignItems: 'center',
    padding: 9,
    borderRadius: 12
  },

  pestanaActiva: {
    backgroundColor: '#EFF6FF'
  },

  textoPestana: {
    color: '#94A3B8',
    fontWeight: 'bold',
    fontSize: 12,
    marginTop: 4
  },

  textoActivo: {
    color: '#2563EB'
  }

});
