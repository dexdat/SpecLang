/**
 * SPECLANG-GENERATED - Do not edit directly
 * 
 * Source: specs/ui-dashboard.spec.dir/src/hooks/useTheme.spec.ts
 * Generated: 2026-03-20T16:30:00.000Z
 * 
 * Edit the spec, not this file.
 */
import { useState, useEffect, useCallback } from 'react';

export type Theme = 'brutalist-dark' | 'brutalist-light' | 'high-contrast';

const THEME_KEY = 'speclang-theme';

/**
 * Get initial theme from localStorage or system preference
 */
function getInitialTheme(): Theme {
  const stored = localStorage.getItem(THEME_KEY) as Theme | null;
  if (stored && ['brutalist-dark', 'brutalist-light', 'high-contrast'].includes(stored)) {
    return stored;
  }
  
  // Check for high contrast preference
  if (window.matchMedia('(prefers-contrast: more)').matches) {
    return 'high-contrast';
  }
  
  // Check for light/dark preference
  if (window.matchMedia('(prefers-color-scheme: light)').matches) {
    return 'brutalist-light';
  }
  
  return 'brutalist-dark';
}

/**
 * Apply theme to document
 */
function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(THEME_KEY, theme);
}

/**
 * useTheme hook for theme switching
 * 
 * @returns {theme, setTheme, toggleTheme}
 * 
 * @example
 * const { theme, setTheme } = useTheme();
 * setTheme('brutalist-light');
 */
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    applyTheme(newTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    const themes: Theme[] = ['brutalist-dark', 'brutalist-light', 'high-contrast'];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  }, [theme, setTheme]);

  // Apply theme on mount
  useEffect(() => {
    applyTheme(theme);
  }, []);

  // Listen for system preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      // Only auto-switch if user hasn't set a preference
      if (!localStorage.getItem(THEME_KEY)) {
        const newTheme = e.matches ? 'brutalist-dark' : 'brutalist-light';
        setTheme(newTheme);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [setTheme]);

  return { theme, setTheme, toggleTheme };
}

/**
 * Get theme-specific class based on current theme
 * 
 * @example
 * const themeClass = useThemeClass({
 *   dark: 'bg-dark-surface',
 *   light: 'bg-light-surface', 
 *   highContrast: 'bg-hc-surface'
 * });
 */
export function useThemeClass(classes: {
  dark?: string;
  light?: string;
  highContrast?: string;
}): string {
  const { theme } = useTheme();
  
  switch (theme) {
    case 'brutalist-light':
      return classes.light || '';
    case 'high-contrast':
      return classes.highContrast || '';
    case 'brutalist-dark':
    default:
      return classes.dark || '';
  }
}

/**
 * Theme color definitions for reference.
 */
export const THEME_COLORS = {
  'brutalist-dark': {
    primary: '#000000',
    secondary: '#ffffff',
    accent: '#ff0000',
    background: '#1a1a1a',
    surface: '#2a2a2a',
  },
  'brutalist-light': {
    primary: '#000000',
    secondary: '#ffffff',
    accent: '#cc0000',
    background: '#ffffff',
    surface: '#f0f0f0',
  },
  'high-contrast': {
    primary: '#ffffff',
    secondary: '#000000',
    accent: '#ffff00',
    background: '#000000',
    surface: '#000000',
  },
} as const;
