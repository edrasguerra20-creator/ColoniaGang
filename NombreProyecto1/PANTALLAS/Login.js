
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

      {/* LOGO DE LA APLICACION */}

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

      {/* FORMULARIO */}

      <View style={styles.tarjeta}>

        <Text style={styles.tituloFormulario}>
          Bienvenido
        </Text>

        <Text style={styles.descripcion}>
          Inicia sesión para continuar
        </Text>

        {/* SELECCIONAR TIPO DE CUENTA */}

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
                  ? '#2563EB'
                  : '#64748B'
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
                  ? '#2563EB'
                  : '#64748B'
              }
            />

            <Text style={styles.textoRol}>
              Usuario normal
            </Text>

          </TouchableOpacity>

        </View>

        {/* USUARIO */}

        <Text style={styles.etiqueta}>
          Usuario
        </Text>

        <View style={styles.cajaEntrada}>

          <Ionicons
            name="person-outline"
            size={22}
            color="#64748B"
          />

          <TextInput
            style={styles.entrada}
            placeholder="Ingresa tu usuario"
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
            placeholder="Ingresa tu contraseña"
            placeholderTextColor="#94A3B8"
            value={contrasena}
            onChangeText={setContrasena}
            secureTextEntry={true}
          />

        </View>

        {/* BOTON INICIAR SESION */}

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

        {/* REGISTRARSE */}

        <TouchableOpacity
          style={styles.botonRegistro}
          onPress={irRegistro}
        >

          <Ionicons
            name="person-add-outline"
            size={20}
            color="#2563EB"
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
    backgroundColor: '#EDF4FF'
  },

  contenido: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 22
  },

  encabezado: {
    alignItems: 'center',
    marginBottom: 28
  },

  circuloLogo: {
    width: 85,
    height: 85,
    backgroundColor: '#2563EB',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 17
  },

  titulo: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1E3A8A',
    textAlign: 'center'
  },

  subtitulo: {
    color: '#64748B',
    fontSize: 15,
    marginTop: 6,
    textAlign: 'center'
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E3A8A',
    textAlign: 'center'
  },

  descripcion: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 5,
    marginBottom: 26
  },

  etiqueta: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#334155',
    marginBottom: 9
  },

  filaRoles: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 23
  },

  botonRol: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 13,
    paddingVertical: 17,
    paddingHorizontal: 6,
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8FAFC'
  },

  rolActivo: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF'
  },

  textoRol: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#334155',
    textAlign: 'center'
  },

  cajaEntrada: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 54,
    marginBottom: 21,
    gap: 10
  },

  entrada: {
    flex: 1,
    fontSize: 16,
    color: '#1E293B'
  },

  botonIngresar: {
    backgroundColor: '#2563EB',
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginTop: 5
  },

  textoIngresar: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: 'bold'
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
    color: '#2563EB',
    fontSize: 14,
    fontWeight: 'bold'
  },

  pie: {
    textAlign: 'center',
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 28
  }

});
