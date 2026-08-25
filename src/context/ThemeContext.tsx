import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getTheme, theme as defaultTheme } from '../styles/theme';

type ThemeType = typeof defaultTheme;

interface ThemeContextType {
  theme: ThemeType;
  isDarkMode: boolean;
  toggleTheme: () => void;
  setMode: (mode: 'light' | 'dark' | 'system') => void;
  mode: 'light' | 'dark' | 'system';
}

const ThemeContext = createContext<ThemeContextType>({
  theme: defaultTheme,
  isDarkMode: false,
  toggleTheme: () => {},
  setMode: () => {},
  mode: 'system',
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const systemColorScheme = useColorScheme();
  const [mode, setModeState] = useState<'light' | 'dark' | 'system'>('system');

  useEffect(() => {
    // Load saved theme preference
    const loadTheme = async () => {
      const savedMode = await AsyncStorage.getItem('theme_mode');
      if (savedMode === 'light' || savedMode === 'dark' || savedMode === 'system') {
        setModeState(savedMode);
      }
    };
    loadTheme();
  }, []);

  const setMode = (newMode: 'light' | 'dark' | 'system') => {
    setModeState(newMode);
    // Save in background without awaiting to keep UI snappy
    AsyncStorage.setItem('theme_mode', newMode).catch(err => console.error("Theme save error", err));
  };

  const isDarkMode = useMemo(() => {
    if (mode === 'system') return systemColorScheme === 'dark';
    return mode === 'dark';
  }, [mode, systemColorScheme]);

  const toggleTheme = () => {
    setMode(isDarkMode ? 'light' : 'dark');
  };

  const theme = useMemo(() => getTheme(isDarkMode), [isDarkMode]);

  return (
    <ThemeContext.Provider value={{ theme, isDarkMode, toggleTheme, setMode, mode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
