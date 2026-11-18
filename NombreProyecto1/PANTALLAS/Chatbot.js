
import React, { useRef, useState } from 'react';

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';


// DIRECCION DEL SERVIDOR EN TU COMPUTADORA
// CAMBIA LA IP SI TU COMPUTADORA TIENE OTRA

const URL_API = 'http://192.168.0.10:3001/chat';


export default function Chatbot({
  rol,
  casas,
  postes,
  casaAsignada
}) {

  const [abierto, setAbierto] = useState(false);

  const [pregunta, setPregunta] = useState('');

  const [cargando, setCargando] = useState(false);

  const [mensajes, setMensajes] = useState([
    {
      role: 'assistant',
      content:
        '¡Hola! Soy DomotiBot IA, el asistente inteligente de Colonia Domótica. Podés preguntarme sobre tu casa, tecnología o cualquier tema educativo.'
    }
  ]);

  const scrollRef = useRef(null);


  // OBTENER ESTADOS DE LOS DISPOSITIVOS

  const obtenerEstado = () => {

    // ADMINISTRADOR: TODA LA COLONIA

    if (rol === 'admin') {

      return {

        casas: casas.map((casa, i) => ({

          numero: i + 1,

          luz: casa.luz
            ? 'Encendida'
            : 'Apagada',

          puerta: casa.puerta
            ? 'Abierta'
            : 'Cerrada',

          componenteEspecial:
            i < 2 ? 'Ventana' : 'Tendedero',

          estadoEspecial:
            i < 2
              ? casa.especial
                ? 'Abierta'
                : 'Cerrada'
              : casa.especial
                ? 'Extendido'
                : 'Guardado'

        })),

        postesEncendidos: postes.filter(Boolean).length,

        totalPostes: postes.length

      };
    }


    // RESIDENTE: SOLO SU CASA

    const casa = casas[casaAsignada];

    const ventana = casaAsignada < 2;

    return {

      numeroCasa: casaAsignada + 1,

      luz: casa?.luz
        ? 'Encendida'
        : 'Apagada',

      puerta: casa?.puerta
        ? 'Abierta'
        : 'Cerrada',

      componenteEspecial:
        ventana ? 'Ventana' : 'Tendedero',

      estadoEspecial:
        ventana
          ? casa?.especial
            ? 'Abierta'
            : 'Cerrada'
          : casa?.especial
            ? 'Extendido'
            : 'Guardado'

    };
  };


  // ENVIAR MENSAJE A OLLAMA

  const enviarMensaje = async () => {

    const texto = pregunta.trim();

    if (!texto || cargando) {
      return;
    }

    // AGREGAR LA PREGUNTA AL CHAT

    const nuevosMensajes = [
      ...mensajes,
      {
        role: 'user',
        content: texto
      }
    ];

    setMensajes(nuevosMensajes);

    setPregunta('');

    setCargando(true);


    try {

      // ENVIAR LA PREGUNTA AL SERVIDOR

      const respuesta = await fetch(
        URL_API,
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json'
          },

          body: JSON.stringify({

            mensajes: nuevosMensajes,

            rol: rol,

            estado: obtenerEstado()

          })
        }
      );


      const datos = await respuesta.json();

      if (!respuesta.ok) {

        throw new Error(
          datos.error || 'El servidor no respondió.'
        );

      }


      // MOSTRAR RESPUESTA DE LA IA

      setMensajes(anteriores => [
        ...anteriores,
        {
          role: 'assistant',
          content: datos.respuesta
        }
      ]);

    } catch (error) {

      // MOSTRAR ERROR DE CONEXION

      setMensajes(anteriores => [
        ...anteriores,
        {
          role: 'assistant',
          content:
            'No pude conectarme con la inteligencia artificial.\n\n' +
            'Revisá que Ollama y el servidor estén funcionando.\n\n' +
            'Detalle: ' + error.message
        }
      ]);

    } finally {

      setCargando(false);

    }
  };


  return (
    <>

      {/* BOTON FLOTANTE DE DOMOTIBOT */}

      <TouchableOpacity
        style={styles.botonFlotante}
        onPress={() => setAbierto(true)}
        activeOpacity={0.8}
      >

        <Ionicons
          name="chatbubbles-outline"
          size={24}
          color="#FFFFFF"
        />

        <Text style={styles.textoFlotante}>
          DomotiBot IA
        </Text>

      </TouchableOpacity>


      {/* VENTANA DEL CHATBOT */}

      <Modal
        visible={abierto}
        transparent={true}
        animationType="slide"
        statusBarTranslucent={false}
        onRequestClose={() => setAbierto(false)}
      >

        <KeyboardAvoidingView
          style={styles.fondoModal}
          behavior={
            Platform.OS === 'ios'
              ? 'padding'
              : undefined
          }
        >

          <View style={styles.ventanaChat}>

            {/* ENCABEZADO DEL CHAT */}

            <View style={styles.encabezado}>

              <View style={styles.iconoBot}>

                <Ionicons
                  name="chatbubbles-outline"
                  size={27}
                  color="#FFFFFF"
                />

              </View>

              <View style={styles.informacionBot}>

                <Text style={styles.titulo}>
                  DomotiBot IA
                </Text>

                <Text style={styles.subtitulo}>
                  Asistente de Colonia Domótica
                </Text>

              </View>

              <TouchableOpacity
                onPress={() => setAbierto(false)}
              >

                <Ionicons
                  name="close-outline"
                  size={28}
                  color="#FFFFFF"
                />

              </TouchableOpacity>

            </View>


            {/* CONVERSACION */}

            <ScrollView
              ref={scrollRef}
              style={styles.areaMensajes}
              contentContainerStyle={styles.contenidoMensajes}
              keyboardShouldPersistTaps="handled"
              onContentSizeChange={() =>
                scrollRef.current?.scrollToEnd({
                  animated: true
                })
              }
            >

              {mensajes.map((mensaje, i) => (

                <View
                  key={i}
                  style={[
                    styles.burbuja,

                    mensaje.role === 'user'
                      ? styles.burbujaUsuario
                      : styles.burbujaBot

                  ]}
                >

                  <Text
                    style={[
                      styles.textoMensaje,

                      mensaje.role === 'user' &&
                        styles.textoUsuario

                    ]}
                  >
                    {mensaje.content}
                  </Text>

                </View>

              ))}


              {/* INDICADOR DE RESPUESTA */}

              {cargando && (

                <View style={styles.escribiendo}>

                  <ActivityIndicator
                    size="small"
                    color="#2563EB"
                  />

                  <Text style={styles.textoEscribiendo}>
                    DomotiBot está pensando...
                  </Text>

                </View>

              )}

            </ScrollView>


            {/* ESCRIBIR PREGUNTAS */}

            <View style={styles.filaMensaje}>

              <TextInput
                style={styles.entrada}
                placeholder="Escribí tu pregunta..."
                placeholderTextColor="#94A3B8"
                value={pregunta}
                onChangeText={setPregunta}
                multiline={true}
                maxLength={1000}
                editable={!cargando}
              />

              <TouchableOpacity
                style={[
                  styles.botonEnviar,
                  cargando && styles.botonDesactivado
                ]}
                onPress={enviarMensaje}
                disabled={cargando}
              >

                <Ionicons
                  name="send"
                  size={21}
                  color="#FFFFFF"
                />

              </TouchableOpacity>

            </View>

          </View>

        </KeyboardAvoidingView>

      </Modal>

    </>
  );
}


// ESTILOS DEL CHATBOT

const styles = StyleSheet.create({

  botonFlotante: {
    position: 'absolute',
    right: 16,
    bottom: 92,
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 17,
    borderRadius: 30,
    gap: 8,
    elevation: 10,
    zIndex: 100
  },

  textoFlotante: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold'
  },

  fondoModal: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.5)',
    justifyContent: 'flex-end'
  },

  ventanaChat: {
    height: '83%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden'
  },

  encabezado: {
    backgroundColor: '#2563EB',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },

  iconoBot: {
    width: 45,
    height: 45,
    borderRadius: 13,
    backgroundColor: '#1D4ED8',
    alignItems: 'center',
    justifyContent: 'center'
  },

  informacionBot: {
    flex: 1
  },

  titulo: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: 'bold'
  },

  subtitulo: {
    color: '#DBEAFE',
    fontSize: 12,
    marginTop: 4
  },

  areaMensajes: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },

  contenidoMensajes: {
    padding: 15,
    paddingBottom: 25
  },

  burbuja: {
    maxWidth: '85%',
    padding: 13,
    borderRadius: 15,
    marginBottom: 12
  },

  burbujaUsuario: {
    alignSelf: 'flex-end',
    backgroundColor: '#2563EB'
  },

  burbujaBot: {
    alignSelf: 'flex-start',
    backgroundColor: '#E2E8F0'
  },

  textoMensaje: {
    color: '#1E293B',
    fontSize: 14,
    lineHeight: 21
  },

  textoUsuario: {
    color: '#FFFFFF'
  },

  escribiendo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12
  },

  textoEscribiendo: {
    color: '#64748B',
    fontSize: 13
  },

  filaMensaje: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 9,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#FFFFFF'
  },

  entrada: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingVertical: 10,
    color: '#1E293B',
    fontSize: 14,
    maxHeight: 100
  },

  botonEnviar: {
    width: 47,
    height: 47,
    backgroundColor: '#2563EB',
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center'
  },

  botonDesactivado: {
    opacity: 0.5
  }

});
