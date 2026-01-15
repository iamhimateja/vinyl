import { useState, useEffect } from 'react';
import type { Theme } from '../types';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    // Check localStorage first
    const saved = localStorage.getItem('vinyl-theme') as Theme | null;
    if (saved) return saved;

    // Check system preference
    if (window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light';
    }
    return 'dark';
  });

  useEffect(() => {
    // Apply theme to document
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.add('light');
    } else {
      root.classList.remove('light');
    }

    // Save to localStorage
    localStorage.setItem('vinyl-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return { theme, setTheme, toggleTheme };
}
