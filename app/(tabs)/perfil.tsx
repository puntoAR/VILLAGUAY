import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { useAuth } from '../../src/contexto/AuthContext';
import { useTema } from '../../src/contexto/ThemeContext';
import { Icono } from '../../src/componentes/Icono';
import { Colores } from '../../src/constantes/tema';
import { useRouter } from 'expo-router';

export default function PantallaPerfil() {
  const { usuario, cerrarSesion, cambiarRolDemo } = useAuth();
  const { esOscuro, alternarTema, colores } = useTema();
  const router = useRouter();

  const handleCerrarSesion = async () => {
    Alert.alert('Cerrar Sesión', '¿Deseas salir de tu cuenta?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar Sesión',
        style: 'destructive',
        onPress: async () => {
          await cerrarSesion();
          router.replace('/(tabs)');
        },
      },
    ]);
  };

  return (
    <ScrollView style={[styles.contenedor, { backgroundColor: colores.fondo }]}>
      {/* Tarjeta de Usuario */}
      <View style={[styles.tarjetaUsuario, { backgroundColor: colores.tarjeta, borderColor: colores.borde }]}>
        <View style={styles.avatar}>
          <Icono nombre="person" size={36} color="#FFFFFF" />
        </View>

        <View style={styles.infoUsuario}>
          <Text style={[styles.nombre, { color: colores.texto }]}>
            {usuario?.nombre || 'Usuario Invitado'}
          </Text>
          <Text style={[styles.email, { color: colores.textoSecundario }]}>
            {usuario?.email || 'Sin sesión iniciada'}
          </Text>
          <View style={styles.filaRol}>
            <View style={[styles.badgeRol, { backgroundColor: Colores.acento }]}>
              <Text style={styles.badgeRolTexto}>ROL: {usuario?.rol.toUpperCase()}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Métricas de Comportamiento (PRD Nahuel: cancelaciones tardías y ausencias) */}
      <View style={styles.seccion}>
        <Text style={[styles.seccionTitulo, { color: colores.texto }]}>Historial de Cumplimiento</Text>
        <View style={styles.filaMetricas}>
          <View style={[styles.tarjetaMetrica, { backgroundColor: colores.tarjeta, borderColor: colores.borde }]}>
            <Icono nombre="alert-circle-outline" size={24} color={Colores.advertencia} />
            <Text style={[styles.metricaValor, { color: colores.texto }]}>
              {usuario?.cancelacionesTardias ?? 0}
            </Text>
            <Text style={[styles.metricaEtiqueta, { color: colores.textoSecundario }]}>
              Cancelaciones Tardías
            </Text>
            <Text style={[styles.metricaAviso, { color: colores.textoMuted }]}>
              (Menos de 4 hs antes)
            </Text>
          </View>

          <View style={[styles.tarjetaMetrica, { backgroundColor: colores.tarjeta, borderColor: colores.borde }]}>
            <Icono nombre="close-circle-outline" size={24} color={Colores.peligro} />
            <Text style={[styles.metricaValor, { color: colores.texto }]}>
              {usuario?.ausencias ?? 0}
            </Text>
            <Text style={[styles.metricaEtiqueta, { color: colores.textoSecundario }]}>
              Ausencias (No-Show)
            </Text>
            <Text style={[styles.metricaAviso, { color: colores.textoMuted }]}>
              (Marcadas en puerta)
            </Text>
          </View>
        </View>
      </View>

      {/* Selector de Rol para Defensa Oral y Pruebas Cátedra */}
      <View style={styles.seccion}>
        <Text style={[styles.seccionTitulo, { color: colores.texto }]}>
          Selector Rápido de Cuenta (Defensa Oral)
        </Text>
        <Text style={[styles.seccionSubtitulo, { color: colores.textoSecundario }]}>
          Permite simular la experiencia completa de los tres perfiles del PRD:
        </Text>

        <TouchableOpacity
          style={[
            styles.opcionRol,
            {
              backgroundColor: usuario?.rol === 'jugador' ? Colores.primarioClaro : colores.tarjeta,
              borderColor: colores.borde,
            },
          ]}
          onPress={() => cambiarRolDemo('jugador')}
        >
          <Icono
            nombre="football-outline"
            size={20}
            color={usuario?.rol === 'jugador' ? '#FFFFFF' : colores.texto}
          />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text
              style={[
                styles.opcionRolNombre,
                { color: usuario?.rol === 'jugador' ? '#FFFFFF' : colores.texto },
              ]}
            >
              Emiliano Ruiz (Jugador)
            </Text>
            <Text
              style={[
                styles.opcionRolDesc,
                { color: usuario?.rol === 'jugador' ? '#DCFCE7' : colores.textoSecundario },
              ]}
            >
              Reserva turnos, consulta disponibilidad, muestra código QR.
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.opcionRol,
            {
              backgroundColor: usuario?.rol === 'encargado' ? Colores.primarioClaro : colores.tarjeta,
              borderColor: colores.borde,
            },
          ]}
          onPress={() => cambiarRolDemo('encargado')}
        >
          <Icono
            nombre="camera-outline"
            size={20}
            color={usuario?.rol === 'encargado' ? '#FFFFFF' : colores.texto}
          />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text
              style={[
                styles.opcionRolNombre,
                { color: usuario?.rol === 'encargado' ? '#FFFFFF' : colores.texto },
              ]}
            >
              Marcelo (Encargado de Cancha)
            </Text>
            <Text
              style={[
                styles.opcionRolDesc,
                { color: usuario?.rol === 'encargado' ? '#DCFCE7' : colores.textoSecundario },
              ]}
            >
              Ingreso con huella digital, escanea QR en puerta, valida presentes/ausentes.
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.opcionRol,
            {
              backgroundColor: usuario?.rol === 'administrador' ? Colores.primarioClaro : colores.tarjeta,
              borderColor: colores.borde,
            },
          ]}
          onPress={() => cambiarRolDemo('administrador')}
        >
          <Icono
            nombre="shield-checkmark-outline"
            size={20}
            color={usuario?.rol === 'administrador' ? '#FFFFFF' : colores.texto}
          />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text
              style={[
                styles.opcionRolNombre,
                { color: usuario?.rol === 'administrador' ? '#FFFFFF' : colores.texto },
              ]}
            >
              Nahuel Ojeda (Director de Deportes)
            </Text>
            <Text
              style={[
                styles.opcionRolDesc,
                { color: usuario?.rol === 'administrador' ? '#DCFCE7' : colores.textoSecundario },
              ]}
            >
              Bloquea días por lluvia, agenda fijas semanales, actualiza precios por hora.
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Ajustes: Modo Oscuro (Uso a la intemperie / noche) */}
      <View style={styles.seccion}>
        <Text style={[styles.seccionTitulo, { color: colores.texto }]}>Ajustes de Visualización</Text>
        <View style={[styles.filaAjuste, { backgroundColor: colores.tarjeta, borderColor: colores.borde }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
            <Icono nombre={esOscuro ? 'moon' : 'sunny'} size={22} color={Colores.acento} />
            <View>
              <Text style={[styles.ajusteTitulo, { color: colores.texto }]}>
                Modo Oscuro / Intemperie Nocturna
              </Text>
              <Text style={[styles.ajusteSub, { color: colores.textoSecundario }]}>
                Alto contraste para leer con poca luz en las canchas
              </Text>
            </View>
          </View>
          <Switch
            value={esOscuro}
            onValueChange={alternarTema}
            trackColor={{ false: '#CBD5E1', true: Colores.primarioClaro }}
            thumbColor={esOscuro ? Colores.acento : '#FFFFFF'}
          />
        </View>
      </View>

      {/* Botón Cerrar Sesión */}
      <View style={{ padding: 16, marginBottom: 30 }}>
        <TouchableOpacity style={styles.botonCerrarSesion} onPress={handleCerrarSesion}>
          <Icono nombre="log-out-outline" size={18} color={Colores.peligro} style={{ marginRight: 6 }} />
          <Text style={styles.botonCerrarSesionTexto}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
  },
  tarjetaUsuario: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    margin: 16,
    borderRadius: 14,
    borderWidth: 1,
    gap: 14,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colores.primarioClaro,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoUsuario: {
    flex: 1,
  },
  nombre: {
    fontSize: 18,
    fontWeight: '800',
  },
  email: {
    fontSize: 13,
    marginTop: 2,
  },
  filaRol: {
    flexDirection: 'row',
    marginTop: 6,
  },
  badgeRol: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeRolTexto: {
    color: '#1A4D2E',
    fontWeight: '800',
    fontSize: 10,
    letterSpacing: 0.5,
  },
  seccion: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  seccionTitulo: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  seccionSubtitulo: {
    fontSize: 12,
    marginBottom: 10,
  },
  filaMetricas: {
    flexDirection: 'row',
    gap: 12,
  },
  tarjetaMetrica: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  metricaValor: {
    fontSize: 24,
    fontWeight: '800',
    marginVertical: 4,
  },
  metricaEtiqueta: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  metricaAviso: {
    fontSize: 10,
    textAlign: 'center',
    marginTop: 2,
  },
  opcionRol: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  opcionRolNombre: {
    fontSize: 14,
    fontWeight: '700',
  },
  opcionRolDesc: {
    fontSize: 11,
    marginTop: 2,
  },
  filaAjuste: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  ajusteTitulo: {
    fontSize: 14,
    fontWeight: '700',
  },
  ajusteSub: {
    fontSize: 11,
    marginTop: 2,
  },
  botonCerrarSesion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colores.peligro,
    paddingVertical: 12,
    borderRadius: 10,
  },
  botonCerrarSesionTexto: {
    color: Colores.peligro,
    fontWeight: '700',
    fontSize: 14,
  },
});
