// SPECLANG-GENERATED: @speclang/ui.visual-design
// DO NOT EDIT MANUALLY
// Source: specs/ui.dir/visual-design.spec.md

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './src/dashboard/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        secondary: 'var(--color-secondary)',
        accent: 'var(--color-accent)',
        background: 'var(--color-background)',
        surface: 'var(--color-surface)',
        'surface-elevated': 'var(--color-surface-elevated)',
        text: 'var(--color-text)',
        'text-muted': 'var(--color-text-muted)',
        'text-dimmed': 'var(--color-text-dimmed)',
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        error: 'var(--color-error)',
        info: 'var(--color-info)',
        'status-idle': 'var(--color-status-idle)',
        'status-active': 'var(--color-status-active)',
        'status-running': 'var(--color-status-running)',
        'status-success': 'var(--color-status-success)',
        'status-error': 'var(--color-status-error)',
        'status-warning': 'var(--color-status-warning)',
      },
      fontFamily: {
        display: 'var(--font-display)',
        body: 'var(--font-body)',
        mono: 'var(--font-mono)',
      },
      fontSize: {
        hero: 'var(--text-hero)',
        h1: 'var(--text-h1)',
        h2: 'var(--text-h2)',
        h3: 'var(--text-h3)',
        h4: 'var(--text-h4)',
        body: 'var(--text-body)',
        small: 'var(--text-small)',
        tiny: 'var(--text-tiny)',
      },
      spacing: {
        0.5: 'var(--space-1)',
        1: 'var(--space-2)',
        1.5: 'var(--space-3)',
        2: 'var(--space-4)',
        3: 'var(--space-5)',
        4: 'var(--space-6)',
        5: 'var(--space-7)',
        6: 'var(--space-8)',
        8: 'var(--space-9)',
        10: 'var(--space-10)',
        12: 'calc(var(--space-unit) * 16)',
        16: 'calc(var(--space-unit) * 20)',
      },
      borderRadius: {
        NONE: '0',
        DEFAULT: '0',
      },
      transitionDuration: {
        instant: 'var(--duration-instant)',
        fast: 'var(--duration-fast)',
        normal: 'var(--duration-normal)',
        slow: 'var(--duration-slow)',
        dramatic: 'var(--duration-dramatic)',
      },
      transitionTimingFunction: {
        linear: 'var(--ease-linear)',
        brutal: 'var(--ease-brutal)',
      },
      boxShadow: {
        harsh: 'var(--shadow-harsh)',
        brutal: 'var(--shadow-brutal)',
        none: 'var(--shadow-none)',
      },
      zIndex: {
        base: 'var(--z-base)',
        dropdown: 'var(--z-dropdown)',
        modal: 'var(--z-modal)',
        toast: 'var(--z-toast)',
        tooltip: 'var(--z-tooltip)',
      },
    },
  },
  plugins: [],
};
