
import React, { useRef, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, Modal,
  ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// IP de la computadora. La última que mostró Expo fue 192.168.1.26.
const URL_API = 'http://192.168.1.8:3001/chat';

export default function Chatbot({ rol, casas, postes, casaAsignada }) {
  const [abierto, setAbierto] = useState(false);
  const [pregunta, setPregunta] = useState('');
  const [cargando, setCargando] = useState(false);
  const [mensajes, setMensajes] = useState([
    {
      role: 'assistant',
      content: '¡Hola! Bienvenido a DomotiBot IA, tu asistente virtual de Colonia Domótica Inteligente. Estoy aquí para ayudarte con las funciones de tu hogar inteligente y responder tus preguntas sobre la colonia. ¿En qué puedo ayudarte hoy?'
    }
  ]);
  const scrollRef = useRef(null);

  // Enviar al bot el estado que puede consultar cada tipo de usuario.
  const obtenerEstado = () => {
    if (rol === 'admin') {
      return {
        casas: casas.map((casa, i) => ({
          numero: i + 1,
          luz: casa.luz ? 'Encendida' : 'Apagada',
          puerta: casa.puerta ? 'Abierta' : 'Cerrada',
          componenteEspecial: i < 2 ? 'Ventana' : 'Tendedero',
          estadoEspecial: i < 2
            ? (casa.especial ? 'Abierta' : 'Cerrada')
            : (casa.especial ? 'Extendido' : 'Guardado')
        })),
        postesEncendidos: postes.filter(Boolean).length,
        totalPostes: postes.length
      };
    }

    const casa = casas[casaAsignada];
    const ventana = casaAsignada < 2;
    return {
      numeroCasa: casaAsignada + 1,
      luz: casa?.luz ? 'Encendida' : 'Apagada',
      puerta: casa?.puerta ? 'Abierta' : 'Cerrada',
      componenteEspecial: ventana ? 'Ventana' : 'Tendedero',
      estadoEspecial: ventana
        ? (casa?.especial ? 'Abierta' : 'Cerrada')
        : (casa?.especial ? 'Extendido' : 'Guardado')
    };
  };

  const enviarMensaje = async () => {
    const texto = pregunta.trim();
    if (!texto || cargando) return;

    const nuevosMensajes = [
      ...mensajes,
      { role: 'user', content: texto }
    ];
    setMensajes(nuevosMensajes);
    setPregunta('');
    setCargando(true);

    try {
      const respuesta = await fetch(URL_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mensajes: nuevosMensajes,
          rol: rol,
          estado: obtenerEstado()
        })
      });

      const datos = await respuesta.json();
      if (!respuesta.ok) {
        throw new Error(datos.error || 'El servidor no respondió.');
      }
      if (typeof datos.respuesta !== 'string' || !datos.respuesta.trim()) {
        throw new Error('El servidor no devolvió un mensaje.');
      }

      setMensajes(anteriores => [
        ...anteriores,
        { role: 'assistant', content: datos.respuesta }
      ]);
    } catch (error) {
      setMensajes(anteriores => [
        ...anteriores,
        {
          role: 'assistant',
          content: 'No pude conectarme con la inteligencia artificial.\n\n' +
            'Comprueba que Ollama y el servidor estén funcionando.\n\n' +
            'Detalle: ' + error.message
        }
      ]);
    } finally {
      setCargando(false);
    }
  };

  return (
    <>
      {/* BOTON FLOTANTE */}
      <TouchableOpacity
        style={styles.botonFlotante}
        onPress={() => setAbierto(true)}
        activeOpacity={0.8}
      >
        <Ionicons name="chatbubbles-outline" size={24} color="#FFFFFF" />
        <Text style={styles.textoFlotante}>DomotiBot IA</Text>
      </TouchableOpacity>

      {/* VENTANA DEL CHAT */}
      <Modal
        visible={abierto}
        transparent={true}
        animationType="slide"
        statusBarTranslucent={false}
        onRequestClose={() => setAbierto(false)}
      >
        <KeyboardAvoidingView
          style={styles.fondoModal}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.ventanaChat}>
            <View style={styles.encabezado}>
              <View style={styles.iconoBot}>
                <Ionicons name="chatbubbles-outline" size={27} color="#FFFFFF" />
              </View>
              <View style={styles.informacionBot}>
                <Text style={styles.titulo}>DomotiBot IA</Text>
                <Text style={styles.subtitulo}>Asistente de Colonia Domótica</Text>
              </View>
              <TouchableOpacity onPress={() => setAbierto(false)}>
                <Ionicons name="close-outline" size={28} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* MENSAJES */}
            <ScrollView
              ref={scrollRef}
              style={styles.areaMensajes}
              contentContainerStyle={styles.contenidoMensajes}
              keyboardShouldPersistTaps="handled"
              onContentSizeChange={() =>
                scrollRef.current?.scrollToEnd({ animated: true })
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
                      mensaje.role === 'user' && styles.textoUsuario
                    ]}
                  >
                    {mensaje.content}
                  </Text>
                </View>
              ))}

              {cargando && (
                <View style={styles.escribiendo}>
                  <ActivityIndicator size="small" color="#35C8F4" />
                  <Text style={styles.textoEscribiendo}>
                    DomotiBot está pensando...
                  </Text>
                </View>
              )}
            </ScrollView>

            {/* ENVIAR PREGUNTAS */}
            <View style={styles.filaMensaje}>
              <TextInput
                style={styles.entrada}
                placeholder="Escribe tu pregunta..."
                placeholderTextColor="#8293A8"
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
                <Ionicons name="send" size={21} color="#FFFFFF" />
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
    position: 'absolute', right: 16, bottom: 92,
    backgroundColor: '#087EA4', flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14, paddingHorizontal: 18, borderRadius: 30,
    gap: 8, elevation: 10, zIndex: 100, borderWidth: 1,
    borderColor: '#35C8F4'
  },
  textoFlotante: {
    color: '#FFFFFF', fontSize: 14, fontWeight: '800'
  },
  fondoModal: {
    flex: 1, backgroundColor: 'rgba(3,10,18,0.78)',
    justifyContent: 'flex-end'
  },
  ventanaChat: {
    height: '83%', backgroundColor: '#0D1A2A',
    borderTopLeftRadius: 25, borderTopRightRadius: 25,
    overflow: 'hidden', borderWidth: 1, borderColor: '#29445D'
  },
  encabezado: {
    backgroundColor: '#123B59', padding: 17,
    flexDirection: 'row', alignItems: 'center', gap: 11,
    borderBottomWidth: 1, borderBottomColor: '#24799A'
  },
  iconoBot: {
    width: 46, height: 46, borderRadius: 15,
    backgroundColor: '#087EA4', alignItems: 'center', justifyContent: 'center'
  },
  informacionBot: { flex: 1 },
  titulo: { color: '#FFFFFF', fontSize: 19, fontWeight: '800' },
  subtitulo: { color: '#9CDFF0', fontSize: 12, marginTop: 4 },
  areaMensajes: { flex: 1, backgroundColor: '#0A1625' },
  contenidoMensajes: { padding: 15, paddingBottom: 25 },
  burbuja: {
    maxWidth: '85%', padding: 14, borderRadius: 17, marginBottom: 12
  },
  burbujaUsuario: {
    alignSelf: 'flex-end', backgroundColor: '#087EA4',
    borderBottomRightRadius: 5
  },
  burbujaBot: {
    alignSelf: 'flex-start', backgroundColor: '#1A2B3E',
    borderBottomLeftRadius: 5, borderWidth: 1, borderColor: '#2A4056'
  },
  textoMensaje: { color: '#EAF2F8', fontSize: 14, lineHeight: 21 },
  textoUsuario: { color: '#FFFFFF' },
  escribiendo: {
    flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12
  },
  textoEscribiendo: { color: '#91A5BA', fontSize: 13 },
  filaMensaje: {
    flexDirection: 'row', alignItems: 'center', padding: 12,
    gap: 9, borderTopWidth: 1, borderTopColor: '#20354B',
    backgroundColor: '#0D1A2A'
  },
  entrada: {
    flex: 1, backgroundColor: '#17283B', borderRadius: 13,
    paddingHorizontal: 14, paddingVertical: 11,
    color: '#F3F8FC', fontSize: 14, maxHeight: 100,
    borderWidth: 1, borderColor: '#2A4056'
  },
  botonEnviar: {
    width: 47, height: 47, backgroundColor: '#087EA4',
    borderRadius: 14, alignItems: 'center', justifyContent: 'center'
  },
  botonDesactivado: { opacity: 0.5 }
});
