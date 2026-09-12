import React, { createContext, useContext } from 'react';
import { useEstadoRed } from '../servicios/red';

const RedContext = createContext<{ conectado: boolean }>({ conectado: true });

export const RedProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const conectado = useEstadoRed();
  return <RedContext.Provider value={{ conectado }}>{children}</RedContext.Provider>;
};

export const useRed = () => useContext(RedContext);