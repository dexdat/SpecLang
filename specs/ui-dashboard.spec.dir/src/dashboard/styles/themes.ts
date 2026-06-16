/* SPECLANG-GENERATED: @speclang/ui-dashboard/visual-design */
/* DO NOT EDIT MANUALLY */
/* Source: specs/ui-dashboard.spec.dir/visual-design.spec.md */

export type Theme = 'brutalist-dark' | 'brutalist-light' | 'high-contrast';

export interface ThemeConfig {
  name: Theme;
  label: string;
  description: string;
}

export const themes: ThemeConfig[] = [
  {
    name: 'brutalist-dark',
    label: 'Brutalist Dark',
    description: 'Default dark theme with high contrast',
  },
  {
    name: 'brutalist-light',
    label: 'Brutalist Light',
    description: 'Light theme with brutalist aesthetics',
  },
  {
    name: 'high-contrast',
    label: 'High Contrast',
    description: 'Maximum contrast for accessibility',
  },
];

export const defaultTheme: Theme = 'brutalist-dark';

export function getSystemThemePreference(): Theme {
  if (typeof window === 'undefined') {
    return defaultTheme;
  }
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  return prefersDark ? 'brutalist-dark' : 'brutalist-light';
}

export function loadStoredTheme(): Theme | null {
  if (typeof window === 'undefined') {
    return null;
  }
  const stored = localStorage.getItem('speclang-theme');
  if (stored && isValidTheme(stored)) {
    return stored as Theme;
  }
  return null;
}

export function storeTheme(theme: Theme): void {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.setItem('speclang-theme', theme);
}

export function applyTheme(theme: Theme): void {
  if (typeof window === 'undefined') {
    return;
  }
  document.documentElement.setAttribute('data-theme', theme);
  storeTheme(theme);
}

export function isValidTheme(value: string): value is Theme {
  return themes.some(t => t.name === value);
}

export function useTheme(): [Theme, (theme: Theme) => void] {
  // This is a placeholder for React hook implementation
  // Actual implementation would use useState and useEffect
  // For now, return a dummy implementation
  const [theme, setTheme] = useState(defaultTheme);
  
  useEffect(() => {
    const stored = loadStoredTheme();
    const system = getSystemThemePreference();
    const initial = stored || system;
    applyTheme(initial);
    setTheme(initial);
  }, []);
  
  const updateTheme = (newTheme: Theme) => {
    applyTheme(newTheme);
    setTheme(newTheme);
  };
  
  return [theme, updateTheme];
}

// Placeholder React imports - actual implementation would import from 'react'
declare const useState: any;
declare const useEffect: any;