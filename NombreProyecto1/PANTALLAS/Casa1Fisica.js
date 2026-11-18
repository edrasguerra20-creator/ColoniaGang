import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const URL = 'http://192.168.1.8:3002';

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
      style={[styles.boton, { borderColor: color }]}
      onPress={() => enviarOrden(accion)}
      disabled={cargando}
      activeOpacity={0.75}
    >
      <Ionicons name={icono} size={21} color={color} />
      <Text style={[styles.textoBoton, { color: color }]}>
        {texto}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.contenedor}>

      {/* ENCABEZADO */}

      <View style={styles.encabezado}>
        <View style={styles.iconoPrincipal}>
          <Ionicons
            name="hardware-chip-outline"
            size={30}
            color="#35C8F4"
          />
        </View>

        <Text style={styles.etiqueta}>
          SISTEMA DOMÓTICO
        </Text>

        <Text style={styles.titulo}>
          Casa 1 Física
        </Text>

        <Text style={styles.subtitulo}>
          Panel de control de dispositivos
        </Text>
      </View>

      {/* ESTADO GENERAL */}

      <View style={styles.tarjetaEstado}>
        <View style={styles.indicadorEstado} />

        <View style={styles.infoEstado}>
          <Text style={styles.tituloEstado}>
            Control de maqueta
          </Text>
          <Text style={styles.descripcionEstado}>
            Gestiona los dispositivos físicos de tu hogar
          </Text>
        </View>

        <Ionicons
          name="wifi-outline"
          size={23}
          color="#35C8F4"
        />
      </View>

      {/* PUERTA */}

      <View style={styles.tarjeta}>
        <View style={styles.encabezadoSeccion}>
          <View style={styles.iconoSeccion}>
            <Ionicons
              name="door-open-outline"
              size={23}
              color="#35C8F4"
            />
          </View>

          <View>
            <Text style={styles.seccion}>
              Puerta
            </Text>
            <Text style={styles.descripcion}>
              Control de acceso físico
            </Text>
          </View>
        </View>

        <View style={styles.fila}>
          <Boton
            texto="Abrir"
            icono="lock-open-outline"
            accion="PUERTA_ABRIR"
            color="#35C8F4"
          />

          <Boton
            texto="Cerrar"
            icono="lock-closed-outline"
            accion="PUERTA_CERRAR"
            color="#8CA6C0"
          />
        </View>
      </View>

      {/* ILUMINACIÓN */}

      <View style={styles.tarjeta}>
        <View style={styles.encabezadoSeccion}>
          <View style={styles.iconoSeccion}>
            <Ionicons
              name="bulb-outline"
              size={23}
              color="#35C8F4"
            />
          </View>

          <View>
            <Text style={styles.seccion}>
              Iluminación
            </Text>
            <Text style={styles.descripcion}>
              Administración de luces
            </Text>
          </View>
        </View>

        <View style={styles.fila}>
          <Boton
            texto="Encender"
            icono="sunny-outline"
            accion="LUZ_ON"
            color="#35C8F4"
          />

          <Boton
            texto="Apagar"
            icono="moon-outline"
            accion="LUZ_OFF"
            color="#8CA6C0"
          />
        </View>
      </View>

      {/* VENTANA */}

      <View style={styles.tarjeta}>
        <View style={styles.encabezadoSeccion}>
          <View style={styles.iconoSeccion}>
            <Ionicons
              name="albums-outline"
              size={23}
              color="#35C8F4"
            />
          </View>

          <View>
            <Text style={styles.seccion}>
              Ventana
            </Text>
            <Text style={styles.descripcion}>
              Automatización disponible próximamente
            </Text>
          </View>
        </View>

        <View style={styles.aviso}>
          <Ionicons
            name="information-circle-outline"
            size={20}
            color="#F0B95B"
          />

          <Text style={styles.textoAviso}>
            Disponible cuando instalemos la fuente adecuada
            para los dos servomotores.
          </Text>
        </View>
      </View>

      {/* ESTADO DE OPERACIÓN */}

      <View style={styles.panelMensaje}>
        <View style={styles.encabezadoMensaje}>
          <Ionicons
            name="terminal-outline"
            size={19}
            color="#35C8F4"
          />

          <Text style={styles.tituloMensaje}>
            ESTADO DEL SISTEMA
          </Text>
        </View>

        {cargando && (
          <ActivityIndicator
            size="small"
            color="#35C8F4"
            style={styles.cargando}
          />
        )}

        <Text style={styles.mensaje}>
          {mensaje}
        </Text>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({

  contenedor: {
    backgroundColor: '#081321',
    borderRadius: 22,
    padding: 18,
    margin: 12,
    borderWidth: 1,
    borderColor: '#1D354D'
  },

  encabezado: {
    alignItems: 'center',
    marginBottom: 22
  },

  iconoPrincipal: {
    width: 65,
    height: 65,
    borderRadius: 20,
    backgroundColor: '#102B42',
    borderWidth: 1,
    borderColor: '#24799A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 13
  },

  etiqueta: {
    color: '#35C8F4',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2
  },

  titulo: {
    fontSize: 25,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 7
  },

  subtitulo: {
    fontSize: 13,
    color: '#91A5BA',
    textAlign: 'center',
    marginTop: 5
  },

  tarjetaEstado: {
    backgroundColor: '#102438',
    borderRadius: 15,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#23435E',
    gap: 10
  },

  indicadorEstado: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#35C8F4'
  },

  infoEstado: {
    flex: 1
  },

  tituloEstado: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800'
  },

  descripcionEstado: {
    color: '#91A5BA',
    fontSize: 11,
    marginTop: 4
  },

  tarjeta: {
    backgroundColor: '#102033',
    borderRadius: 17,
    padding: 15,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#233D56'
  },

  encabezadoSeccion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 17
  },

  iconoSeccion: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor: '#17364E',
    alignItems: 'center',
    justifyContent: 'center'
  },

  seccion: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF'
  },

  descripcion: {
    fontSize: 11,
    color: '#91A5BA',
    marginTop: 4
  },

  fila: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10
  },

  boton: {
    flex: 1,
    minHeight: 49,
    paddingVertical: 12,
    paddingHorizontal: 7,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 7,
    backgroundColor: '#142A3E',
    borderWidth: 1
  },

  textoBoton: {
    fontSize: 12,
    fontWeight: '800'
  },

  aviso: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor: '#302A20',
    borderRadius: 11,
    padding: 12,
    borderWidth: 1,
    borderColor: '#5B4930'
  },

  textoAviso: {
    color: '#D8C5A5',
    fontSize: 12,
    lineHeight: 19,
    flex: 1
  },

  panelMensaje: {
    backgroundColor: '#0D1D2D',
    borderRadius: 14,
    padding: 15,
    marginTop: 5,
    borderWidth: 1,
    borderColor: '#24445E'
  },

  encabezadoMensaje: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },

  tituloMensaje: {
    color: '#35C8F4',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1
  },

  cargando: {
    marginTop: 12
  },

  mensaje: {
    marginTop: 11,
    color: '#D6E5F2',
    fontSize: 13,
    lineHeight: 20
  }

});