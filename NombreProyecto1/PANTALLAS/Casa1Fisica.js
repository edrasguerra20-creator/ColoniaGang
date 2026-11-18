
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const URL = 'http://192.168.0.10:3002';

export default function Casa1Fisica() {

  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState(
    'Control físico de la Casa 1'
  );

  const enviarOrden = async (accion) => {
    setCargando(true);
    setMensaje('Enviando orden...');

    try {
      const respuesta = await fetch(URL + '/control', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ accion })
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(datos.error || 'Error de conexión');
      }

      setMensaje('Orden enviada: ' + accion.replace('_', ' '));

    } catch (error) {
      setMensaje('Error: ' + error.message);
    } finally {
      setCargando(false);
    }
  };

  const Boton = ({ texto, icono, accion, color }) => (
    <TouchableOpacity
      style={[styles.boton, { backgroundColor: color }]}
      onPress={() => enviarOrden(accion)}
      disabled={cargando}
    >
      <Ionicons name={icono} size={22} color="#FFFFFF" />
      <Text style={styles.textoBoton}>{texto}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.contenedor}>

      <Text style={styles.titulo}>
        Control físico - Casa 1
      </Text>

      <Text style={styles.subtitulo}>
        Controla los dispositivos de tu maqueta
      </Text>

      <Text style={styles.seccion}>Puerta</Text>

      <View style={styles.fila}>
        <Boton
          texto="Abrir"
          icono="lock-open-outline"
          accion="PUERTA_ABRIR"
          color="#168A6C"
        />
        <Boton
          texto="Cerrar"
          icono="lock-closed-outline"
          accion="PUERTA_CERRAR"
          color="#335C81"
        />
      </View>

      <Text style={styles.seccion}>Iluminación</Text>

      <View style={styles.fila}>
        <Boton
          texto="Encender"
          icono="bulb-outline"
          accion="LUZ_ON"
          color="#168A6C"
        />
        <Boton
          texto="Apagar"
          icono="moon-outline"
          accion="LUZ_OFF"
          color="#335C81"
        />
      </View>

      <Text style={styles.seccion}>Ventana</Text>

      <Text style={styles.aviso}>
        Disponible cuando instalemos la fuente
        adecuada para los dos servomotores.
      </Text>

      {cargando && (
        <ActivityIndicator
          size="large"
          color="#168A6C"
        />
      )}

      <Text style={styles.mensaje}>{mensaje}</Text>

    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    margin: 12
  },
  titulo: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#17324D',
    textAlign: 'center'
  },
  subtitulo: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 12
  },
  seccion: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#17324D',
    marginTop: 16,
    marginBottom: 10
  },
  fila: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10
  },
  boton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 7
  },
  textoBoton: {
    color: '#FFFFFF',
    fontWeight: 'bold'
  },
  aviso: {
    color: '#777777',
    fontSize: 13
  },
  mensaje: {
    marginTop: 20,
    textAlign: 'center',
    color: '#17324D'
  }
});
