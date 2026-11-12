import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export interface ThemeContextType {
  mode: ThemeMode;
  theme: ResolvedTheme;
  resolvedTheme: ResolvedTheme;
  setThemeMode: (mode: ThemeMode) => void;
  setTheme: (mode: ThemeMode | ResolvedTheme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const getSystemTheme = (): ResolvedTheme => {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    try {
      const savedMode = localStorage.getItem('factureau_theme_mode') as ThemeMode | null;
      if (savedMode === 'light' || savedMode === 'dark' || savedMode === 'system') {
        return savedMode;
      }
      const legacyTheme = localStorage.getItem('factureau_theme');
      if (legacyTheme === 'light' || legacyTheme === 'dark') {
        return legacyTheme;
      }
      return 'system';
    } catch {
      return 'system';
    }
  });

  const [systemPreference, setSystemPreference] = useState<ResolvedTheme>(getSystemTheme);

  // Écouteur en direct des préférences de l'OS lorsque mode === 'system'
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent) => {
      setSystemPreference(e.matches ? 'dark' : 'light');
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else if ((mediaQuery as any).addListener) {
      (mediaQuery as any).addListener(handleChange);
      return () => (mediaQuery as any).removeListener(handleChange);
    }
  }, []);

  const resolvedTheme: ResolvedTheme = mode === 'system' ? systemPreference : mode;

  // Application de la classe .dark sur <html>
  useEffect(() => {
    const root = document.documentElement;
    if (resolvedTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    try {
      localStorage.setItem('factureau_theme_mode', mode);
      localStorage.setItem('factureau_theme', resolvedTheme);
    } catch (e) {
      console.error('Erreur sauvegarde thème:', e);
    }
  }, [mode, resolvedTheme]);

  const setThemeMode = (newMode: ThemeMode) => {
    setModeState(newMode);
  };

  const setTheme = (newTheme: ThemeMode | ResolvedTheme) => {
    setModeState(newTheme as ThemeMode);
  };

  const toggleTheme = () => {
    // Cycle à travers les modes: light -> dark -> system -> light
    setModeState((prev) => {
      if (prev === 'light') return 'dark';
      if (prev === 'dark') return 'system';
      return 'light';
    });
  };

  return (
    <ThemeContext.Provider
      value={{
        mode,
        theme: resolvedTheme,
        resolvedTheme,
        setThemeMode,
        setTheme,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme doit être utilisé à l intérieur d un ThemeProvider');
  }
  return context;
};
