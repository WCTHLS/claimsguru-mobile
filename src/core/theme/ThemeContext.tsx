import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { Colors, ThemeColors } from './colors';

interface ThemeContextValue {
  isDark: boolean;
  colors: ThemeColors;
  toggleTheme: () => void;
  setScheme: (scheme: 'light' | 'dark' | 'auto') => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  isDark: false,
  colors: Colors.light,
  toggleTheme: () => {},
  setScheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemScheme = useColorScheme();
  const [schemeOverride, setSchemeOverride] = useState<'light' | 'dark' | 'auto'>('auto');

  const isDark = schemeOverride === 'auto' ? systemScheme === 'dark' : schemeOverride === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;

  const toggleTheme = () => {
    setSchemeOverride(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <ThemeContext.Provider value={{ isDark, colors, toggleTheme, setScheme: setSchemeOverride }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
