import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { Turno } from '../tipos';
import { useTema } from '../contexto/ThemeContext';
import { Icono } from './Icono';
import { Haptica } from '../servicios/haptica';

interface Props {
  turnos: Turno[];
  turnoSeleccionado: Turno | null;
  onSeleccionarTurno: (turno: Turno) => void;
}

export const GrillaTurnos: React.FC<Props> = ({
  turnos,
  turnoSeleccionado,
  onSeleccionarTurno,
}) => {
  const { colores } = useTema();

  const renderTurno = ({ item }: { item: Turno }) => {
    const esSeleccionado = turnoSeleccionado?.id === item.id;
    const esPasado = item.motivoBloqueo === 'Horario transcurrido';
    const esLibre = item.estado === 'libre' && !esPasado;

    const manejarPresion = async () => {
      if (!esLibre) return;
      await Haptica.seleccionSuave();
      onSeleccionarTurno(item);
    };

    // Estilo según estado
    let badgeFondo = colores.libre;
    let badgeTexto = colores.libreTexto;
    let etiqueta = 'LIBRE';
    let detalle: string | null = `$ ${item.precio.toLocaleString('es-AR')}`;

    if (esPasado) {
      badgeFondo = colores.mantenimiento;
      badgeTexto = colores.textoMuted;
      etiqueta = 'PASADO';
      detalle = 'Horario vencido';
    } else if (item.estado === 'reservado') {
      badgeFondo = colores.reservado;
      badgeTexto = colores.reservadoTexto;
      etiqueta = 'OCUPADO';
      detalle = null;
    } else if (item.estado === 'mantenimiento') {
      badgeFondo = colores.mantenimiento;
      badgeTexto = colores.mantenimientoTexto;
      etiqueta = 'MANTENIMIENTO';
      detalle = item.motivoBloqueo || 'Cancha en reparación';
    } else if (item.estado === 'fijo') {
      badgeFondo = colores.fijo;
      badgeTexto = colores.fijoTexto;
      etiqueta = 'FIJO';
      detalle = item.motivoBloqueo || 'Turno reservado fijo';
    }

    return (
      <TouchableOpacity
        style={[
          styles.filaTurno,
          {
            backgroundColor: esSeleccionado ? '#1A4D2E' : colores.tarjeta,
            borderColor: esSeleccionado ? '#E8AA42' : colores.borde,
            borderWidth: esSeleccionado ? 2 : 1,
            opacity: esPasado ? 0.6 : 1,
          },
        ]}
        activeOpacity={esLibre ? 0.75 : 1}
        onPress={manejarPresion}
        disabled={!esLibre}
      >
        <View style={styles.columnaHora}>
          <Text
            style={[
              styles.horaTexto,
              { color: esSeleccionado ? '#FFFFFF' : colores.texto },
            ]}
          >
            {item.inicio}
          </Text>
          <Text
            style={[
              styles.horaFinTexto,
              { color: esSeleccionado ? 'rgba(255,255,255,0.7)' : colores.textoMuted },
            ]}
          >
            a {item.fin} hs
          </Text>
        </View>

        <View style={styles.columnaInfo}>
          <View style={styles.filaBadge}>
            <View style={[styles.badge, { backgroundColor: esSeleccionado ? '#FFFFFF' : badgeFondo }]}>
              <Text
                style={[
                  styles.badgeTexto,
                  { color: esSeleccionado ? '#1A4D2E' : badgeTexto },
                ]}
              >
                {etiqueta}
              </Text>
            </View>

            {detalle && (
              <Text
                style={[
                  styles.detalleTexto,
                  { color: esSeleccionado ? '#E8AA42' : esLibre ? colores.libreTexto : colores.textoSecundario },
                ]}
                numberOfLines={1}
              >
                {detalle}
              </Text>
            )}
          </View>
        </View>

        {esLibre && (
          <View style={styles.columnaAccion}>
            <Icono
              nombre={esSeleccionado ? 'checkmark-circle' : 'radio-button-off-outline'}
              size={22}
              color={esSeleccionado ? '#E8AA42' : colores.textoMuted}
            />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.contenedor}>
      <FlatList
        data={turnos}
        keyExtractor={item => item.id}
        renderItem={renderTurno}
        contentContainerStyle={styles.lista}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
  },
  lista: {
    paddingVertical: 10,
    gap: 8,
  },
  filaTurno: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  columnaHora: {
    width: 75,
  },
  horaTexto: {
    fontSize: 16,
    fontWeight: '700',
  },
  horaFinTexto: {
    fontSize: 11,
  },
  columnaInfo: {
    flex: 1,
    paddingHorizontal: 8,
  },
  filaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeTexto: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  detalleTexto: {
    fontSize: 13,
    fontWeight: '600',
  },
  columnaAccion: {
    paddingLeft: 6,
  },
});
