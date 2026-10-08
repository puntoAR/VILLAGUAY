import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTema } from '../src/contexto/ThemeContext';
import { useAuth } from '../src/contexto/AuthContext';
import { USUARIOS_MOCK } from '../src/mocks/usuarios';
import { Usuario, Rol } from '../src/tipos';
import { Icono } from '../src/componentes/Icono';
import { Colores } from '../src/constantes/tema';
import { Haptica } from '../src/servicios/haptica';
import { AuthServicio } from '../src/servicios/auth';

export default function PantallaLogin() {
  const router = useRouter();
  const { colores } = useTema();
  const {
    usuario,
    iniciarSesion,
    registrar,
    reingresoBiometrico,
    cambiarRolDemo,
    soportaBiometria,
    cerrarSesion,
  } = useAuth();

  // Control de pestaña: 'login' | 'registro'
  const [pestaña, setPestaña] = useState<'login' | 'registro'>('login');

  // Formulario Login
  const [emailLogin, setEmailLogin] = useState<string>('');
  const [passwordLogin, setPasswordLogin] = useState<string>('');
  const [verPasswordLogin, setVerPasswordLogin] = useState<boolean>(false);
  const [cargandoLogin, setCargandoLogin] = useState<boolean>(false);

  // Formulario Registro
  const [nombreReg, setNombreReg] = useState<string>('');
  const [emailReg, setEmailReg] = useState<string>('');
  const [telefonoReg, setTelefonoReg] = useState<string>('3455-');
  const [passwordReg, setPasswordReg] = useState<string>('');
  const [passwordConfirmReg, setPasswordConfirmReg] = useState<string>('');
  const [verPasswordReg, setVerPasswordReg] = useState<boolean>(false);
  const [cargandoReg, setCargandoReg] = useState<boolean>(false);

  // Navegación segura hacia el sistema principal
  const navegarAlSistema = () => {
    router.replace('/(tabs)' as any);
  };

  // Ejecutar login con credenciales
  const manejarLogin = async () => {
    if (!emailLogin.trim()) {
      Alert.alert('Datos requeridos', 'Por favor ingresá tu correo electrónico.');
      return;
    }

    setCargandoLogin(true);
    const resultado = await iniciarSesion(emailLogin.trim(), passwordLogin.trim());
    setCargandoLogin(false);

    if (!resultado.exito) {
      await Haptica.errorIngreso();
      Alert.alert('No se pudo ingresar', resultado.mensajeError || 'Credenciales inválidas.');
      return;
    }

    await Haptica.confirmacion();
    navegarAlSistema();
  };

  // Ejecutar registro de nuevo usuario
  const manejarRegistro = async () => {
    if (!nombreReg.trim() || nombreReg.trim().length < 3) {
      Alert.alert('Nombre requerido', 'Por favor ingresá tu nombre y apellido completo.');
      return;
    }

    if (!emailReg.trim() || !emailReg.includes('@')) {
      Alert.alert('Email inválido', 'Por favor ingresá una dirección de correo válida.');
      return;
    }

    if (!telefonoReg.trim() || telefonoReg.trim().length < 8) {
      Alert.alert('Teléfono requerido', 'Ingresá tu número de teléfono de contacto en Villaguay.');
      return;
    }

    if (passwordReg.length < 6) {
      Alert.alert('Contraseña corta', 'La contraseña debe contener al menos 6 caracteres.');
      return;
    }

    if (passwordReg !== passwordConfirmReg) {
      Alert.alert('Contraseñas no coinciden', 'Las contraseñas ingresadas no son iguales.');
      return;
    }

    setCargandoReg(true);
    const resultado = await registrar({
      nombre: nombreReg.trim(),
      email: emailReg.trim(),
      telefono: telefonoReg.trim(),
      password: passwordReg,
      rol: 'jugador',
    });
    setCargandoReg(false);

    if (!resultado.exito) {
      await Haptica.errorIngreso();
      Alert.alert('Error en registro', resultado.mensajeError || 'No se pudo crear la cuenta.');
      return;
    }

    await Haptica.confirmacion();
    Alert.alert(
      '¡Bienvenido a Deportes Villaguay! 🏆',
      'Tu cuenta de jugador fue creada exitosamente. Ya podés reservar tus canchas favoritas.',
      [{ text: 'Comenzar a reservar', onPress: navegarAlSistema }]
    );
  };

  // Desbloqueo rápido biométrico
  const manejarBiometria = async () => {
    await Haptica.seleccionSuave();
    const exito = await reingresoBiometrico();
    if (exito) {
      await Haptica.confirmacion();
      navegarAlSistema();
    } else {
      await Haptica.errorIngreso();
      Alert.alert(
        'Verificación biométrica',
        'No se pudo verificar tu huella o rostro. Podés ingresar con tu correo y contraseña.'
      );
    }
  };

  // Recuperar contraseña
  const manejarRecuperarClave = () => {
    Alert.prompt
      ? Alert.prompt(
          'Recuperar Contraseña',
          'Ingresá tu correo para recibir el enlace de restablecimiento:',
          [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Enviar',
              onPress: async (email?: string) => {
                if (!email) return;
                const resp = await AuthServicio.recuperarPassword(email);
                if (resp && 'datos' in resp) {
                  Alert.alert('Correo enviado', resp.datos);
                }
              },
            },
          ],
          'plain-text',
          emailLogin
        )
      : Alert.alert(
          'Recuperar Contraseña',
          `Se enviará un enlace de restablecimiento a ${emailLogin || 'tu correo registrado'}. Revisá tu bandeja de entrada.`,
          [{ text: 'Entendido' }]
        );
  };

  // Selector rápido de demostración oral para la mesa de examen
  const seleccionarUsuarioDemo = async (u: Usuario) => {
    await Haptica.seleccionSuave();
    await cambiarRolDemo(u.rol);
    navegarAlSistema();
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={[styles.contenedor, { backgroundColor: colores.fondo }]}
        contentContainerStyle={styles.contenido}
        showsVerticalScrollIndicator={false}
      >
        {/* Cabecera institucional */}
        <View style={styles.encabezado}>
          <View style={styles.logoContenedor}>
            <Icono nombre="football-outline" size={38} color={Colores.primarioClaro} />
          </View>
          <Text style={[styles.titulo, { color: colores.texto }]}>
            Dirección de Deportes Villaguay
          </Text>
          <Text style={[styles.subtitulo, { color: colores.textoSecundario }]}>
            Portal Municipal de Reservas y Gestión Deportiva
          </Text>
        </View>

        {/* Banner de sesión activa si el usuario ya está autenticado */}
        {usuario && (
          <View style={[styles.tarjetaSesionActiva, { backgroundColor: colores.tarjeta, borderColor: Colores.acento }]}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 11, fontWeight: '800', color: Colores.acento, letterSpacing: 0.5 }}>
                SESIÓN ACTIVA ACTUAL:
              </Text>
              <Text style={[styles.nombreSesionActiva, { color: colores.texto }]}>
                {usuario.nombre}
              </Text>
              <Text style={{ fontSize: 12, color: Colores.primarioClaro, fontWeight: '700' }}>
                Rol: {usuario.rol.toUpperCase()}
              </Text>
            </View>

            <View style={{ gap: 6 }}>
              <TouchableOpacity
                style={[styles.botonContinuarMini, { backgroundColor: Colores.primarioClaro }]}
                onPress={() => router.replace('/(tabs)' as any)}
              >
                <Text style={styles.botonContinuarMiniTexto}>Continuar ➔</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.botonCerrarSesionMini}
                onPress={async () => {
                  await cerrarSesion();
                  Alert.alert('Sesión cerrada', 'Has cerrado la sesión. Ahora podés ingresar con otra cuenta o registrarte.');
                }}
              >
                <Icono nombre="log-out-outline" size={14} color={Colores.peligro} />
                <Text style={styles.botonCerrarSesionMiniTexto}>Salir</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Selector de pestañas: Iniciar Sesión / Crear Cuenta */}
        <View style={[styles.selectorPestañas, { backgroundColor: colores.tarjeta, borderColor: colores.borde }]}>
          <TouchableOpacity
            style={[
              styles.pestañaBoton,
              pestaña === 'login' && { backgroundColor: Colores.primarioClaro },
            ]}
            onPress={() => setPestaña('login')}
            activeOpacity={0.8}
          >
            <Icono
              nombre="log-in-outline"
              size={18}
              color={pestaña === 'login' ? '#FFFFFF' : colores.textoSecundario}
            />
            <Text
              style={[
                styles.pestañaTexto,
                { color: pestaña === 'login' ? '#FFFFFF' : colores.textoSecundario },
              ]}
            >
              Iniciar Sesión
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.pestañaBoton,
              pestaña === 'registro' && { backgroundColor: Colores.primarioClaro },
            ]}
            onPress={() => setPestaña('registro')}
            activeOpacity={0.8}
          >
            <Icono
              nombre="person-add-outline"
              size={18}
              color={pestaña === 'registro' ? '#FFFFFF' : colores.textoSecundario}
            />
            <Text
              style={[
                styles.pestañaTexto,
                { color: pestaña === 'registro' ? '#FFFFFF' : colores.textoSecundario },
              ]}
            >
              Crear Cuenta
            </Text>
          </TouchableOpacity>
        </View>

        {/* ---------------- PESTAÑA: INICIAR SESIÓN ---------------- */}
        {pestaña === 'login' ? (
          <View style={styles.bloqueFormulario}>
            <View style={styles.grupoCampo}>
              <Text style={[styles.etiquetaCampo, { color: colores.texto }]}>Correo electrónico</Text>
              <View style={[styles.contenedorInput, { backgroundColor: colores.tarjeta, borderColor: colores.borde }]}>
                <Icono nombre="mail-outline" size={20} color={colores.textoMuted} />
                <TextInput
                  style={[styles.inputTexto, { color: colores.texto }]}
                  placeholder="ejemplo@deportesvillaguay.com"
                  placeholderTextColor={colores.textoMuted}
                  value={emailLogin}
                  onChangeText={setEmailLogin}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            <View style={styles.grupoCampo}>
              <View style={styles.filaLabelRecuperar}>
                <Text style={[styles.etiquetaCampo, { color: colores.texto }]}>Contraseña</Text>
                <TouchableOpacity onPress={manejarRecuperarClave}>
                  <Text style={[styles.enlaceRecuperar, { color: Colores.primarioClaro }]}>
                    ¿Olvidaste tu contraseña?
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={[styles.contenedorInput, { backgroundColor: colores.tarjeta, borderColor: colores.borde }]}>
                <Icono nombre="lock-closed-outline" size={20} color={colores.textoMuted} />
                <TextInput
                  style={[styles.inputTexto, { color: colores.texto }]}
                  placeholder="Tu contraseña (ej: 123456)"
                  placeholderTextColor={colores.textoMuted}
                  value={passwordLogin}
                  onChangeText={setPasswordLogin}
                  secureTextEntry={!verPasswordLogin}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setVerPasswordLogin(prev => !prev)}>
                  <Icono
                    nombre={verPasswordLogin ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={colores.textoMuted}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Botón principal de login */}
            <TouchableOpacity
              style={[styles.botonPrincipal, { backgroundColor: Colores.primarioClaro }]}
              onPress={manejarLogin}
              disabled={cargandoLogin}
              activeOpacity={0.8}
            >
              {cargandoLogin ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Icono nombre="enter-outline" size={20} color="#FFFFFF" />
                  <Text style={styles.botonPrincipalTexto}>Ingresar a mi cuenta</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Botón de acceso biométrico (Huella / Face ID) */}
            {soportaBiometria && (
              <TouchableOpacity
                style={[styles.botonBiometria, { backgroundColor: colores.tarjeta, borderColor: colores.borde }]}
                onPress={manejarBiometria}
                activeOpacity={0.8}
              >
                <Icono nombre="finger-print-outline" size={22} color={Colores.primarioClaro} />
                <Text style={[styles.botonBiometriaTexto, { color: colores.texto }]}>
                  Ingresar con Huella o Face ID
                </Text>
              </TouchableOpacity>
            )}

            {/* Acceso Rápido para Tribunal Examinador (Evaluación Oral) */}
            <View style={[styles.seccionEvaluacion, { borderTopColor: colores.borde }]}>
              <View style={styles.cabeceraEvaluacion}>
                <Icono nombre="school-outline" size={18} color={Colores.secundario} />
                <Text style={[styles.tituloEvaluacion, { color: colores.texto }]}>
                  ACCESO RÁPIDO PARA DEFENSA DE CÁTEDRA:
                </Text>
              </View>
              <Text style={[styles.descEvaluacion, { color: colores.textoSecundario }]}>
                Seleccioná uno de los 4 perfiles oficiales del PRD con 1 toque:
              </Text>

              <View style={styles.grillaPerfiles}>
                {USUARIOS_MOCK.map(u => {
                  const esActivo = usuario?.id === u.id;
                  let badgeColor = Colores.primarioClaro;
                  let etiquetaRol = 'Jugador';

                  if (u.rol === 'encargado') {
                    badgeColor = Colores.secundario;
                    etiquetaRol = u.nombre.includes('Agustina') ? 'Encargada Predio' : 'Encargado Predio';
                  } else if (u.rol === 'administrador') {
                    badgeColor = '#6366F1';
                    etiquetaRol = 'Dir. Deportes';
                  }

                  return (
                    <TouchableOpacity
                      key={u.id}
                      style={[
                        styles.tarjetaPerfilDemo,
                        {
                          backgroundColor: colores.tarjeta,
                          borderColor: esActivo ? Colores.primarioClaro : colores.borde,
                          borderWidth: esActivo ? 2 : 1,
                        },
                      ]}
                      onPress={() => seleccionarUsuarioDemo(u)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.filaDemoTop}>
                        <Text style={[styles.demoNombre, { color: colores.texto }]}>
                          {u.nombre.replace(/\s*\(.*?\)/g, '').trim()}
                        </Text>
                        <View style={[styles.badgeMiniRol, { backgroundColor: badgeColor + '20' }]}>
                          <Text style={[styles.badgeMiniRolTexto, { color: badgeColor }]}>
                            {etiquetaRol}
                          </Text>
                        </View>
                      </View>
                      <Text style={[styles.demoEmail, { color: colores.textoSecundario }]}>
                        {u.email}
                      </Text>
                      {u.cancelacionesTardias > 0 && (
                        <Text style={[styles.demoAlerta, { color: Colores.advertencia }]}>
                          ⚠️ {u.cancelacionesTardias} canc. tardías
                        </Text>
                      )}
                      {esActivo && (
                        <Text style={[styles.demoSesionActiva, { color: Colores.primarioClaro }]}>
                          ✓ Sesión activa
                        </Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        ) : (
          /* ---------------- PESTAÑA: CREAR CUENTA ---------------- */
          <View style={styles.bloqueFormulario}>
            <View style={styles.grupoCampo}>
              <Text style={[styles.etiquetaCampo, { color: colores.texto }]}>Nombre y Apellido</Text>
              <View style={[styles.contenedorInput, { backgroundColor: colores.tarjeta, borderColor: colores.borde }]}>
                <Icono nombre="person-outline" size={20} color={colores.textoMuted} />
                <TextInput
                  style={[styles.inputTexto, { color: colores.texto }]}
                  placeholder="Ej: Martín Fernández"
                  placeholderTextColor={colores.textoMuted}
                  value={nombreReg}
                  onChangeText={setNombreReg}
                  autoCapitalize="words"
                />
              </View>
            </View>

            <View style={styles.grupoCampo}>
              <Text style={[styles.etiquetaCampo, { color: colores.texto }]}>Correo electrónico</Text>
              <View style={[styles.contenedorInput, { backgroundColor: colores.tarjeta, borderColor: colores.borde }]}>
                <Icono nombre="mail-outline" size={20} color={colores.textoMuted} />
                <TextInput
                  style={[styles.inputTexto, { color: colores.texto }]}
                  placeholder="ejemplo@correo.com"
                  placeholderTextColor={colores.textoMuted}
                  value={emailReg}
                  onChangeText={setEmailReg}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            <View style={styles.grupoCampo}>
              <Text style={[styles.etiquetaCampo, { color: colores.texto }]}>Teléfono / WhatsApp de contacto</Text>
              <View style={[styles.contenedorInput, { backgroundColor: colores.tarjeta, borderColor: colores.borde }]}>
                <Icono nombre="call-outline" size={20} color={colores.textoMuted} />
                <TextInput
                  style={[styles.inputTexto, { color: colores.texto }]}
                  placeholder="3455-123456"
                  placeholderTextColor={colores.textoMuted}
                  value={telefonoReg}
                  onChangeText={setTelefonoReg}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            <View style={styles.grupoCampo}>
              <Text style={[styles.etiquetaCampo, { color: colores.texto }]}>Crear Contraseña (mínimo 6 caracteres)</Text>
              <View style={[styles.contenedorInput, { backgroundColor: colores.tarjeta, borderColor: colores.borde }]}>
                <Icono nombre="lock-closed-outline" size={20} color={colores.textoMuted} />
                <TextInput
                  style={[styles.inputTexto, { color: colores.texto }]}
                  placeholder="Tu contraseña secreta"
                  placeholderTextColor={colores.textoMuted}
                  value={passwordReg}
                  onChangeText={setPasswordReg}
                  secureTextEntry={!verPasswordReg}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setVerPasswordReg(prev => !prev)}>
                  <Icono
                    nombre={verPasswordReg ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={colores.textoMuted}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.grupoCampo}>
              <Text style={[styles.etiquetaCampo, { color: colores.texto }]}>Confirmar Contraseña</Text>
              <View style={[styles.contenedorInput, { backgroundColor: colores.tarjeta, borderColor: colores.borde }]}>
                <Icono nombre="shield-checkmark-outline" size={20} color={colores.textoMuted} />
                <TextInput
                  style={[styles.inputTexto, { color: colores.texto }]}
                  placeholder="Repetí tu contraseña"
                  placeholderTextColor={colores.textoMuted}
                  value={passwordConfirmReg}
                  onChangeText={setPasswordConfirmReg}
                  secureTextEntry={!verPasswordReg}
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Información de Tipo de Cuenta */}
            <View style={[styles.tarjetaRolRegistro, { backgroundColor: colores.tarjeta, borderColor: colores.borde, borderWidth: 1, marginVertical: 6 }]}>
              <View style={[styles.iconoRolContenedor, { backgroundColor: Colores.primarioClaro + '20' }]}>
                <Icono nombre="football-outline" size={20} color={Colores.primarioClaro} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.tituloRolRegistro, { color: colores.texto }]}>
                  Cuenta de Jugador / Vecino
                </Text>
                <Text style={[styles.descRolRegistro, { color: colores.textoSecundario }]}>
                  Podrás consultar disponibilidad, reservar canchas municipales y presentar tu código QR en puerta. (El personal de predio y directores son dados de alta por la Dirección de Deportes).
                </Text>
              </View>
            </View>

            {/* Botón de Registro */}
            <TouchableOpacity
              style={[styles.botonPrincipal, { backgroundColor: Colores.primarioClaro, marginTop: 10 }]}
              onPress={manejarRegistro}
              disabled={cargandoReg}
              activeOpacity={0.8}
            >
              {cargandoReg ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Icono nombre="checkmark-circle-outline" size={20} color="#FFFFFF" />
                  <Text style={styles.botonPrincipalTexto}>Crear mi cuenta y comenzar</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.botonCambiarPestaña}
              onPress={() => setPestaña('login')}
            >
              <Text style={[styles.textoCambiarPestaña, { color: colores.textoSecundario }]}>
                ¿Ya tenés una cuenta?{' '}
                <Text style={{ color: Colores.primarioClaro, fontWeight: '700' }}>Iniciá sesión acá</Text>
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
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
    marginBottom: 20,
  },
  logoContenedor: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(26, 77, 46, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  titulo: {
    fontSize: 21,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitulo: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 4,
    maxWidth: 300,
  },
  selectorPestañas: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 4,
    marginBottom: 20,
  },
  pestañaBoton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  pestañaTexto: {
    fontSize: 14,
    fontWeight: '700',
  },
  bloqueFormulario: {
    gap: 14,
  },
  grupoCampo: {
    gap: 6,
  },
  filaLabelRecuperar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  etiquetaCampo: {
    fontSize: 13,
    fontWeight: '700',
  },
  enlaceRecuperar: {
    fontSize: 12,
    fontWeight: '600',
  },
  contenedorInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 48,
    gap: 10,
  },
  inputTexto: {
    flex: 1,
    fontSize: 14,
    height: '100%',
  },
  botonPrincipal: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    shadowColor: Colores.primarioClaro,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  botonPrincipalTexto: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  botonBiometria: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  botonBiometriaTexto: {
    fontSize: 14,
    fontWeight: '600',
  },
  seccionEvaluacion: {
    borderTopWidth: 1,
    paddingTop: 18,
    marginTop: 8,
    gap: 10,
  },
  cabeceraEvaluacion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tituloEvaluacion: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  descEvaluacion: {
    fontSize: 12,
    lineHeight: 16,
  },
  grillaPerfiles: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tarjetaPerfilDemo: {
    width: '48%',
    borderRadius: 10,
    padding: 10,
    gap: 3,
  },
  filaDemoTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  demoNombre: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  badgeMiniRol: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeMiniRolTexto: {
    fontSize: 9,
    fontWeight: '800',
  },
  demoEmail: {
    fontSize: 11,
  },
  demoAlerta: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  demoSesionActiva: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  botonCambiarPestaña: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  textoCambiarPestaña: {
    fontSize: 13,
  },
  subtextoCampo: {
    fontSize: 12,
    marginTop: -2,
    marginBottom: 4,
  },
  contenedorSelectorRoles: {
    gap: 8,
  },
  tarjetaRolRegistro: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 12,
  },
  iconoRolContenedor: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tituloRolRegistro: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  descRolRegistro: {
    fontSize: 11,
    lineHeight: 15,
  },
  tarjetaSesionActiva: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    marginBottom: 16,
    gap: 12,
  },
  nombreSesionActiva: {
    fontSize: 15,
    fontWeight: '800',
    marginTop: 2,
  },
  botonContinuarMini: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
  },
  botonContinuarMiniTexto: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  botonCerrarSesionMini: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colores.peligro,
    gap: 4,
  },
  botonCerrarSesionMiniTexto: {
    color: Colores.peligro,
    fontSize: 11,
    fontWeight: '700',
  },
});
