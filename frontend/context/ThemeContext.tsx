import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';

type Theme = 'light' | 'dark';

interface ThemeColors {
  bg: string;
  card: string;
  text: string;
  subText: string;
  border: string;
  primary: string;
  success: string;
  danger: string;
  warning: string;
  info: string;
  gradientBackground: string[];
}

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  colors: ThemeColors;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const lightColors: ThemeColors = {
  bg: '#f8f9fa',
  card: '#ffffff',
  text: '#111827',
  subText: '#6b7280',
  border: '#e5e7eb',
  primary: '#FF4D67',
  success: '#10B981',
  danger: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',
  gradientBackground: ['rgba(255, 77, 103, 0.05)', '#f8f9fa'],
};

const darkColors: ThemeColors = {
  bg: '#0f0f13',
  card: '#1E1E24',
  text: '#ffffff',
  subText: '#a0a0a0',
  border: '#333333',
  primary: '#FF4D67',
  success: '#10B981',
  danger: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',
  gradientBackground: ['rgba(255, 77, 103, 0.1)', '#0f0f13'],
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [theme, setThemeState] = useState<Theme>(systemColorScheme === 'dark' ? 'dark' : 'light');

  // We could additionally save/load this preference from AsyncStorage here if needed

  useEffect(() => {
    if (systemColorScheme) {
      setThemeState(systemColorScheme);
    }
  }, [systemColorScheme]);

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const isDark = theme === 'dark';
  const colors = isDark ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ theme, isDark, colors, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
