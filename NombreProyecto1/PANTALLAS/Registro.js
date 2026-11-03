
import React, { useState } from 'react';

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

export default function Registro({ registrar, volver }) {

  const [nombre, setNombre] = useState('');
  const [usuario, setUsuario] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [confirmar, setConfirmar] = useState('');

  const [mostrarClave, setMostrarClave] = useState(false);

  // VALIDAR REGISTRO
  const guardarRegistro = () => {

    if (
      nombre.trim() === '' ||
      usuario.trim() === '' ||
      contrasena === '' ||
      confirmar === ''
    ) {
      Alert.alert(
        'Campos incompletos',
        'Debes completar todos los campos'
      );
      return;
    }

    if (contrasena.length < 4) {
      Alert.alert(
        'Contraseña corta',
        'La contraseña debe tener al menos 4 caracteres'
      );
      return;
    }

    if (contrasena !== confirmar) {
      Alert.alert(
        'Error',
        'Las contraseñas no coinciden'
      );
      return;
    }

    registrar(nombre, usuario, contrasena);
  };

  return (

    <ScrollView
      style={styles.fondo}
      contentContainerStyle={styles.contenido}
      keyboardShouldPersistTaps="handled"
    >

      {/* ENCABEZADO */}

      <View style={styles.encabezado}>

        <View style={styles.circuloLogo}>

          <Ionicons
            name="person-add-outline"
            size={42}
            color="#FFFFFF"
          />

        </View>

        <Text style={styles.titulo}>
          Crear una cuenta
        </Text>

        <Text style={styles.subtitulo}>
          Colonia Domótica Inteligente
        </Text>

      </View>

      {/* FORMULARIO DE REGISTRO */}

      <View style={styles.tarjeta}>

        <Text style={styles.tituloFormulario}>
          Registro de usuario
        </Text>

        <Text style={styles.descripcion}>
          Completa tus datos para registrarte
        </Text>

        {/* NOMBRE */}

        <Text style={styles.etiqueta}>
          Nombre completo
        </Text>

        <View style={styles.cajaEntrada}>

          <Ionicons
            name="person-outline"
            size={22}
            color="#64748B"
          />

          <TextInput
            style={styles.entrada}
            placeholder="Escribe tu nombre"
            placeholderTextColor="#94A3B8"
            value={nombre}
            onChangeText={setNombre}
          />

        </View>

        {/* USUARIO */}

        <Text style={styles.etiqueta}>
          Nombre de usuario
        </Text>

        <View style={styles.cajaEntrada}>

          <Ionicons
            name="at-outline"
            size={22}
            color="#64748B"
          />

          <TextInput
            style={styles.entrada}
            placeholder="Crea tu usuario"
            placeholderTextColor="#94A3B8"
            value={usuario}
            onChangeText={setUsuario}
            autoCapitalize="none"
            autoCorrect={false}
          />

        </View>

        {/* CONTRASEÑA */}

        <Text style={styles.etiqueta}>
          Contraseña
        </Text>

        <View style={styles.cajaEntrada}>

          <Ionicons
            name="lock-closed-outline"
            size={22}
            color="#64748B"
          />

          <TextInput
            style={styles.entrada}
            placeholder="Crea una contraseña"
            placeholderTextColor="#94A3B8"
            value={contrasena}
            onChangeText={setContrasena}
            secureTextEntry={!mostrarClave}
          />

          <TouchableOpacity
            onPress={() => setMostrarClave(!mostrarClave)}
          >
            <Ionicons
              name={mostrarClave ? 'eye-off-outline' : 'eye-outline'}
              size={22}
              color="#64748B"
            />
          </TouchableOpacity>

        </View>

        {/* CONFIRMAR CONTRASEÑA */}

        <Text style={styles.etiqueta}>
          Confirmar contraseña
        </Text>

        <View style={styles.cajaEntrada}>

          <Ionicons
            name="shield-checkmark-outline"
            size={22}
            color="#64748B"
          />

          <TextInput
            style={styles.entrada}
            placeholder="Repite tu contraseña"
            placeholderTextColor="#94A3B8"
            value={confirmar}
            onChangeText={setConfirmar}
            secureTextEntry={!mostrarClave}
          />

        </View>

        {/* INFORMACION DEL REGISTRO */}

        <View style={styles.aviso}>

          <Ionicons
            name="information-circle-outline"
            size={22}
            color="#2563EB"
          />

          <Text style={styles.textoAviso}>
            Las cuentas nuevas se registran como usuarios normales.
          </Text>

        </View>

        {/* BOTON REGISTRAR */}

        <TouchableOpacity
          style={styles.botonRegistrar}
          onPress={guardarRegistro}
        >

          <Ionicons
            name="checkmark-circle-outline"
            size={23}
            color="#FFFFFF"
          />

          <Text style={styles.textoBoton}>
            Crear cuenta
          </Text>

        </TouchableOpacity>

        {/* VOLVER AL LOGIN */}

        <TouchableOpacity
          style={styles.botonVolver}
          onPress={volver}
        >

          <Ionicons
            name="arrow-back-outline"
            size={20}
            color="#2563EB"
          />

          <Text style={styles.textoVolver}>
            Volver a iniciar sesión
          </Text>

        </TouchableOpacity>

      </View>

      <Text style={styles.pie}>
        Sistema de Control Inteligente
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
    flexGrow: 1,
    justifyContent: 'center',
    padding: 22,
    paddingVertical: 35
  },

  encabezado: {
    alignItems: 'center',
    marginBottom: 27
  },

  circuloLogo: {
    width: 82,
    height: 82,
    borderRadius: 23,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15
  },

  titulo: {
    fontSize: 27,
    color: '#1E3A8A',
    fontWeight: 'bold',
    textAlign: 'center'
  },

  subtitulo: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6
  },

  tarjeta: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 22,
    elevation: 5,
    shadowColor: '#000000',
    shadowOpacity: 0.1,
    shadowRadius: 8
  },

  tituloFormulario: {
    fontSize: 23,
    color: '#1E3A8A',
    fontWeight: 'bold',
    textAlign: 'center'
  },

  descripcion: {
    color: '#64748B',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 25,
    marginTop: 6
  },

  etiqueta: {
    color: '#334155',
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 9
  },

  cajaEntrada: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 13,
    height: 54,
    marginBottom: 20,
    gap: 10
  },

  entrada: {
    flex: 1,
    fontSize: 16,
    color: '#1E293B'
  },

  aviso: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DBEAFE',
    borderRadius: 11,
    padding: 12,
    marginBottom: 22,
    gap: 10
  },

  textoAviso: {
    flex: 1,
    fontSize: 13,
    color: '#1D4ED8'
  },

  botonRegistrar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    padding: 16,
    borderRadius: 12,
    gap: 10
  },

  textoBoton: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: 'bold'
  },

  botonVolver: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 22,
    padding: 8,
    gap: 8
  },

  textoVolver: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: 'bold'
  },

  pie: {
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 25,
    fontSize: 12
  }

});
