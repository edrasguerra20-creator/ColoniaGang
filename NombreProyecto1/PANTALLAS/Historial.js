import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Pantalla de consulta: los datos vienen de App.js y ya están guardados allí.
export default function Historial({ actividades, esAdmin }) {
  const [filtro, setFiltro] = useState('todos');

  const visibles = filtro === 'todos'
    ? actividades
    : actividades.filter(item => item.categoria === filtro);

  return (
    <View>
      <Text style={styles.titulo}>Historial de actividades</Text>
      <Text style={styles.subtitulo}>
        {esAdmin
          ? 'Movimientos registrados en esta colonia desde este dispositivo.'
          : 'Tus acciones registradas desde este dispositivo.'}
      </Text>

      <View style={styles.resumen}>
        <Ionicons name="time-outline" size={23} color="#2563EB" />
        <View style={{ flex: 1 }}>
          <Text style={styles.resumenNumero}>{actividades.length} actividades</Text>
          <Text style={styles.resumenTexto}>Se conservan las últimas 100 en este teléfono.</Text>
        </View>
      </View>

      {esAdmin && (
        <View style={styles.filtros}>
          {[
            { id: 'todos', texto: 'Todos' },
            { id: 'casas', texto: 'Casas' },
            { id: 'postes', texto: 'Postes' }
          ].map(opcion => (
            <TouchableOpacity
              key={opcion.id}
              style={[styles.filtro, filtro === opcion.id && styles.filtroActivo]}
              onPress={() => setFiltro(opcion.id)}
            >
              <Text style={[
                styles.textoFiltro,
                filtro === opcion.id && styles.textoFiltroActivo
              ]}>
                {opcion.texto}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {visibles.length === 0 ? (
        <View style={styles.vacio}>
          <Ionicons name="calendar-outline" size={38} color="#94A3B8" />
          <Text style={styles.vacioTitulo}>Todavía no hay actividades</Text>
          <Text style={styles.vacioTexto}>
            Prueba encender una luz o cambiar un control y luego vuelve aquí.
          </Text>
        </View>
      ) : (
        visibles.map(item => (
          <View style={styles.evento} key={item.id}>
            <View style={styles.icono}>
              <Ionicons
                name={item.categoria === 'postes' ? 'bulb-outline' : 'home-outline'}
                size={22}
                color="#2563EB"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.accion}>{item.descripcion}</Text>
              <Text style={styles.detalle}>
                {item.autor || item.usuario} · {item.modo}
              </Text>
              <Text style={styles.fecha}>
                {new Date(item.fecha).toLocaleString('es-GT')}
              </Text>
            </View>
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  titulo: {
    color: '#1E3A8A', fontSize: 23, fontWeight: 'bold', marginBottom: 5
  },
  subtitulo: {
    color: '#64748B', fontSize: 13, marginBottom: 16
  },
  resumen: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#DBEAFE', padding: 15, borderRadius: 14,
    marginBottom: 16
  },
  resumenNumero: { color: '#1E3A8A', fontSize: 18, fontWeight: 'bold' },
  resumenTexto: { color: '#475569', fontSize: 12, marginTop: 3 },
  filtros: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  filtro: {
    flex: 1, paddingVertical: 10, alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 10,
    borderWidth: 1, borderColor: '#CBD5E1'
  },
  filtroActivo: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  textoFiltro: { fontWeight: 'bold', color: '#475569', fontSize: 13 },
  textoFiltroActivo: { color: '#FFFFFF' },
  vacio: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 28,
    alignItems: 'center', gap: 9
  },
  vacioTitulo: { color: '#1E3A8A', fontWeight: 'bold', fontSize: 16 },
  vacioTexto: { color: '#64748B', textAlign: 'center', fontSize: 13 },
  evento: {
    backgroundColor: '#FFFFFF', padding: 14, marginBottom: 10,
    borderRadius: 14, flexDirection: 'row', gap: 12, alignItems: 'flex-start',
    elevation: 1
  },
  icono: {
    backgroundColor: '#EFF6FF', width: 42, height: 42,
    borderRadius: 12, alignItems: 'center', justifyContent: 'center'
  },
  accion: { color: '#1E3A8A', fontSize: 14, fontWeight: 'bold' },
  detalle: { color: '#475569', fontSize: 12, marginTop: 5 },
  fecha: { color: '#94A3B8', fontSize: 11, marginTop: 5 }
});
