
import React, { useState } from 'react';

import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert
} from 'react-native';

import {
  Ionicons,
  MaterialCommunityIcons
} from '@expo/vector-icons';

import Login from './PANTALLAS/Login';
import Registro from './PANTALLAS/Registro';

export default function App() {

  // INICIO DE SESION
  const [usuario, setUsuario] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [rol, setRol] = useState('');
  const [tipoCuenta, setTipoCuenta] = useState('usuario');

  // REGISTRO DE USUARIOS
  const [mostrarRegistro, setMostrarRegistro] = useState(false);
  const [usuariosRegistrados, setUsuariosRegistrados] = useState([]);

  // CASA ASIGNADA
  const [casaAsignada, setCasaAsignada] = useState(0);

  // ESTADOS DE LAS CUATRO CASAS
  const [casas, setCasas] = useState([
    { luz: false, puerta: false, especial: false },
    { luz: false, puerta: false, especial: false },
    { luz: false, puerta: false, especial: false },
    { luz: false, puerta: false, especial: false }
  ]);

  // ESTADOS DE LOS SEIS POSTES
  const [postes, setPostes] = useState([
    false, false, false, false, false, false
  ]);

  // REGISTRAR USUARIOS
  const registrarUsuario = (nombre, nuevoUsuario, nuevaContrasena) => {

    const nombreLimpio = nombre.trim();
    const nombreUsuario = nuevoUsuario.trim().toLowerCase();

    if (!nombreLimpio || !nombreUsuario || !nuevaContrasena) {
      Alert.alert('Error', 'Completa todos los campos');
      return;
    }

    const existe = usuariosRegistrados.some(
      persona => persona.usuario === nombreUsuario
    );

    if (
      existe ||
      nombreUsuario === 'admin' ||
      nombreUsuario === 'usuario'
    ) {
      Alert.alert('Error', 'Ese nombre de usuario ya existe');
      return;
    }

    const persona = {
      nombre: nombreLimpio,
      usuario: nombreUsuario,
      contrasena: nuevaContrasena,
      casa: 0
    };

    setUsuariosRegistrados(anteriores => [
      ...anteriores,
      persona
    ]);

    Alert.alert('Registro exitoso', 'Tu cuenta fue creada correctamente');

    setUsuario(nombreUsuario);
    setContrasena('');
    setTipoCuenta('usuario');
    setMostrarRegistro(false);
  };

  // INICIAR SESION
  const iniciarSesion = () => {

    const nombreUsuario = usuario.trim().toLowerCase();

    if (!nombreUsuario || !contrasena) {
      Alert.alert('Error', 'Ingresa tu usuario y contraseña');
      return;
    }

    // ADMINISTRADOR DE PRUEBA
    if (tipoCuenta === 'admin') {

      if (nombreUsuario === 'admin' && contrasena === '1234') {
        setRol('admin');
      } else {
        Alert.alert(
          'Acceso denegado',
          'Los datos del administrador son incorrectos'
        );
      }

      return;
    }

    // USUARIO NORMAL DE PRUEBA
    if (nombreUsuario === 'usuario' && contrasena === '1234') {
      setCasaAsignada(0);
      setRol('usuario');
      return;
    }

    // NO PERMITIR QUE ADMIN ENTRE COMO USUARIO
    if (nombreUsuario === 'admin') {
      Alert.alert(
        'Error',
        'Selecciona la opción Administrador'
      );
      return;
    }

    // BUSCAR USUARIOS REGISTRADOS
    const encontrado = usuariosRegistrados.find(
      persona =>
        persona.usuario === nombreUsuario &&
        persona.contrasena === contrasena
    );

    if (encontrado) {
      setCasaAsignada(encontrado.casa);
      setRol('usuario');
    } else {
      Alert.alert('Error', 'Usuario o contraseña incorrectos');
    }
  };

  // CERRAR SESION
  const cerrarSesion = () => {
    setRol('');
    setUsuario('');
    setContrasena('');
    setTipoCuenta('usuario');
    setMostrarRegistro(false);
  };

  // CAMBIAR ESTADO DE UNA CASA
  const cambiarEstado = (numeroCasa, componente) => {

    // EL USUARIO SOLO CONTROLA SU CASA
    if (rol === 'usuario' && numeroCasa !== casaAsignada) {
      return;
    }

    setCasas(anteriores =>
      anteriores.map((casa, index) => {

        if (index === numeroCasa) {
          return {
            ...casa,
            [componente]: !casa[componente]
          };
        }

        return casa;
      })
    );
  };

  // CAMBIAR ESTADO DE UN POSTE
  const cambiarPoste = (numeroPoste) => {

    if (rol !== 'admin') {
      return;
    }

    setPostes(anteriores =>
      anteriores.map((estado, index) =>
        index === numeroPoste ? !estado : estado
      )
    );
  };

  // MOSTRAR LOS CONTROLES DE CADA CASA
  const mostrarCasa = (numeroCasa) => {

    const casa = casas[numeroCasa];
    const tieneVentana = numeroCasa < 2;

    return (
      <View style={styles.tarjeta} key={numeroCasa}>

        {/* TITULO DE LA CASA */}

        <View style={styles.encabezadoCasa}>

          <View style={styles.iconoCasa}>
            <Ionicons
              name="home-outline"
              size={26}
              color="#2563EB"
            />
          </View>

          <View style={styles.flexible}>
            <Text style={styles.nombreCasa}>
              Casa {numeroCasa + 1}
              {numeroCasa === 3 ? ' Premium' : ''}
            </Text>

            <Text style={styles.descripcion}>
              Controles inteligentes
            </Text>
          </View>

        </View>

        {/* CONTROL DE LUCES */}

        <View style={styles.filaControl}>

          <View style={styles.iconoControl}>
            <Ionicons
              name={casa.luz ? 'bulb' : 'bulb-outline'}
              size={25}
              color="#2563EB"
            />
          </View>

          <View style={styles.infoControl}>
            <Text style={styles.nombreControl}>
              Iluminación
            </Text>

            <Text style={styles.estadoControl}>
              {casa.luz ? 'Encendida' : 'Apagada'}
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.botonControl,
              casa.luz && styles.botonApagar
            ]}
            onPress={() => cambiarEstado(numeroCasa, 'luz')}
          >
            <Text style={styles.textoBoton}>
              {casa.luz ? 'Apagar' : 'Encender'}
            </Text>
          </TouchableOpacity>

        </View>

        {/* CONTROL DE PUERTAS */}

        <View style={styles.filaControl}>

          <View style={styles.iconoControl}>
            <MaterialCommunityIcons
              name={casa.puerta ? 'door-open' : 'door-closed'}
              size={26}
              color="#2563EB"
            />
          </View>

          <View style={styles.infoControl}>
            <Text style={styles.nombreControl}>
              Puerta
            </Text>

            <Text style={styles.estadoControl}>
              {casa.puerta ? 'Abierta' : 'Cerrada'}
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.botonControl,
              casa.puerta && styles.botonApagar
            ]}
            onPress={() => cambiarEstado(numeroCasa, 'puerta')}
          >
            <Text style={styles.textoBoton}>
              {casa.puerta ? 'Cerrar' : 'Abrir'}
            </Text>
          </TouchableOpacity>

        </View>

        {/* CONTROL DE VENTANA O TENDEDERO */}

        <View style={styles.filaControl}>

          <View style={styles.iconoControl}>

            {tieneVentana ? (

              <MaterialCommunityIcons
                name={casa.especial ? 'window-open' : 'window-closed'}
                size={26}
                color="#2563EB"
              />

            ) : (

              <Ionicons
                name="shirt-outline"
                size={25}
                color="#2563EB"
              />

            )}

          </View>

          <View style={styles.infoControl}>

            <Text style={styles.nombreControl}>
              {tieneVentana ? 'Ventana' : 'Tendedero'}
            </Text>

            <Text style={styles.estadoControl}>
              {tieneVentana
                ? (casa.especial ? 'Abierta' : 'Cerrada')
                : (casa.especial ? 'Extendido' : 'Guardado')}
            </Text>

          </View>

          <TouchableOpacity
            style={[
              styles.botonControl,
              casa.especial && styles.botonApagar
            ]}
            onPress={() => cambiarEstado(numeroCasa, 'especial')}
          >

            <Text style={styles.textoBoton}>
              {tieneVentana
                ? (casa.especial ? 'Cerrar' : 'Abrir')
                : (casa.especial ? 'Guardar' : 'Extender')}
            </Text>

          </TouchableOpacity>

        </View>

      </View>
    );
  };

  // PANTALLA DE REGISTRO
  if (rol === '' && mostrarRegistro) {

    return (
      <Registro
        registrar={registrarUsuario}
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

  // PANELES DE ADMINISTRADOR Y USUARIO
  return (

    <ScrollView
      style={styles.fondo}
      contentContainerStyle={styles.contenido}
    >

      {/* ENCABEZADO */}

      <View style={styles.encabezado}>

        <View style={styles.logoPrincipal}>

          <Ionicons
            name={
              rol === 'admin'
                ? 'shield-checkmark-outline'
                : 'person-outline'
            }
            size={37}
            color="#FFFFFF"
          />

        </View>

        <Text style={styles.titulo}>
          {rol === 'admin'
            ? 'Panel Administrador'
            : 'Mi Casa Inteligente'}
        </Text>

        <Text style={styles.subtitulo}>
          {rol === 'admin'
            ? 'Control general de la colonia'
            : 'Bienvenido a tu hogar inteligente'}
        </Text>

      </View>

      {/* PANEL ADMINISTRADOR */}

      {rol === 'admin' ? (

        <View>

          <View style={styles.encabezadoSeccion}>

            <Ionicons
              name="home-outline"
              size={25}
              color="#1E3A8A"
            />

            <Text style={styles.tituloSeccion}>
              Casas inteligentes
            </Text>

          </View>

          {casas.map((casa, index) => mostrarCasa(index))}

          {/* ALUMBRADO PUBLICO */}

          <View style={styles.encabezadoSeccion}>

            <Ionicons
              name="bulb-outline"
              size={25}
              color="#1E3A8A"
            />

            <Text style={styles.tituloSeccion}>
              Alumbrado público
            </Text>

          </View>

          <View style={styles.tarjeta}>

            {postes.map((encendido, index) => (

              <View
                key={index}
                style={styles.filaControl}
              >

                <View style={styles.iconoControl}>

                  <Ionicons
                    name={encendido ? 'bulb' : 'bulb-outline'}
                    size={25}
                    color="#2563EB"
                  />

                </View>

                <View style={styles.infoControl}>

                  <Text style={styles.nombreControl}>
                    Poste {index + 1}
                  </Text>

                  <Text style={styles.estadoControl}>
                    {encendido ? 'Encendido' : 'Apagado'}
                  </Text>

                </View>

                <TouchableOpacity
                  style={[
                    styles.botonControl,
                    encendido && styles.botonApagar
                  ]}
                  onPress={() => cambiarPoste(index)}
                >

                  <Text style={styles.textoBoton}>
                    {encendido ? 'Apagar' : 'Encender'}
                  </Text>

                </TouchableOpacity>

              </View>

            ))}

            {/* ENCENDER TODOS LOS POSTES */}

            <TouchableOpacity
              style={styles.botonTodos}
              onPress={() => setPostes(Array(6).fill(true))}
            >

              <Ionicons
                name="flash-outline"
                size={21}
                color="#FFFFFF"
              />

              <Text style={styles.textoBotonGrande}>
                Encender todos los postes
              </Text>

            </TouchableOpacity>

            {/* APAGAR TODOS LOS POSTES */}

            <TouchableOpacity
              style={styles.botonTodosApagar}
              onPress={() => setPostes(Array(6).fill(false))}
            >

              <Ionicons
                name="power-outline"
                size={21}
                color="#334155"
              />

              <Text style={styles.textoApagarTodos}>
                Apagar todos los postes
              </Text>

            </TouchableOpacity>

          </View>

        </View>

      ) : (

        // PANEL DEL USUARIO NORMAL

        <View>

          <View style={styles.encabezadoSeccion}>

            <Ionicons
              name="home-outline"
              size={25}
              color="#1E3A8A"
            />

            <Text style={styles.tituloSeccion}>
              Mi vivienda
            </Text>

          </View>

          <View style={styles.avisoUsuario}>

            <Ionicons
              name="information-circle-outline"
              size={22}
              color="#2563EB"
            />

            <Text style={styles.textoAviso}>
              Puedes controlar las funciones de tu casa asignada.
            </Text>

          </View>

          {mostrarCasa(casaAsignada)}

        </View>

      )}

      {/* CERRAR SESION */}

      <TouchableOpacity
        style={styles.botonSalir}
        onPress={cerrarSesion}
      >

        <Ionicons
          name="log-out-outline"
          size={22}
          color="#FFFFFF"
        />

        <Text style={styles.textoSalir}>
          Cerrar sesión
        </Text>

      </TouchableOpacity>

      <Text style={styles.pie}>
        Colonia Domótica Inteligente
      </Text>

    </ScrollView>
  );
}

// ESTILOS

const styles = StyleSheet.create({

  fondo: {
    flex: 1,
    backgroundColor: '#EDF4FF'
  },

  contenido: {
    paddingHorizontal: 18,
    paddingTop: 48,
    paddingBottom: 35
  },

  encabezado: {
    alignItems: 'center',
    marginBottom: 25
  },

  logoPrincipal: {
    width: 75,
    height: 75,
    backgroundColor: '#2563EB',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15
  },

  titulo: {
    fontSize: 27,
    fontWeight: 'bold',
    color: '#1E3A8A',
    textAlign: 'center'
  },

  subtitulo: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6
  },

  encabezadoSeccion: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 15,
    gap: 10
  },

  tituloSeccion: {
    fontSize: 21,
    fontWeight: 'bold',
    color: '#1E3A8A'
  },

  tarjeta: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    marginBottom: 18,
    elevation: 3,
    shadowColor: '#000000',
    shadowOpacity: 0.07,
    shadowRadius: 6
  },

  encabezadoCasa: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 12
  },

  iconoCasa: {
    width: 49,
    height: 49,
    backgroundColor: '#DBEAFE',
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center'
  },

  flexible: {
    flex: 1
  },

  nombreCasa: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E3A8A'
  },

  descripcion: {
    color: '#64748B',
    fontSize: 13,
    marginTop: 3
  },

  filaControl: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#EDF2F7',
    paddingVertical: 15,
    gap: 10
  },

  iconoControl: {
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

  nombreControl: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#334155'
  },

  estadoControl: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4
  },

  botonControl: {
    backgroundColor: '#2563EB',
    borderRadius: 9,
    paddingVertical: 11,
    paddingHorizontal: 12,
    minWidth: 80,
    alignItems: 'center'
  },

  botonApagar: {
    backgroundColor: '#475569'
  },

  textoBoton: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFFFFF'
  },

  botonTodos: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    borderRadius: 11,
    padding: 15,
    gap: 9,
    marginTop: 12
  },

  botonTodosApagar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E2E8F0',
    borderRadius: 11,
    padding: 15,
    gap: 9,
    marginTop: 10
  },

  textoBotonGrande: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold'
  },

  textoApagarTodos: {
    color: '#334155',
    fontSize: 15,
    fontWeight: 'bold'
  },

  avisoUsuario: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DBEAFE',
    padding: 14,
    borderRadius: 12,
    gap: 10,
    marginBottom: 17
  },

  textoAviso: {
    flex: 1,
    color: '#1D4ED8',
    fontSize: 14
  },

  botonSalir: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC2626',
    borderRadius: 12,
    padding: 16,
    gap: 10,
    marginTop: 10
  },

  textoSalir: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: 'bold'
  },

  pie: {
    textAlign: 'center',
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 24
  }

});
