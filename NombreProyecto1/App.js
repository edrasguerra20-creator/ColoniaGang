
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  StatusBar
} from 'react-native';

export default function App() {

  const [usuario, setUsuario] = useState('');
  const [contrasena, setContrasena] = useState('');

  
const iniciarSesion = () => {
  if (usuario.trim() === 'admin' && contrasena === '1234') {
    Alert.alert('Bienvenido', 'Ingresaste como administrador');
  } else if (usuario.trim() === 'usuario' && contrasena === '1234') {
    Alert.alert('Bienvenido', 'Ingresaste como usuario común');
  } else {
    Alert.alert('Error', 'Usuario o contraseña incorrectos');
  }
};


  return (
    <View style={styles.contenedor}>
      <StatusBar barStyle="dark-content" />

      <Text style={styles.icono}>🏡</Text>

      <Text style={styles.titulo}>
        Colonia Domótica
      </Text>

      <Text style={styles.subtitulo}>
        Sistema Inteligente
      </Text>

      <View style={styles.formulario}>
        <Text style={styles.etiqueta}>Usuario</Text>

        <TextInput
          style={styles.input}
          placeholder="Ingresa tu usuario"
          value={usuario}
          onChangeText={setUsuario}
        />

        <Text style={styles.etiqueta}>Contraseña</Text>

        <TextInput
          style={styles.input}
          placeholder="Ingresa tu contraseña"
          secureTextEntry={true}
          value={contrasena}
          onChangeText={setContrasena}
        />

        <TouchableOpacity
          style={styles.boton}
          onPress={iniciarSesion}
        >
          <Text style={styles.textoBoton}>
            Iniciar sesión
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.pie}>
        Colonia Domótica Inteligente © 2026
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: '#EAF4FF',
    justifyContent: 'center',
    padding: 25,
  },
  icono: {
    fontSize: 65,
    textAlign: 'center',
    marginBottom: 10,
  },
  titulo: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1E3A8A',
    textAlign: 'center',
  },
  subtitulo: {
    fontSize: 17,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 35,
  },
  formulario: {
    backgroundColor: '#FFFFFF',
    padding: 25,
    borderRadius: 18,
    elevation: 5,
  },
  etiqueta: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#334155',
  },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
    fontSize: 16,
  },
  boton: {
    backgroundColor: '#2563EB',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  textoBoton: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: 'bold',
  },
  pie: {
    textAlign: 'center',
    marginTop: 35,
    color: '#64748B',
    fontSize: 12,
  },
});
