// src/contexto/RedContext.tsx
// Contexto de conectividad

import React, { createContext, useContext } from 'react';
import { useConectividadRed } from '../servicios/red';

interface RedContextType {
  conectado: boolean;
}

const RedContext = createContext<RedContextType>({ conectado: true });

export const RedProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const conectado = useConectividadRed();

  return (
    <RedContext.Provider value={{ conectado }}>
      {children}
    </RedContext.Provider>
  );
};

export const useRed = () => useContext(RedContext);
