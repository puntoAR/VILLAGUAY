import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { PreferenciasKV } from '../basedatos/kvstore';
import { Colores } from '../constantes/tema';

interface ThemeContextType {
  esOscuro: boolean;
  colores: typeof Colores.claro;
  alternarTema: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType>({
  esOscuro: false,
  colores: Colores.claro,
  alternarTema: async () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const esquemaSistema = useColorScheme();
  const [esOscuro, setEsOscuro] = React.useState(esquemaSistema === 'dark');

  React.useEffect(() => {
    PreferenciasKV.obtener('tema_preferido').then(val => {
      if (val === 'oscuro') setEsOscuro(true);
      else if (val === 'claro') setEsOscuro(false);
      else setEsOscuro(esquemaSistema === 'dark');
    });
  }, [esquemaSistema]);

  const alternarTema = async () => {
    const nuevo = !esOscuro;
    setEsOscuro(nuevo);
    await PreferenciasKV.guardar('tema_preferido', nuevo ? 'oscuro' : 'claro');
  };

  const colores = esOscuro ? Colores.oscuro : Colores.claro;

  return (
    <ThemeContext.Provider value={{ esOscuro, colores, alternarTema }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTema = () => useContext(ThemeContext);