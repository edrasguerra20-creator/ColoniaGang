
import React, { useEffect, useState } from 'react';

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

const CLAVE = '@ColoniaGang_Usuarios';

// COMPONENTE PARA CONTROLAR DISPOSITIVOS

function Control({
  nombre,
  icono,
  material = false,
  activo,
  textoActivo,
  textoInactivo,
  botonActivo,
  botonInactivo,
  accion
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
          activo && styles.botonSecundario
        ]}
        onPress={accion}
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


  // CARGAR USUARIOS GUARDADOS

  useEffect(() => {

    async function cargarUsuarios() {

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
          'No se pudieron cargar los usuarios.'
        );

      } finally {

        setCargando(false);

      }
    }

    cargarUsuarios();

  }, []);


  // CASAS QUE YA TIENEN RESIDENTE

  const casasOcupadas = cuentas.map(
    cuenta => cuenta.casa
  );


  // REGISTRO DE NUEVAS CUENTAS

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
      Alert.alert('Error', 'Completa todos los campos.');
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
        'Seleccioná una casa disponible.'
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
        'Ingresá tu usuario y contraseña.'
      );
      return;
    }

    // ADMINISTRADOR DE PRUEBA

    if (tipoCuenta === 'admin') {

      if (nombre === 'admin' && contrasena === '1234') {

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

    // CUENTA DE PRUEBA

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
          'Ingresá con una cuenta registrada.'
        );
        return;
      }

      setRol('usuario');
      setCasaAsignada(casaLibre);
      setNombreSesion('Usuario de prueba');
      setPestana('inicio');
      return;
    }

    // CUENTA REGISTRADA

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


  // CONTROLAR DISPOSITIVOS DE LAS CASAS

  const cambiarCasa = (numero, componente) => {

    if (
      rol !== 'admin' &&
      !(rol === 'usuario' && numero === casaAsignada)
    ) {
      return;
    }

    setCasas(anteriores =>
      anteriores.map((casa, i) =>
        i === numero
          ? {
              ...casa,
              [componente]: !casa[componente]
            }
          : casa
      )
    );
  };


  // CONTROLAR POSTES

  const cambiarPoste = numero => {

    if (rol !== 'admin') {
      return;
    }

    setPostes(anteriores =>
      anteriores.map((encendido, i) =>
        i === numero ? !encendido : encendido
      )
    );
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

        <Control
          nombre="Iluminación"
          icono={casa.luz ? 'bulb' : 'bulb-outline'}
          activo={casa.luz}
          textoActivo="Encendida"
          textoInactivo="Apagada"
          botonActivo="Apagar"
          botonInactivo="Encender"
          accion={() => cambiarCasa(numero, 'luz')}
        />

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
        />

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
        />

      </View>
    );
  };


  // ESPERAR A QUE SE CARGUEN LOS REGISTROS

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


  // DATOS PARA EL PANEL

  const lucesEncendidas = casas.filter(
    casa => casa.luz
  ).length;

  const postesEncendidos = postes.filter(Boolean).length;

  const miCasa = casas[casaAsignada];

  const menu = rol === 'admin'
    ? [
        { id: 'inicio', nombre: 'Inicio', icono: 'grid-outline' },
        { id: 'casas', nombre: 'Casas', icono: 'home-outline' },
        { id: 'postes', nombre: 'Postes', icono: 'bulb-outline' }
      ]
    : [
        { id: 'inicio', nombre: 'Inicio', icono: 'home-outline' },
        { id: 'casa', nombre: 'Mi casa', icono: 'options-outline' },
        { id: 'perfil', nombre: 'Mi perfil', icono: 'person-outline' }
      ];


  // PANTALLA PRINCIPAL CON CHATBOT INTEGRADO

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
                <Text style={styles.descripcion}>Casas</Text>
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
                onPress={() =>
                  setPostes(Array(6).fill(true))
                }
              >
                <Text style={styles.textoBlanco}>
                  Encender todos
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.botonGrande}
                onPress={() =>
                  setPostes(Array(6).fill(false))
                }
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


        {/* RESIDENTE - MI CASA */}

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


      {/* DOMOTIBOT - VISIBLE EN TODAS LAS PANTALLAS */}

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
    minWidth: 75,
    alignItems: 'center'
  },

  botonSecundario: {
    backgroundColor: '#475569'
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
