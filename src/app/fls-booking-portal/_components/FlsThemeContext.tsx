'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface FlsThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  isDark: boolean;
}

const FlsThemeContext = createContext<FlsThemeContextValue>({
  theme: 'dark',
  toggleTheme: () => { },
  isDark: true,
});

export function useFlsTheme() {
  return useContext(FlsThemeContext);
}

export function FlsThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem('fls-theme') as Theme | null;
    if (stored === 'dark' || stored === 'light') {
      setTheme(stored);
    } else {
      // No stored preference — default to dark
      setTheme('dark');
      localStorage.setItem('fls-theme', 'dark');
    }
  }, []);

  function toggleTheme() {
    setTheme(prev => {
      const next: Theme = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('fls-theme', next);
      return next;
    });
  }

  return (
    <FlsThemeContext.Provider value={{ theme: mounted ? theme : 'dark', toggleTheme, isDark: mounted ? theme === 'dark' : true }}>
      {children}
    </FlsThemeContext.Provider>
  );
}