
import React, { useState } from 'react';

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

export default function Registro({
  registrar,
  volver,
  casasOcupadas = []
}) {

  const [nombre, setNombre] = useState('');
  const [usuario, setUsuario] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [casaElegida, setCasaElegida] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [verClave, setVerClave] = useState(false);

  // VALIDAR EL REGISTRO
  const guardar = async () => {

    if (!nombre.trim() || !usuario.trim() ||
        !contrasena || !confirmacion) {
      Alert.alert('Error', 'Completa todos los campos.');
      return;
    }

    if (contrasena.length < 4) {
      Alert.alert(
        'Error',
        'La contraseña debe tener al menos cuatro caracteres.'
      );
      return;
    }

    if (contrasena !== confirmacion) {
      Alert.alert('Error', 'Las contraseñas no coinciden.');
      return;
    }

    if (
      casaElegida === null ||
      casasOcupadas.includes(casaElegida)
    ) {
      Alert.alert('Error', 'Selecciona una casa disponible.');
      return;
    }

    setGuardando(true);

    try {
      await registrar(
        nombre,
        usuario,
        contrasena,
        casaElegida
      );
    } finally {
      setGuardando(false);
    }
  };

  return (

    <ScrollView
      style={styles.fondo}
      contentContainerStyle={styles.contenido}
      keyboardShouldPersistTaps="handled"
    >

      <View style={styles.encabezado}>

        <View style={styles.logo}>
          <Ionicons
            name="person-add-outline"
            size={38}
            color="#FFFFFF"
          />
        </View>

        <Text style={styles.titulo}>
          Crear una cuenta
        </Text>

        <Text style={styles.descripcion}>
          Elige la casa que quieres adquirir
        </Text>

      </View>

      <View style={styles.tarjeta}>

        {/* NOMBRE COMPLETO */}

        <Text style={styles.etiqueta}>
          Nombre completo
        </Text>

        <View style={styles.entradaConIcono}>
          <Ionicons
            name="person-outline"
            size={21}
            color="#64748B"
          />

          <TextInput
            style={styles.entrada}
            placeholder="Tu nombre"
            value={nombre}
            onChangeText={setNombre}
          />
        </View>

        {/* NOMBRE DE USUARIO */}

        <Text style={styles.etiqueta}>
          Usuario
        </Text>

        <View style={styles.entradaConIcono}>
          <Ionicons
            name="at-outline"
            size={21}
            color="#64748B"
          />

          <TextInput
            style={styles.entrada}
            placeholder="Elige un usuario"
            autoCapitalize="none"
            autoCorrect={false}
            value={usuario}
            onChangeText={setUsuario}
          />
        </View>

        {/* CONTRASEÑA */}

        <Text style={styles.etiqueta}>
          Contraseña
        </Text>

        <View style={styles.entradaConIcono}>
          <Ionicons
            name="lock-closed-outline"
            size={21}
            color="#64748B"
          />

          <TextInput
            style={styles.entrada}
            placeholder="Contraseña"
            secureTextEntry={!verClave}
            value={contrasena}
            onChangeText={setContrasena}
          />

          <TouchableOpacity
            onPress={() => setVerClave(!verClave)}
          >
            <Ionicons
              name={
                verClave
                  ? 'eye-off-outline'
                  : 'eye-outline'
              }
              size={21}
              color="#64748B"
            />
          </TouchableOpacity>
        </View>

        {/* CONFIRMAR CONTRASEÑA */}

        <Text style={styles.etiqueta}>
          Confirmar contraseña
        </Text>

        <View style={styles.entradaConIcono}>
          <Ionicons
            name="shield-checkmark-outline"
            size={21}
            color="#64748B"
          />

          <TextInput
            style={styles.entrada}
            placeholder="Repite tu contraseña"
            secureTextEntry={!verClave}
            value={confirmacion}
            onChangeText={setConfirmacion}
          />
        </View>

        {/* ELEGIR UNA DE LAS CUATRO CASAS */}

        <Text style={styles.subtitulo}>
          Selecciona tu casa
        </Text>

        <View style={styles.cuadricula}>

          {[0, 1, 2, 3].map(i => {

            const ocupada = casasOcupadas.includes(i);
            const seleccionada = casaElegida === i;

            return (

              <TouchableOpacity
                key={i}
                disabled={ocupada || guardando}
                onPress={() => setCasaElegida(i)}
                style={[
                  styles.casa,
                  seleccionada && styles.casaSeleccionada,
                  ocupada && styles.casaOcupada
                ]}
              >

                <Ionicons
                  name={
                    ocupada
                      ? 'lock-closed-outline'
                      : 'home-outline'
                  }
                  size={29}
                  color={
                    ocupada
                      ? '#94A3B8'
                      : '#2563EB'
                  }
                />

                <Text style={styles.nombreCasa}>
                  Casa {i + 1}
                </Text>

                <Text style={styles.detalleCasa}>
                  {i === 3
                    ? 'Premium'
                    : i < 2
                      ? 'Con ventana'
                      : 'Con tendedero'}
                </Text>

                <Text
                  style={[
                    styles.disponibilidad,
                    ocupada && styles.noDisponible
                  ]}
                >
                  {ocupada
                    ? 'Ocupada'
                    : seleccionada
                      ? 'Seleccionada'
                      : 'Disponible'}
                </Text>

              </TouchableOpacity>

            );
          })}

        </View>

        {/* CREAR CUENTA */}

        <TouchableOpacity
          style={styles.boton}
          onPress={guardar}
          disabled={guardando}
        >

          {guardando ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Ionicons
              name="checkmark-circle-outline"
              size={22}
              color="#FFFFFF"
            />
          )}

          <Text style={styles.textoBoton}>
            {guardando ? 'Guardando...' : 'Crear cuenta'}
          </Text>

        </TouchableOpacity>

        {/* REGRESAR */}

        <TouchableOpacity
          style={styles.volver}
          onPress={volver}
          disabled={guardando}
        >

          <Ionicons
            name="arrow-back-outline"
            size={20}
            color="#2563EB"
          />

          <Text style={styles.textoVolver}>
            Volver al inicio de sesión
          </Text>

        </TouchableOpacity>

      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({

  fondo: {
    flex: 1,
    backgroundColor: '#EDF4FF'
  },

  contenido: {
    padding: 20,
    paddingTop: 40,
    paddingBottom: 35
  },

  encabezado: {
    alignItems: 'center',
    marginBottom: 25
  },

  logo: {
    width: 75,
    height: 75,
    backgroundColor: '#2563EB',
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12
  },

  titulo: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1E3A8A'
  },

  descripcion: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 7
  },

  tarjeta: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    elevation: 3
  },

  etiqueta: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#334155',
    marginBottom: 8
  },

  entradaConIcono: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 11,
    paddingHorizontal: 12,
    marginBottom: 18,
    height: 52,
    gap: 9
  },

  entrada: {
    flex: 1,
    fontSize: 15,
    color: '#1E293B'
  },

  subtitulo: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#1E3A8A',
    marginTop: 7,
    marginBottom: 14
  },

  cuadricula: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },

  casa: {
    width: '48%',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 13,
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 5,
    marginBottom: 12
  },

  casaSeleccionada: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF'
  },

  casaOcupada: {
    borderColor: '#E2E8F0',
    backgroundColor: '#F1F5F9',
    opacity: 0.7
  },

  nombreCasa: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E3A8A',
    marginTop: 7
  },

  detalleCasa: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 3
  },

  disponibilidad: {
    fontSize: 12,
    color: '#15803D',
    fontWeight: 'bold',
    marginTop: 8
  },

  noDisponible: {
    color: '#64748B'
  },

  boton: {
    backgroundColor: '#2563EB',
    borderRadius: 11,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    marginTop: 15
  },

  textoBoton: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: 'bold'
  },

  volver: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 21,
    gap: 8
  },

  textoVolver: {
    color: '#2563EB',
    fontWeight: 'bold',
    fontSize: 14
  }

});
