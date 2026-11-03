
import React, { useEffect, useState } from 'react';

import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  StatusBar
} from 'react-native';

import {
  Ionicons,
  MaterialCommunityIcons
} from '@expo/vector-icons';

import AsyncStorage from '@react-native-async-storage/async-storage';

import Login from './PANTALLAS/Login';
import Registro from './PANTALLAS/Registro';

const CLAVE_GUARDADO = '@ColoniaGang_Usuarios';


// COMPONENTE PARA LOS CONTROLES

function Control({
  icono,
  material = false,
  titulo,
  activo,
  textoOn,
  textoOff,
  accion
}) {

  const Icono = material
    ? MaterialCommunityIcons
    : Ionicons;

  let textoAccion;

  if (titulo === 'Iluminación' || titulo.startsWith('Poste')) {
    textoAccion = activo ? 'Apagar' : 'Encender';
  } else if (titulo === 'Tendedero') {
    textoAccion = activo ? 'Guardar' : 'Extender';
  } else {
    textoAccion = activo ? 'Cerrar' : 'Abrir';
  }

  return (

    <View style={styles.filaControl}>

      <View style={styles.fondoIcono}>
        <Icono
          name={icono}
          size={25}
          color="#2563EB"
        />
      </View>

      <View style={styles.infoControl}>

        <Text style={styles.tituloControl}>
          {titulo}
        </Text>

        <Text style={styles.estado}>
          {activo ? textoOn : textoOff}
        </Text>

      </View>

      <TouchableOpacity
        style={[
          styles.botonChico,
          activo && styles.botonGris
        ]}
        onPress={accion}
      >
        <Text style={styles.textoBoton}>
          {textoAccion}
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
  const [rol, setRol] = useState('');
  const [tipoCuenta, setTipoCuenta] = useState('usuario');

  // REGISTRO
  const [mostrarRegistro, setMostrarRegistro] = useState(false);
  const [cuentas, setCuentas] = useState([]);
  const [cargando, setCargando] = useState(true);

  // CASA Y NAVEGACION
  const [casaAsignada, setCasaAsignada] = useState(0);
  const [cuentaDemo, setCuentaDemo] = useState(false);
  const [pestana, setPestana] = useState('inicio');

  // ESTADO DE LAS CUATRO CASAS
  const [casas, setCasas] = useState([
    { luz: false, puerta: false, especial: false },
    { luz: false, puerta: false, especial: false },
    { luz: false, puerta: false, especial: false },
    { luz: false, puerta: false, especial: false }
  ]);

  // ESTADO DE LOS SEIS POSTES
  const [postes, setPostes] = useState([
    false, false, false, false, false, false
  ]);


  // CARGAR CUENTAS GUARDADAS

  useEffect(() => {

    const cargarCuentas = async () => {

      try {

        const guardado = await AsyncStorage.getItem(
          CLAVE_GUARDADO
        );

        if (guardado) {

          const datos = JSON.parse(guardado);

          if (Array.isArray(datos)) {
            setCuentas(datos);
          }
        }

      } catch (error) {

        Alert.alert(
          'Aviso',
          'No se pudieron cargar los registros guardados.'
        );

      } finally {

        setCargando(false);

      }
    };

    cargarCuentas();

  }, []);


  // IDENTIFICAR CASAS OCUPADAS

  const casasOcupadas = cuentas.map(
    persona => persona.casa
  );


  // REGISTRAR NUEVO USUARIO

  const registrarUsuario = async (
    nombre,
    nuevoUsuario,
    nuevaContrasena,
    casaElegida
  ) => {

    const nombreLimpio = nombre.trim();

    const usuarioLimpio = nuevoUsuario
      .trim()
      .toLowerCase();

    if (!nombreLimpio || !usuarioLimpio || !nuevaContrasena) {

      Alert.alert(
        'Error',
        'Completa todos los campos.'
      );

      return false;
    }

    // COMPROBAR QUE EL USUARIO NO EXISTA

    const existe = cuentas.some(
      persona => persona.usuario === usuarioLimpio
    );

    if (
      usuarioLimpio === 'admin' ||
      usuarioLimpio === 'usuario' ||
      existe
    ) {

      Alert.alert(
        'Error',
        'Ese nombre de usuario ya existe.'
      );

      return false;
    }

    // COMPROBAR QUE LA CASA ESTE DISPONIBLE

    if (
      ![0, 1, 2, 3].includes(casaElegida) ||
      casasOcupadas.includes(casaElegida)
    ) {

      Alert.alert(
        'Casa no disponible',
        'Elige otra casa que esté libre.'
      );

      return false;
    }

    // CREAR LA CUENTA

    const nuevaCuenta = {
      nombre: nombreLimpio,
      usuario: usuarioLimpio,
      contrasena: nuevaContrasena,
      casa: casaElegida
    };

    const nuevasCuentas = [
      ...cuentas,
      nuevaCuenta
    ];

    // GUARDAR EN EL DISPOSITIVO

    try {

      await AsyncStorage.setItem(
        CLAVE_GUARDADO,
        JSON.stringify(nuevasCuentas)
      );

      setCuentas(nuevasCuentas);

      setUsuario(usuarioLimpio);
      setContrasena('');
      setTipoCuenta('usuario');
      setMostrarRegistro(false);

      Alert.alert(
        'Registro exitoso',
        `Se te asignó la Casa ${casaElegida + 1}.`
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

    const nombreUsuario = usuario
      .trim()
      .toLowerCase();

    if (!nombreUsuario || !contrasena) {

      Alert.alert(
        'Error',
        'Ingresa tu usuario y contraseña.'
      );

      return;
    }

    // CUENTA DEL ADMINISTRADOR

    if (tipoCuenta === 'admin') {

      if (
        nombreUsuario === 'admin' &&
        contrasena === '1234'
      ) {

        setRol('admin');
        setPestana('inicio');

      } else {

        Alert.alert(
          'Acceso denegado',
          'Los datos del administrador son incorrectos.'
        );

      }

      return;
    }

    // USUARIO DE DEMOSTRACION
    // UTILIZA UNA CASA LIBRE, SIN RESERVARLA

    if (
      nombreUsuario === 'usuario' &&
      contrasena === '1234'
    ) {

      const libre = [0, 1, 2, 3].find(
        i => !casasOcupadas.includes(i)
      );

      if (libre === undefined) {

        Alert.alert(
          'Sin casas libres',
          'Inicia sesión con una cuenta registrada.'
        );

        return;
      }

      setCasaAsignada(libre);
      setCuentaDemo(true);
      setRol('usuario');
      setPestana('inicio');

      return;
    }

    // BUSCAR CUENTA REGISTRADA

    const encontrada = cuentas.find(
      persona =>
        persona.usuario === nombreUsuario &&
        persona.contrasena === contrasena
    );

    if (!encontrada) {

      Alert.alert(
        'Error',
        'Usuario o contraseña incorrectos.'
      );

      return;
    }

    // ENTRAR A LA CASA ELEGIDA AL REGISTRARSE

    setCasaAsignada(encontrada.casa);
    setCuentaDemo(false);
    setRol('usuario');
    setPestana('inicio');
  };


  // CERRAR SESION

  const cerrarSesion = () => {

    setRol('');
    setUsuario('');
    setContrasena('');
    setTipoCuenta('usuario');
    setPestana('inicio');
    setCuentaDemo(false);

  };


  // ENCENDER O APAGAR COMPONENTES DE LAS CASAS

  const cambiarEstado = (numeroCasa, componente) => {

    // EL USUARIO NORMAL SOLO CONTROLA SU CASA

    if (
      rol !== 'admin' &&
      (
        rol !== 'usuario' ||
        casaAsignada !== numeroCasa
      )
    ) {
      return;
    }

    setCasas(anteriores =>
      anteriores.map((casa, i) => {

        if (i === numeroCasa) {

          return {
            ...casa,
            [componente]: !casa[componente]
          };

        }

        return casa;

      })
    );

  };


  // ENCENDER O APAGAR POSTES

  const cambiarPoste = (numeroPoste) => {

    if (rol !== 'admin') {
      return;
    }

    setPostes(anteriores =>
      anteriores.map((estado, i) =>
        i === numeroPoste ? !estado : estado
      )
    );
  };


  // MOSTRAR LOS CONTROLES DE UNA CASA

  const mostrarCasa = (numeroCasa) => {

    const casa = casas[numeroCasa];

    const ventana = numeroCasa < 2;

    const propietaria = cuentas.find(
      persona => persona.casa === numeroCasa
    );

    return (

      <View
        style={styles.tarjeta}
        key={numeroCasa}
      >

        <View style={styles.encabezadoCasa}>

          <Ionicons
            name="home-outline"
            size={29}
            color="#2563EB"
          />

          <View style={styles.infoControl}>

            <Text style={styles.nombreCasa}>
              Casa {numeroCasa + 1}
              {numeroCasa === 3 ? ' Premium' : ''}
            </Text>

            <Text style={styles.estado}>

              {rol === 'admin'
                ? (
                    propietaria
                      ? `Adquirida por: ${propietaria.nombre}`
                      : 'Disponible'
                  )
                : 'Tu vivienda asignada'}

            </Text>

          </View>

        </View>

        {/* LUZ */}

        <Control
          icono={casa.luz ? 'bulb' : 'bulb-outline'}
          titulo="Iluminación"
          activo={casa.luz}
          textoOn="Encendida"
          textoOff="Apagada"
          accion={() =>
            cambiarEstado(numeroCasa, 'luz')
          }
        />

        {/* PUERTA */}

        <Control
          material={true}
          icono={
            casa.puerta ? 'door-open' : 'door-closed'
          }
          titulo="Puerta"
          activo={casa.puerta}
          textoOn="Abierta"
          textoOff="Cerrada"
          accion={() =>
            cambiarEstado(numeroCasa, 'puerta')
          }
        />

        {/* VENTANA O TENDEDERO */}

        <Control
          material={ventana}
          icono={
            ventana
              ? (
                  casa.especial
                    ? 'window-open'
                    : 'window-closed'
                )
              : 'shirt-outline'
          }
          titulo={ventana ? 'Ventana' : 'Tendedero'}
          activo={casa.especial}
          textoOn={
            ventana ? 'Abierta' : 'Extendido'
          }
          textoOff={
            ventana ? 'Cerrada' : 'Guardado'
          }
          accion={() =>
            cambiarEstado(numeroCasa, 'especial')
          }
        />

      </View>

    );
  };


  // PANTALLA DE CARGA

  if (cargando) {

    return (

      <View style={styles.cargando}>

        <ActivityIndicator
          size="large"
          color="#2563EB"
        />

        <Text style={styles.estado}>
          Cargando colonia...
        </Text>

      </View>

    );
  }


  // REGISTRO

  if (rol === '' && mostrarRegistro) {

    return (

      <Registro
        registrar={registrarUsuario}
        casasOcupadas={casasOcupadas}
        volver={() => setMostrarRegistro(false)}
      />

    );
  }


  // INICIO DE SESION

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


  // INFORMACION DEL USUARIO

  const perfil = cuentas.find(
    persona =>
      persona.usuario === usuario.trim().toLowerCase()
  );


  // OPCIONES DE NAVEGACION

  const menu = rol === 'admin'

    ? [
        {
          id: 'inicio',
          titulo: 'Inicio',
          icono: 'grid-outline'
        },
        {
          id: 'casas',
          titulo: 'Casas',
          icono: 'home-outline'
        },
        {
          id: 'postes',
          titulo: 'Postes',
          icono: 'bulb-outline'
        }
      ]

    : [
        {
          id: 'inicio',
          titulo: 'Inicio',
          icono: 'home-outline'
        },
        {
          id: 'casa',
          titulo: 'Mi casa',
          icono: 'options-outline'
        },
        {
          id: 'perfil',
          titulo: 'Mi perfil',
          icono: 'person-outline'
        }
      ];


  // RESUMEN DE LA COLONIA

  const miCasa = casas[casaAsignada];

  const lucesActivas = casas.filter(
    casa => casa.luz
  ).length;

  const postesActivos = postes.filter(
    estado => estado
  ).length;


  // PANTALLA PRINCIPAL

  return (

    <View style={styles.fondo}>

      <StatusBar barStyle="dark-content" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.contenido}
      >

        {/* ENCABEZADO */}

        <View style={styles.encabezado}>

          <View style={styles.iconoTitulo}>

            <Ionicons
              name={
                rol === 'admin'
                  ? 'shield-checkmark-outline'
                  : 'home-outline'
              }
              size={29}
              color="#FFFFFF"
            />

          </View>

          <View style={styles.infoControl}>

            <Text style={styles.titulo}>
              Colonia Domótica
            </Text>

            <Text style={styles.estado}>
              {rol === 'admin'
                ? 'Panel del administrador'
                : 'Panel del residente'}
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


        {/* ADMINISTRADOR: VENTANA 1 - INICIO */}

        {rol === 'admin' && pestana === 'inicio' && (

          <View>

            <Text style={styles.seccion}>
              Resumen de la colonia
            </Text>

            <View style={styles.resumen}>

              <View style={styles.dato}>
                <Text style={styles.numero}>4</Text>
                <Text>Casas</Text>
              </View>

              <View style={styles.dato}>
                <Text style={styles.numero}>
                  {cuentas.length}
                </Text>
                <Text>Ocupadas</Text>
              </View>

              <View style={styles.dato}>
                <Text style={styles.numero}>
                  {lucesActivas}
                </Text>
                <Text>Luces encendidas</Text>
              </View>

              <View style={styles.dato}>
                <Text style={styles.numero}>
                  {postesActivos}
                </Text>
                <Text>Postes encendidos</Text>
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

              <Text style={styles.textoBoton}>
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

              <Text style={styles.textoBoton}>
                Controlar postes
              </Text>

            </TouchableOpacity>

          </View>

        )}


        {/* ADMINISTRADOR: VENTANA 2 - CASAS */}

        {rol === 'admin' && pestana === 'casas' && (

          <View>

            <Text style={styles.seccion}>
              Casas inteligentes
            </Text>

            <Text style={styles.descripcion}>
              Controla las cuatro viviendas.
            </Text>

            {casas.map((casa, i) => mostrarCasa(i))}

          </View>

        )}


        {/* ADMINISTRADOR: VENTANA 3 - POSTES */}

        {rol === 'admin' && pestana === 'postes' && (

          <View>

            <Text style={styles.seccion}>
              Alumbrado público
            </Text>

            <View style={styles.tarjeta}>

              {postes.map((encendido, i) => (

                <Control
                  key={i}
                  icono={
                    encendido ? 'bulb' : 'bulb-outline'
                  }
                  titulo={`Poste ${i + 1}`}
                  activo={encendido}
                  textoOn="Encendido"
                  textoOff="Apagado"
                  accion={() => cambiarPoste(i)}
                />

              ))}

              <TouchableOpacity
                style={styles.botonGrande}
                onPress={() =>
                  setPostes(Array(6).fill(true))
                }
              >

                <Ionicons
                  name="flash-outline"
                  size={21}
                  color="#FFFFFF"
                />

                <Text style={styles.textoBoton}>
                  Encender todos
                </Text>

              </TouchableOpacity>

              <TouchableOpacity
                style={styles.botonGrande}
                onPress={() =>
                  setPostes(Array(6).fill(false))
                }
              >

                <Ionicons
                  name="power-outline"
                  size={21}
                  color="#FFFFFF"
                />

                <Text style={styles.textoBoton}>
                  Apagar todos
                </Text>

              </TouchableOpacity>

            </View>

          </View>

        )}


        {/* USUARIO: VENTANA 1 - INICIO */}

        {rol === 'usuario' && pestana === 'inicio' && (

          <View>

            <Text style={styles.seccion}>
              Bienvenido a tu casa
            </Text>

            <View style={styles.tarjeta}>

              <Ionicons
                name="home-outline"
                size={45}
                color="#2563EB"
              />

              <Text style={styles.nombreCasa}>
                Casa {casaAsignada + 1}
              </Text>

              <Text style={styles.estado}>
                {cuentaDemo
                  ? 'Cuenta de demostración'
                  : 'Casa asignada al registrarte'}
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

                <Text style={styles.textoBoton}>
                  Controlar mi casa
                </Text>

              </TouchableOpacity>

            </View>

          </View>

        )}


        {/* USUARIO: VENTANA 2 - MI CASA */}

        {rol === 'usuario' && pestana === 'casa' && (

          <View>

            <Text style={styles.seccion}>
              Mi casa inteligente
            </Text>

            <Text style={styles.descripcion}>
              Controla únicamente tu vivienda.
            </Text>

            {mostrarCasa(casaAsignada)}

          </View>

        )}


        {/* USUARIO: VENTANA 3 - MI PERFIL */}

        {rol === 'usuario' && pestana === 'perfil' && (

          <View>

            <Text style={styles.seccion}>
              Mi perfil
            </Text>

            <View style={styles.tarjeta}>

              <Ionicons
                name="person-circle-outline"
                size={67}
                color="#2563EB"
              />

              <Text style={styles.nombreCasa}>
                {perfil
                  ? perfil.nombre
                  : 'Usuario de prueba'}
              </Text>

              <Text style={styles.descripcion}>
                Usuario: {usuario}
              </Text>

              <Text style={styles.descripcion}>
                Tipo de cuenta: Usuario normal
              </Text>

              <Text style={styles.descripcion}>
                Casa: {casaAsignada + 1}
              </Text>

              <TouchableOpacity
                style={[
                  styles.botonGrande,
                  styles.salir
                ]}
                onPress={cerrarSesion}
              >

                <Ionicons
                  name="log-out-outline"
                  size={21}
                  color="#FFFFFF"
                />

                <Text style={styles.textoBoton}>
                  Cerrar sesión
                </Text>

              </TouchableOpacity>

            </View>

          </View>

        )}

      </ScrollView>


      {/* BARRA DE NAVEGACION INFERIOR */}

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
              {item.titulo}
            </Text>

          </TouchableOpacity>

        ))}

      </View>

    </View>
  );
}


// ESTILOS

const styles = StyleSheet.create({

  fondo: {
    flex: 1,
    backgroundColor: '#EDF4FF'
  },

  scroll: {
    flex: 1
  },

  contenido: {
    padding: 20,
    paddingTop: 40,
    paddingBottom: 30
  },

  cargando: {
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

  iconoTitulo: {
    backgroundColor: '#2563EB',
    padding: 13,
    borderRadius: 13
  },

  titulo: {
    fontSize: 21,
    fontWeight: 'bold',
    color: '#1E3A8A'
  },

  seccion: {
    fontSize: 24,
    color: '#1E3A8A',
    fontWeight: 'bold',
    marginBottom: 16
  },

  descripcion: {
    fontSize: 15,
    color: '#64748B',
    marginBottom: 13,
    marginTop: 5
  },

  tarjeta: {
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    padding: 18,
    marginBottom: 16,
    elevation: 2
  },

  encabezadoCasa: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12
  },

  nombreCasa: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E3A8A',
    marginTop: 7
  },

  estado: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4
  },

  filaControl: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingVertical: 14,
    gap: 9
  },

  fondoIcono: {
    width: 43,
    height: 43,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },

  infoControl: {
    flex: 1
  },

  tituloControl: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#334155'
  },

  botonChico: {
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    paddingHorizontal: 10,
    minWidth: 78,
    alignItems: 'center',
    borderRadius: 9
  },

  botonGris: {
    backgroundColor: '#475569'
  },

  textoBoton: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold'
  },

  botonGrande: {
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 11,
    gap: 10,
    marginTop: 11
  },

  salir: {
    backgroundColor: '#DC2626'
  },

  resumen: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },

  dato: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: 15,
    marginBottom: 12
  },

  numero: {
    fontSize: 27,
    fontWeight: 'bold',
    color: '#2563EB',
    marginBottom: 6
  },

  barra: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    paddingTop: 9,
    paddingBottom: 16,
    paddingHorizontal: 9,
    borderTopWidth: 1,
    borderColor: '#E2E8F0'
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
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 5,
    fontWeight: 'bold'
  },

  textoActivo: {
    color: '#2563EB'
  }

});
