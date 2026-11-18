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

        <Text style={styles.etiqueta}>
          Nombre completo
        </Text>

        <View style={styles.entradaConIcono}>
          <Ionicons
            name="person-outline"
            size={21}
            color="#91A5BA"
          />

          <TextInput
            style={styles.entrada}
            placeholder="Tu nombre"
            placeholderTextColor="#8293A8"
            value={nombre}
            onChangeText={setNombre}
          />
        </View>

        <Text style={styles.etiqueta}>
          Usuario
        </Text>

        <View style={styles.entradaConIcono}>
          <Ionicons
            name="at-outline"
            size={21}
            color="#91A5BA"
          />

          <TextInput
            style={styles.entrada}
            placeholder="Elige un usuario"
            placeholderTextColor="#8293A8"
            autoCapitalize="none"
            autoCorrect={false}
            value={usuario}
            onChangeText={setUsuario}
          />
        </View>

        <Text style={styles.etiqueta}>
          Contraseña
        </Text>

        <View style={styles.entradaConIcono}>
          <Ionicons
            name="lock-closed-outline"
            size={21}
            color="#91A5BA"
          />

          <TextInput
            style={styles.entrada}
            placeholder="Contraseña"
            placeholderTextColor="#8293A8"
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
              color="#91A5BA"
            />
          </TouchableOpacity>
        </View>

        <Text style={styles.etiqueta}>
          Confirmar contraseña
        </Text>

        <View style={styles.entradaConIcono}>
          <Ionicons
            name="shield-checkmark-outline"
            size={21}
            color="#91A5BA"
          />

          <TextInput
            style={styles.entrada}
            placeholder="Repite tu contraseña"
            placeholderTextColor="#8293A8"
            secureTextEntry={!verClave}
            value={confirmacion}
            onChangeText={setConfirmacion}
          />
        </View>

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
                      ? '#8293A8'
                      : '#35C8F4'
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

        <TouchableOpacity
          style={styles.volver}
          onPress={volver}
          disabled={guardando}
        >

          <Ionicons
            name="arrow-back-outline"
            size={20}
            color="#35C8F4"
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
    backgroundColor: '#081321'
  },

  contenido: {
    padding: 20,
    paddingTop: 42,
    paddingBottom: 38
  },

  encabezado: {
    alignItems: 'center',
    marginBottom: 25
  },

  logo: {
    width: 78,
    height: 78,
    backgroundColor: '#123B59',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 13,
    borderWidth: 1,
    borderColor: '#24799A'
  },

  titulo: {
    fontSize: 27,
    fontWeight: '800',
    color: '#F3F8FC'
  },

  descripcion: {
    fontSize: 14,
    color: '#91A5BA',
    marginTop: 7
  },

  tarjeta: {
    backgroundColor: '#111F31',
    borderRadius: 21,
    padding: 20,
    borderWidth: 1,
    borderColor: '#20354B',
    elevation: 5
  },

  etiqueta: {
    fontSize: 14,
    fontWeight: '700',
    color: '#D9E5EF',
    marginBottom: 8
  },

  entradaConIcono: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0C1928',
    borderWidth: 1,
    borderColor: '#2A4056',
    borderRadius: 13,
    paddingHorizontal: 13,
    marginBottom: 18,
    height: 53,
    gap: 10
  },

  entrada: {
    flex: 1,
    fontSize: 15,
    color: '#F3F8FC'
  },

  subtitulo: {
    fontSize: 19,
    fontWeight: '800',
    color: '#F3F8FC',
    marginTop: 8,
    marginBottom: 14
  },

  cuadricula: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },

  casa: {
    width: '48%',
    borderWidth: 1,
    borderColor: '#2A4056',
    backgroundColor: '#0C1928',
    borderRadius: 15,
    alignItems: 'center',
    paddingVertical: 17,
    paddingHorizontal: 5,
    marginBottom: 12
  },

  casaSeleccionada: {
    borderColor: '#35C8F4',
    backgroundColor: '#12334A'
  },

  casaOcupada: {
    borderColor: '#27394B',
    backgroundColor: '#172536',
    opacity: 0.58
  },

  nombreCasa: {
    fontSize: 16,
    fontWeight: '800',
    color: '#EAF2F8',
    marginTop: 8
  },

  detalleCasa: {
    fontSize: 12,
    color: '#91A5BA',
    marginTop: 3
  },

  disponibilidad: {
    fontSize: 12,
    color: '#55D6AE',
    fontWeight: '800',
    marginTop: 8
  },

  noDisponible: {
    color: '#8293A8'
  },

  boton: {
    backgroundColor: '#087EA4',
    borderRadius: 13,
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
    fontWeight: '800'
  },

  volver: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
    gap: 8
  },

  textoVolver: {
    color: '#49CFF2',
    fontWeight: '800',
    fontSize: 14
  }

});