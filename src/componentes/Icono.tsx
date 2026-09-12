import React from 'react';
import Ionicons from '@react-native-vector-icons/ionicons';

interface IconoProps {
  nombre: string;
  size?: number;
  color?: any;
  style?: any;
}

export const Icono: React.FC<IconoProps> = ({ nombre, size = 24, color = '#1A4D2E', style }) => {
  return <Ionicons name={nombre as any} size={size} color={color} style={style} />;
};