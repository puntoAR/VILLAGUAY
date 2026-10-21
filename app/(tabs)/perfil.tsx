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
import { USUARIOS_MOCK } from '../../src/mocks/usuarios';

export default function PantallaPerfil() {
  const { usuario, cerrarSesion, cambiarRolDemo, seleccionarUsuarioDemo } = useAuth();
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
          router.replace('/login');
        },
      },
    ]);
  };

  return (
    <ScrollView style={[styles.contenedor, { backgroundColor: colores.fondo }]}>
      {/* Tarjeta de Usuario o Tarjeta de Invitado */}
      {usuario ? (
        <View style={[styles.tarjetaUsuario, { backgroundColor: colores.tarjeta, borderColor: colores.borde }]}>
          <View style={styles.avatar}>
            <Icono nombre="person" size={36} color="#FFFFFF" />
          </View>

          <View style={styles.infoUsuario}>
            <Text style={[styles.nombre, { color: colores.texto }]}>
              {usuario.nombre}
            </Text>
            <Text style={[styles.email, { color: colores.textoSecundario }]}>
              {usuario.email}
            </Text>
            {usuario.telefono && (
              <Text style={[styles.telefono, { color: colores.textoMuted }]}>
                📞 {usuario.telefono}
              </Text>
            )}
            <View style={styles.filaRol}>
              <View style={[styles.badgeRol, { backgroundColor: Colores.acento }]}>
                <Text style={styles.badgeRolTexto}>ROL: {usuario.rol.toUpperCase()}</Text>
              </View>
            </View>
          </View>
        </View>
      ) : (
        <View style={[styles.tarjetaInvitado, { backgroundColor: colores.tarjeta, borderColor: colores.borde }]}>
          <View style={styles.avatarInvitado}>
            <Icono nombre="person-outline" size={32} color={colores.textoMuted} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.nombre, { color: colores.texto }]}>Modo Invitado</Text>
            <Text style={[styles.email, { color: colores.textoSecundario }]}>
              Iniciá sesión o registrate para gestionar tus turnos y acceder al control de ingreso.
            </Text>
            <TouchableOpacity
              style={[styles.botonIniciarInvitado, { backgroundColor: Colores.primarioClaro }]}
              onPress={() => router.push('/login')}
              activeOpacity={0.8}
            >
              <Icono nombre="log-in-outline" size={18} color="#FFFFFF" />
              <Text style={styles.botonIniciarInvitadoTexto}>Iniciar Sesión o Crear Cuenta</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Métricas de Comportamiento (PRD Nahuel: cancelaciones tardías y ausencias) */}
      {usuario && (
        <View style={styles.seccion}>
          <Text style={[styles.seccionTitulo, { color: colores.texto }]}>Historial de Cumplimiento</Text>
          <View style={styles.filaMetricas}>
            <View style={[styles.tarjetaMetrica, { backgroundColor: colores.tarjeta, borderColor: colores.borde }]}>
              <Icono nombre="alert-circle-outline" size={24} color={Colores.advertencia} />
              <Text style={[styles.metricaValor, { color: colores.texto }]}>
                {usuario.cancelacionesTardias ?? 0}
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
                {usuario.ausencias ?? 0}
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
      )}

      {/* Selector de Rol para Defensa Oral y Pruebas Cátedra */}
      <View style={styles.seccion}>
        <Text style={[styles.seccionTitulo, { color: colores.texto }]}>
          Selector Rápido de Cuenta (Defensa Oral)
        </Text>
        <Text style={[styles.seccionSubtitulo, { color: colores.textoSecundario }]}>
          Permite simular la experiencia completa de los 5 perfiles oficiales:
        </Text>

        {USUARIOS_MOCK.map(u => {
          const esActivo = usuario?.id === u.id;
          let iconoNombre: any = 'football-outline';
          let etiquetaRol = 'Jugador';
          let subtitulo = 'Reserva turnos, consulta disponibilidad, muestra código QR.';

          if (u.rol === 'encargado') {
            iconoNombre = 'camera-outline';
            etiquetaRol = u.nombre.includes('Agustina') ? 'Encargada Predio' : 'Encargado Predio';
            subtitulo = 'Ingreso con huella digital, escanea QR en puerta, cobra turnos.';
          } else if (u.rol === 'administrador') {
            iconoNombre = 'shield-checkmark-outline';
            etiquetaRol = 'Dir. Deportes';
            subtitulo = 'Tablero macro, tarifas, reservas fijas y alta de personal.';
          }

          return (
            <TouchableOpacity
              key={u.id}
              style={[
                styles.opcionRol,
                {
                  backgroundColor: esActivo ? Colores.primarioClaro : colores.tarjeta,
                  borderColor: colores.borde,
                },
              ]}
              onPress={() => seleccionarUsuarioDemo(u)}
              activeOpacity={0.7}
            >
              <Icono
                nombre={iconoNombre}
                size={20}
                color={esActivo ? '#FFFFFF' : colores.texto}
              />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text
                  style={[
                    styles.opcionRolNombre,
                    { color: esActivo ? '#FFFFFF' : colores.texto },
                  ]}
                >
                  {u.nombre} ({etiquetaRol})
                </Text>
                <Text
                  style={[
                    styles.opcionRolDesc,
                    { color: esActivo ? '#DCFCE7' : colores.textoSecundario },
                  ]}
                >
                  {subtitulo}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
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

      {/* Botón Cerrar Sesión o Iniciar Sesión */}
      <View style={{ padding: 16, marginBottom: 30 }}>
        {usuario ? (
          <TouchableOpacity style={styles.botonCerrarSesion} onPress={handleCerrarSesion}>
            <Icono nombre="log-out-outline" size={18} color={Colores.peligro} style={{ marginRight: 6 }} />
            <Text style={styles.botonCerrarSesionTexto}>Cerrar Sesión</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.botonCerrarSesion, { borderColor: Colores.primarioClaro, backgroundColor: Colores.primarioClaro }]}
            onPress={() => router.push('/login')}
          >
            <Icono nombre="log-in-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={[styles.botonCerrarSesionTexto, { color: '#FFFFFF' }]}>Iniciar Sesión / Crear Cuenta</Text>
          </TouchableOpacity>
        )}
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
  tarjetaInvitado: {
    flexDirection: 'row',
    padding: 16,
    margin: 16,
    borderRadius: 14,
    borderWidth: 1,
    gap: 14,
    alignItems: 'center',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colores.primarioClaro,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInvitado: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(100, 116, 139, 0.1)',
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
    lineHeight: 18,
  },
  telefono: {
    fontSize: 12,
    marginTop: 2,
  },
  botonIniciarInvitado: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    marginTop: 10,
    gap: 6,
  },
  botonIniciarInvitadoTexto: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
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
