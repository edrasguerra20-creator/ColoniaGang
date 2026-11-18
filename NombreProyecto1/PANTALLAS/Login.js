import React from 'react';

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

export default function Login({
  usuario,
  setUsuario,
  contrasena,
  setContrasena,
  tipoCuenta,
  setTipoCuenta,
  iniciarSesion,
  irRegistro
}) {

  return (
    <ScrollView
      style={styles.fondo}
      contentContainerStyle={styles.contenido}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.encabezado}>
        <View style={styles.circuloLogo}>
          <Ionicons
            name="home-outline"
            size={45}
            color="#FFFFFF"
          />
        </View>

        <Text style={styles.titulo}>
          Colonia Domótica
        </Text>

        <Text style={styles.subtitulo}>
          Sistema de Control Inteligente
        </Text>
      </View>

      <View style={styles.tarjeta}>
        <Text style={styles.tituloFormulario}>
          Bienvenido
        </Text>

        <Text style={styles.descripcion}>
          Inicia sesión para continuar
        </Text>

        <Text style={styles.etiqueta}>
          Tipo de cuenta
        </Text>

        <View style={styles.filaRoles}>
          <TouchableOpacity
            style={[
              styles.botonRol,
              tipoCuenta === 'admin' && styles.rolActivo
            ]}
            onPress={() => setTipoCuenta('admin')}
          >
            <Ionicons
              name="shield-checkmark-outline"
              size={26}
              color={
                tipoCuenta === 'admin'
                  ? '#35C8F4'
                  : '#91A5BA'
              }
            />

            <Text style={styles.textoRol}>
              Administrador
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.botonRol,
              tipoCuenta === 'usuario' && styles.rolActivo
            ]}
            onPress={() => setTipoCuenta('usuario')}
          >
            <Ionicons
              name="person-outline"
              size={26}
              color={
                tipoCuenta === 'usuario'
                  ? '#35C8F4'
                  : '#91A5BA'
              }
            />

            <Text style={styles.textoRol}>
              Usuario normal
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.etiqueta}>
          Usuario
        </Text>

        <View style={styles.cajaEntrada}>
          <Ionicons
            name="person-outline"
            size={22}
            color="#91A5BA"
          />

          <TextInput
            style={styles.entrada}
            placeholder="Ingresa tu usuario"
            placeholderTextColor="#8293A8"
            value={usuario}
            onChangeText={setUsuario}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <Text style={styles.etiqueta}>
          Contraseña
        </Text>

        <View style={styles.cajaEntrada}>
          <Ionicons
            name="lock-closed-outline"
            size={22}
            color="#91A5BA"
          />

          <TextInput
            style={styles.entrada}
            placeholder="Ingresa tu contraseña"
            placeholderTextColor="#8293A8"
            value={contrasena}
            onChangeText={setContrasena}
            secureTextEntry={true}
          />
        </View>

        <TouchableOpacity
          style={styles.botonIngresar}
          onPress={iniciarSesion}
        >
          <Ionicons
            name="log-in-outline"
            size={23}
            color="#FFFFFF"
          />

          <Text style={styles.textoIngresar}>
            Iniciar sesión
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.botonRegistro}
          onPress={irRegistro}
        >
          <Ionicons
            name="person-add-outline"
            size={20}
            color="#35C8F4"
          />

          <Text style={styles.textoRegistro}>
            Crear una cuenta nueva
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.pie}>
        Colonia Domótica Inteligente
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  fondo: {
    flex: 1,
    backgroundColor: '#081321'
  },

  contenido: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 22,
    paddingTop: 42,
    paddingBottom: 35
  },

  encabezado: {
    alignItems: 'center',
    marginBottom: 28
  },

  circuloLogo: {
    width: 88,
    height: 88,
    backgroundColor: '#123B59',
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 17,
    borderWidth: 1,
    borderColor: '#24799A'
  },

  titulo: {
    fontSize: 29,
    fontWeight: '800',
    color: '#F3F8FC',
    textAlign: 'center'
  },

  subtitulo: {
    color: '#91A5BA',
    fontSize: 14,
    marginTop: 7,
    textAlign: 'center'
  },

  tarjeta: {
    backgroundColor: '#111F31',
    borderRadius: 23,
    padding: 22,
    borderWidth: 1,
    borderColor: '#20354B',
    elevation: 7,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 14
  },

  tituloFormulario: {
    fontSize: 24,
    fontWeight: '800',
    color: '#F3F8FC',
    textAlign: 'center'
  },

  descripcion: {
    fontSize: 14,
    color: '#91A5BA',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 25
  },

  etiqueta: {
    fontSize: 14,
    fontWeight: '700',
    color: '#D9E5EF',
    marginBottom: 9
  },

  filaRoles: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 23
  },

  botonRol: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#2A4056',
    borderRadius: 15,
    paddingVertical: 17,
    paddingHorizontal: 6,
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0C1928'
  },

  rolActivo: {
    borderColor: '#35C8F4',
    backgroundColor: '#12334A'
  },

  textoRol: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D9E5EF',
    textAlign: 'center'
  },

  cajaEntrada: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0C1928',
    borderWidth: 1,
    borderColor: '#2A4056',
    borderRadius: 13,
    paddingHorizontal: 14,
    height: 55,
    marginBottom: 20,
    gap: 10
  },

  entrada: {
    flex: 1,
    fontSize: 16,
    color: '#F3F8FC'
  },

  botonIngresar: {
    backgroundColor: '#087EA4',
    paddingVertical: 16,
    borderRadius: 13,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginTop: 6
  },

  textoIngresar: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800'
  },

  botonRegistro: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 23,
    padding: 5
  },

  textoRegistro: {
    color: '#49CFF2',
    fontSize: 14,
    fontWeight: '800'
  },

  pie: {
    textAlign: 'center',
    color: '#71869C',
    fontSize: 12,
    marginTop: 28
  }
});