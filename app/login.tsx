import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTema } from '../src/contexto/ThemeContext';
import { useAuth } from '../src/contexto/AuthContext';
import { USUARIOS_MOCK } from '../src/mocks/usuarios';
import { Usuario } from '../src/tipos';
import { Icono } from '../src/componentes/Icono';
import { Colores } from '../src/constantes/tema';
import { Haptica } from '../src/servicios/haptica';

export default function PantallaLogin() {
  const router = useRouter();
  const { colores } = useTema();
  const { usuario, iniciarSesion, cambiarRolDemo } = useAuth();

  const [emailInput, setEmailInput] = useState<string>('');

  const seleccionarUsuarioDemo = async (u: Usuario) => {
    await Haptica.seleccionSuave();
    await cambiarRolDemo(u.rol);
    router.back();
  };

  const ingresarConEmail = async () => {
    if (!emailInput.trim() || !emailInput.includes('@')) {
      Alert.alert('Email inválido', 'Por favor ingresá un correo electrónico válido.');
      return;
    }
    await Haptica.confirmacion();
    await iniciarSesion(emailInput.trim());
    router.back();
  };

  return (
    <ScrollView
      style={[styles.contenedor, { backgroundColor: colores.fondo }]}
      contentContainerStyle={styles.contenido}
    >
      <View style={styles.encabezado}>
        <View style={styles.logoContenedor}>
          <Icono nombre="football-outline" size={40} color={Colores.primarioClaro} />
        </View>
        <Text style={[styles.titulo, { color: colores.texto }]}>
          Identificación de Usuario
        </Text>
        <Text style={[styles.subtitulo, { color: colores.textoSecundario }]}>
          Seleccioná un perfil demo para evaluar los distintos roles de la cátedra o ingresá con tu correo.
        </Text>
      </View>

      {/* Selector Rápido de Perfiles Demo Cátedra */}
      <View style={styles.seccionDemo}>
        <Text style={[styles.seccionTitulo, { color: colores.texto }]}>
          PERFILES PARA EVALUACIÓN ORAL:
        </Text>

        {USUARIOS_MOCK.map(u => {
          const esActivo = usuario?.id === u.id;
          let rolColor = Colores.primarioClaro;
          let rolEtiqueta = 'Jugador';

          if (u.rol === 'encargado') {
            rolColor = Colores.secundario;
            rolEtiqueta = 'Encargado de Predio';
          } else if (u.rol === 'administrador') {
            rolColor = '#6366F1';
            rolEtiqueta = 'Dirección de Deportes';
          }

          return (
            <TouchableOpacity
              key={u.id}
              style={[
                styles.tarjetaUsuario,
                {
                  backgroundColor: colores.tarjeta,
                  borderColor: esActivo ? Colores.primarioClaro : colores.borde,
                  borderWidth: esActivo ? 2 : 1,
                },
              ]}
              onPress={() => seleccionarUsuarioDemo(u)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.avatar,
                  { backgroundColor: esActivo ? Colores.primarioClaro : colores.fondo },
                ]}
              >
                <Icono
                  nombre={
                    u.rol === 'administrador'
                      ? 'shield-checkmark'
                      : u.rol === 'encargado'
                      ? 'qr-code'
                      : 'person'
                  }
                  size={22}
                  color={esActivo ? '#FFFFFF' : Colores.primarioClaro}
                />
              </View>

              <View style={styles.infoUsuario}>
                <View style={styles.filaNombreRol}>
                  <Text style={[styles.nombreUsuario, { color: colores.texto }]}>
                    {u.nombre}
                  </Text>
                  <View style={[styles.badgeRol, { backgroundColor: rolColor + '20' }]}>
                    <Text style={[styles.badgeRolTexto, { color: rolColor }]}>
                      {rolEtiqueta}
                    </Text>
                  </View>
                </View>

                <Text style={[styles.emailUsuario, { color: colores.textoSecundario }]}>
                  {u.email}
                </Text>

                <View style={styles.detallesUsuario}>
                  {u.cancelacionesTardias > 0 && (
                    <Text style={[styles.alertaPenalizacion, { color: Colores.advertencia }]}>
                      ⚠️ {u.cancelacionesTardias} canc. tardías
                    </Text>
                  )}
                  {u.rol === 'encargado' && (
                    <Text style={[styles.descripcionPermiso, { color: colores.textoMuted }]}>
                      Habilitado para escanear QR y bloquear por lluvia
                    </Text>
                  )}
                  {u.rol === 'administrador' && (
                    <Text style={[styles.descripcionPermiso, { color: colores.textoMuted }]}>
                      Habilitado para fijar turnos y actualizar aranceles
                    </Text>
                  )}
                </View>
              </View>

              {esActivo && (
                <View style={styles.iconoActivo}>
                  <Icono nombre="checkmark-circle" size={24} color={Colores.primarioClaro} />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Ingreso Personalizado alternativo */}
      <View style={[styles.seccionCustom, { borderTopColor: colores.borde }]}>
        <Text style={[styles.seccionTitulo, { color: colores.texto }]}>
          O INGRESÁ CON OTRO CORREO:
        </Text>

        <View style={styles.inputContainer}>
          <TextInput
            style={[
              styles.inputEmail,
              {
                backgroundColor: colores.tarjeta,
                borderColor: colores.borde,
                color: colores.texto,
              },
            ]}
            placeholder="ejemplo@deportesvillaguay.com"
            placeholderTextColor={colores.textoMuted}
            value={emailInput}
            onChangeText={setEmailInput}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <TouchableOpacity
            style={[styles.botonIngresar, { backgroundColor: Colores.primarioClaro }]}
            onPress={ingresarConEmail}
          >
            <Text style={styles.botonIngresarTexto}>Ingresar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
  },
  contenido: {
    padding: 20,
    paddingBottom: 40,
  },
  encabezado: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoContenedor: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(26, 77, 46, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  titulo: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitulo: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 6,
    maxWidth: 320,
  },
  seccionDemo: {
    gap: 12,
    marginBottom: 28,
  },
  seccionTitulo: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  tarjetaUsuario: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoUsuario: {
    flex: 1,
  },
  filaNombreRol: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  nombreUsuario: {
    fontSize: 15,
    fontWeight: '700',
  },
  badgeRol: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeRolTexto: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  emailUsuario: {
    fontSize: 12,
  },
  detallesUsuario: {
    marginTop: 4,
  },
  alertaPenalizacion: {
    fontSize: 11,
    fontWeight: '700',
  },
  descripcionPermiso: {
    fontSize: 11,
  },
  iconoActivo: {
    paddingLeft: 4,
  },
  seccionCustom: {
    borderTopWidth: 1,
    paddingTop: 20,
    gap: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  inputEmail: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 14,
  },
  botonIngresar: {
    paddingHorizontal: 18,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonIngresarTexto: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
