# Bootstrap Phase 0.23: UI Visual Design

## Context
You are building SpecLang - a reactive multi-agent system where specs self-assemble into code. This is Phase 0.23 of the bootstrap process.

**Prerequisites**: 
- Phase 0.1-0.22 complete
- UI components built
- Interactions working
- Tests passing

## Your Task
Implement the brutalist visual design system including CSS architecture, themes, dark/light modes, typography, and accessibility considerations.

## Read These Specs First
1. `specs/ui.spec.dir/visual-design.spec.md` - Visual design specifications
2. `specs/ui.spec.dir/overview.spec.md` - UI architecture
3. `specs/ui.spec.dir/components/*.spec.md` - Component styling

## Design Philosophy

The SpecLang UI follows a **Brutalist/Raw** aesthetic:
- Architectural brutalism, exposed concrete, raw materials
- Exposed mechanics of the reactive cascade
- Utilitarian, powerful, transparent, no-nonsense
- No rounded corners, harsh shadows, monospace typography

## What to Build

### Files to Create
```
src/dashboard/
├── styles/
│   ├── variables.css        # CSS custom properties
│   ├── reset.css            # CSS reset
│   ├── grid.css             # Grid background texture
│   ├── typography.css       # Font definitions
│   ├── components.css       # Component styles
│   ├── utilities.css        # Utility classes
│   ├── themes/
│   │   ├── brutalist-dark.css
│   │   ├── brutalist-light.css
│   │   └── high-contrast.css
│   └── main.css             # Entry point
└── tailwind.config.js       # Tailwind configuration
```

### Requirements

#### 1. CSS Variables (Design Tokens)

```css
/* styles/variables.css */
:root {
  /* Colors - Brutalist Palette */
  --color-primary: #000000;
  --color-secondary: #ffffff;
  --color-accent: #ff0000;
  --color-background: #1a1a1a;
  --color-surface: #2a2a2a;
  --color-surface-elevated: #3a3a3a;
  --color-text: #ffffff;
  --color-text-muted: #888888;
  --color-text-dimmed: #666666;
  --color-success: #00ff00;
  --color-warning: #ffff00;
  --color-error: #ff0000;
  --color-info: #00ffff;
  
  /* Status Colors */
  --color-status-idle: #666666;
  --color-status-active: #ffff00;
  --color-status-running: #00ffff;
  --color-status-success: #00ff00;
  --color-status-error: #ff0000;
  --color-status-warning: #ffff00;
  
  /* Typography */
  --font-display: 'Courier New', Courier, monospace;
  --font-body: 'IBM Plex Mono', 'Courier New', monospace;
  --font-mono: 'Courier New', Courier, monospace;
  
  /* Font Sizes */
  --text-hero: 72px;
  --text-h1: 48px;
  --text-h2: 32px;
  --text-h3: 24px;
  --text-h4: 20px;
  --text-body: 16px;
  --text-small: 14px;
  --text-tiny: 12px;
  
  /* Line Heights */
  --leading-tight: 1.2;
  --leading-normal: 1.5;
  --leading-relaxed: 1.75;
  
  /* Spacing Scale (8px base) */
  --space-unit: 8px;
  --space-0: 0;
  --space-1: calc(var(--space-unit) * 0.5);   /* 4px */
  --space-2: var(--space-unit);               /* 8px */
  --space-3: calc(var(--space-unit) * 1.5);   /* 12px */
  --space-4: calc(var(--space-unit) * 2);     /* 16px */
  --space-5: calc(var(--space-unit) * 3);     /* 24px */
  --space-6: calc(var(--space-unit) * 4);     /* 32px */
  --space-7: calc(var(--space-unit) * 6);     /* 48px */
  --space-8: calc(var(--space-unit) * 8);     /* 64px */
  --space-9: calc(var(--space-unit) * 12);    /* 96px */
  --space-10: calc(var(--space-unit) * 16);   /* 128px */
  
  /* Motion */
  --ease-linear: linear;
  --ease-brutal: cubic-bezier(0, 0, 1, 1);
  --duration-instant: 50ms;
  --duration-fast: 100ms;
  --duration-normal: 200ms;
  --duration-slow: 400ms;
  --duration-dramatic: 600ms;
  
  /* Borders */
  --border-width: 1px;
  --border-width-thick: 2px;
  --border-radius: 0px;
  
  /* Grid System */
  --grid-size: 8px;
  --grid-color: rgba(255, 255, 255, 0.05);
  --grid-line-width: 1px;
  
  /* Shadows */
  --shadow-none: none;
  --shadow-harsh: 2px 2px 0px rgba(0, 0, 0, 0.8);
  --shadow-brutal: 4px 4px 0px rgba(0, 0, 0, 0.9);
  
  /* Z-Index Scale */
  --z-base: 0;
  --z-dropdown: 100;
  --z-modal: 200;
  --z-toast: 300;
  --z-tooltip: 400;
}
```

#### 2. CSS Reset

```css
/* styles/reset.css */
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  font-family: var(--font-body);
  font-size: var(--text-body);
  line-height: var(--leading-normal);
  color: var(--color-text);
  background-color: var(--color-background);
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-display);
  font-weight: 700;
  line-height: var(--leading-tight);
  text-transform: uppercase;
}

a {
  color: var(--color-accent);
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}

button {
  font-family: inherit;
  cursor: pointer;
}

input, textarea, select {
  font-family: var(--font-mono);
  font-size: inherit;
}

ul, ol {
  list-style: none;
}

img, svg {
  display: block;
  max-width: 100%;
}

/* Remove default focus styles */
:focus {
  outline: none;
}

/* Custom focus styles */
:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

/* Selection */
::selection {
  background-color: var(--color-accent);
  color: var(--color-secondary);
}
```

#### 3. Grid Background

```css
/* styles/grid.css */
.grid-background {
  background-image: 
    linear-gradient(var(--grid-color) var(--grid-line-width), transparent var(--grid-line-width)),
    linear-gradient(90deg, var(--grid-color) var(--grid-line-width), transparent var(--grid-line-width));
  background-size: var(--grid-size) var(--grid-size);
  background-position: calc(var(--grid-size) * -0.5) calc(var(--grid-size) * -0.5);
}

.grid-background-dense {
  --grid-size: 4px;
  --grid-color: rgba(255, 255, 255, 0.03);
}

.grid-background-sparse {
  --grid-size: 16px;
  --grid-color: rgba(255, 255, 255, 0.08);
}

.grid-background-high-contrast {
  --grid-color: rgba(255, 255, 255, 0.2);
}

/* Blueprint style for technical diagrams */
.blueprint-grid {
  background-color: #0a1628;
  background-image:
    linear-gradient(rgba(0, 100, 200, 0.1) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 100, 200, 0.1) 1px, transparent 1px),
    linear-gradient(rgba(0, 100, 200, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 100, 200, 0.05) 1px, transparent 1px);
  background-size: 64px 64px, 64px 64px, 8px 8px, 8px 8px;
  background-position: -1px -1px, -1px -1px, -1px -1px, -1px -1px;
}
```

#### 4. Typography

```css
/* styles/typography.css */
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&display=swap');

.font-display {
  font-family: var(--font-display);
}

.font-body {
  font-family: var(--font-body);
}

.font-mono {
  font-family: var(--font-mono);
}

/* Headings */
.text-hero {
  font-size: var(--text-hero);
  font-family: var(--font-display);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: -0.02em;
}

.text-h1 {
  font-size: var(--text-h1);
  font-family: var(--font-display);
  font-weight: 700;
  text-transform: uppercase;
}

.text-h2 {
  font-size: var(--text-h2);
  font-family: var(--font-display);
  font-weight: 600;
  text-transform: uppercase;
}

.text-h3 {
  font-size: var(--text-h3);
  font-family: var(--font-display);
  font-weight: 600;
}

.text-h4 {
  font-size: var(--text-h4);
  font-family: var(--font-display);
  font-weight: 500;
}

/* Body */
.text-body {
  font-size: var(--text-body);
  line-height: var(--leading-normal);
}

.text-small {
  font-size: var(--text-small);
  line-height: var(--leading-normal);
}

.text-tiny {
  font-size: var(--text-tiny);
  line-height: var(--leading-tight);
}

/* Labels (uppercase monospace) */
.text-label {
  font-family: var(--font-display);
  font-size: var(--text-tiny);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

/* Monospace data */
.text-data {
  font-family: var(--font-mono);
  font-size: var(--text-body);
  font-variant-numeric: tabular-nums;
}

/* Code blocks */
.text-code {
  font-family: var(--font-mono);
  font-size: var(--text-small);
  background-color: var(--color-primary);
  padding: var(--space-1) var(--space-2);
  border: var(--border-width) solid var(--color-primary);
}

/* Status text */
.text-success { color: var(--color-success); }
.text-warning { color: var(--color-warning); }
.text-error { color: var(--color-error); }
.text-muted { color: var(--color-text-muted); }
.text-dimmed { color: var(--color-text-dimmed); }
```

#### 5. Component Styles

```css
/* styles/components.css */

/* Cards */
.brutalist-card {
  background-color: var(--color-surface);
  border: var(--border-width) solid var(--color-primary);
  border-radius: var(--border-radius);
  padding: var(--space-4);
  font-family: var(--font-body);
}

.brutalist-card-elevated {
  background-color: var(--color-surface-elevated);
  box-shadow: var(--shadow-harsh);
}

.brutalist-card-header {
  font-family: var(--font-display);
  font-size: var(--text-h3);
  text-transform: uppercase;
  padding-bottom: var(--space-3);
  margin-bottom: var(--space-3);
  border-bottom: var(--border-width) solid var(--color-primary);
}

/* Buttons */
.brutalist-button {
  font-family: var(--font-display);
  font-size: var(--text-small);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  
  background-color: var(--color-surface);
  color: var(--color-text);
  border: var(--border-width) solid transparent;
  border-radius: var(--border-radius);
  
  padding: var(--space-2) var(--space-4);
  
  transition: border-color var(--duration-fast) var(--ease-linear),
              background-color var(--duration-fast) var(--ease-linear);
}

.brutalist-button:hover {
  border-color: var(--color-text);
  background-color: var(--color-surface-elevated);
}

.brutalist-button:active {
  transform: translate(1px, 1px);
}

.brutalist-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.brutalist-button-primary {
  background-color: var(--color-primary);
  color: var(--color-secondary);
  border-color: var(--color-primary);
}

.brutalist-button-primary:hover {
  background-color: var(--color-surface);
  color: var(--color-text);
}

.brutalist-button-danger {
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.brutalist-button-danger:hover {
  background-color: var(--color-accent);
  color: var(--color-secondary);
}

/* Inputs */
.brutalist-input {
  font-family: var(--font-mono);
  font-size: var(--text-body);
  
  background-color: transparent;
  color: var(--color-text);
  
  border: none;
  border-bottom: var(--border-width) solid var(--color-text-muted);
  border-radius: var(--border-radius);
  
  padding: var(--space-2) 0;
  width: 100%;
  
  transition: border-color var(--duration-fast) var(--ease-linear);
}

.brutalist-input:focus {
  border-bottom-color: var(--color-accent);
}

.brutalist-input::placeholder {
  color: var(--color-text-dimmed);
}

.brutalist-input-boxed {
  border: var(--border-width) solid var(--color-text-muted);
  padding: var(--space-2) var(--space-3);
}

.brutalist-input-boxed:focus {
  border-color: var(--color-accent);
}

/* Select */
.brutalist-select {
  font-family: var(--font-mono);
  font-size: var(--text-body);
  
  background-color: var(--color-surface);
  color: var(--color-text);
  
  border: var(--border-width) solid var(--color-primary);
  border-radius: var(--border-radius);
  
  padding: var(--space-2) var(--space-4);
  padding-right: var(--space-8);
  
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ffffff' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right var(--space-2) center;
}

/* Tables */
.brutalist-table {
  width: 100%;
  border-collapse: collapse;
  font-family: var(--font-mono);
  font-size: var(--text-small);
}

.brutalist-table th {
  font-family: var(--font-display);
  text-transform: uppercase;
  text-align: left;
  padding: var(--space-2) var(--space-3);
  border-bottom: var(--border-width-thick) solid var(--color-primary);
  background-color: var(--color-surface);
}

.brutalist-table td {
  padding: var(--space-2) var(--space-3);
  border-bottom: var(--border-width) solid var(--color-primary);
}

.brutalist-table tr:hover td {
  background-color: var(--color-surface-elevated);
}

/* Progress Bar */
.brutalist-progress {
  height: var(--space-2);
  background-color: var(--color-surface);
  border: var(--border-width) solid var(--color-primary);
}

.brutalist-progress-bar {
  height: 100%;
  background-color: var(--color-accent);
  transition: width var(--duration-normal) var(--ease-linear);
}

/* Status Indicator */
.brutalist-status {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  font-family: var(--font-display);
  font-size: var(--text-tiny);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.brutalist-status-dot {
  width: var(--space-2);
  height: var(--space-2);
  background-color: var(--color-text-muted);
}

.brutalist-status-dot.idle { background-color: var(--color-status-idle); }
.brutalist-status-dot.active { background-color: var(--color-status-active); }
.brutalist-status-dot.running { background-color: var(--color-status-running); animation: pulse 1s infinite; }
.brutalist-status-dot.success { background-color: var(--color-status-success); }
.brutalist-status-dot.error { background-color: var(--color-status-error); }
.brutalist-status-dot.warning { background-color: var(--color-status-warning); }

/* Tags */
.brutalist-tag {
  display: inline-block;
  font-family: var(--font-display);
  font-size: var(--text-tiny);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  
  background-color: var(--color-primary);
  color: var(--color-secondary);
  
  padding: var(--space-1) var(--space-2);
  border: var(--border-width) solid var(--color-secondary);
}

/* Divider */
.brutalist-divider {
  height: var(--border-width);
  background-color: var(--color-primary);
  margin: var(--space-4) 0;
}
```

#### 6. Animations

```css
/* styles/animations.css */

/* Keyframes */
@keyframes brutalist-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@keyframes brutalist-blink {
  0%, 100% { background-color: var(--color-surface); }
  50% { background-color: var(--color-accent); }
}

@keyframes brutalist-slide-in {
  from { transform: translateX(-100%); }
  to { transform: translateX(0); }
}

@keyframes brutalist-slide-out {
  from { transform: translateX(0); }
  to { transform: translateX(-100%); }
}

@keyframes brutalist-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes brutalist-type-cursor {
  0%, 100% { border-right-color: var(--color-text); }
  50% { border-right-color: transparent; }
}

/* Animation Classes */
.animate-pulse {
  animation: brutalist-pulse 1s var(--ease-linear) infinite;
}

.animate-blink {
  animation: brutalist-blink 0.5s var(--ease-linear) infinite;
}

.animate-slide-in {
  animation: brutalist-slide-in var(--duration-normal) var(--ease-linear);
}

.animate-fade-in {
  animation: brutalist-fade-in var(--duration-fast) var(--ease-linear);
}

.animate-type-cursor {
  border-right: 2px solid var(--color-text);
  animation: brutalist-type-cursor 1s step-end infinite;
}

/* Stagger delays for list items */
.stagger-item {
  animation: brutalist-fade-in var(--duration-normal) var(--ease-linear) both;
}

.stagger-item:nth-child(1) { animation-delay: 0ms; }
.stagger-item:nth-child(2) { animation-delay: 50ms; }
.stagger-item:nth-child(3) { animation-delay: 100ms; }
.stagger-item:nth-child(4) { animation-delay: 150ms; }
.stagger-item:nth-child(5) { animation-delay: 200ms; }
.stagger-item:nth-child(6) { animation-delay: 250ms; }
.stagger-item:nth-child(7) { animation-delay: 300ms; }
.stagger-item:nth-child(8) { animation-delay: 350ms; }
.stagger-item:nth-child(9) { animation-delay: 400ms; }
.stagger-item:nth-child(10) { animation-delay: 450ms; }

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
  
  .animate-pulse,
  .animate-blink,
  .animate-type-cursor {
    animation: none;
  }
}
```

#### 7. Themes

```css
/* styles/themes/brutalist-dark.css */
:root[data-theme="brutalist-dark"] {
  --color-primary: #000000;
  --color-secondary: #ffffff;
  --color-accent: #ff0000;
  --color-background: #1a1a1a;
  --color-surface: #2a2a2a;
  --color-surface-elevated: #3a3a3a;
  --color-text: #ffffff;
  --color-text-muted: #888888;
  --color-text-dimmed: #666666;
  --grid-color: rgba(255, 255, 255, 0.05);
}

/* styles/themes/brutalist-light.css */
:root[data-theme="brutalist-light"] {
  --color-primary: #000000;
  --color-secondary: #ffffff;
  --color-accent: #cc0000;
  --color-background: #ffffff;
  --color-surface: #f0f0f0;
  --color-surface-elevated: #e0e0e0;
  --color-text: #000000;
  --color-text-muted: #666666;
  --color-text-dimmed: #999999;
  --grid-color: rgba(0, 0, 0, 0.05);
}

/* styles/themes/high-contrast.css */
:root[data-theme="high-contrast"] {
  --color-primary: #ffffff;
  --color-secondary: #000000;
  --color-accent: #ffff00;
  --color-background: #000000;
  --color-surface: #000000;
  --color-surface-elevated: #1a1a1a;
  --color-text: #ffffff;
  --color-text-muted: #cccccc;
  --color-text-dimmed: #888888;
  --grid-color: rgba(255, 255, 255, 0.2);
  --border-width: 2px;
}

/* High contrast specific overrides */
:root[data-theme="high-contrast"] .brutalist-button {
  padding: var(--space-3) var(--space-5);
}

:root[data-theme="high-contrast"] .brutalist-input {
  border-bottom-width: 2px;
}
```

#### 8. Utility Classes

```css
/* styles/utilities.css */

/* Display */
.hidden { display: none; }
.block { display: block; }
.inline { display: inline; }
.inline-block { display: inline-block; }
.flex { display: flex; }
.grid { display: grid; }

/* Flexbox */
.flex-row { flex-direction: row; }
.flex-col { flex-direction: column; }
.flex-wrap { flex-wrap: wrap; }
.items-start { align-items: flex-start; }
.items-center { align-items: center; }
.items-end { align-items: flex-end; }
.justify-start { justify-content: flex-start; }
.justify-center { justify-content: center; }
.justify-end { justify-content: flex-end; }
.justify-between { justify-content: space-between; }
.gap-1 { gap: var(--space-1); }
.gap-2 { gap: var(--space-2); }
.gap-3 { gap: var(--space-3); }
.gap-4 { gap: var(--space-4); }
.gap-5 { gap: var(--space-5); }
.gap-6 { gap: var(--space-6); }

/* Spacing */
.m-0 { margin: var(--space-0); }
.m-1 { margin: var(--space-1); }
.m-2 { margin: var(--space-2); }
.m-3 { margin: var(--space-3); }
.m-4 { margin: var(--space-4); }
.m-5 { margin: var(--space-5); }
.m-6 { margin: var(--space-6); }

.p-0 { padding: var(--space-0); }
.p-1 { padding: var(--space-1); }
.p-2 { padding: var(--space-2); }
.p-3 { padding: var(--space-3); }
.p-4 { padding: var(--space-4); }
.p-5 { padding: var(--space-5); }
.p-6 { padding: var(--space-6); }

/* Width/Height */
.w-full { width: 100%; }
.h-full { height: 100%; }
.min-h-screen { min-height: 100vh; }

/* Overflow */
.overflow-hidden { overflow: hidden; }
.overflow-auto { overflow: auto; }
.overflow-scroll { overflow: scroll; }

/* Position */
.relative { position: relative; }
.absolute { position: absolute; }
.fixed { position: fixed; }
.sticky { position: sticky; }

/* Text */
.text-center { text-align: center; }
.text-left { text-align: left; }
.text-right { text-align: right; }
.truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* Border */
.border { border: var(--border-width) solid var(--color-primary); }
.border-t { border-top: var(--border-width) solid var(--color-primary); }
.border-b { border-bottom: var(--border-width) solid var(--color-primary); }
.border-l { border-left: var(--border-width) solid var(--color-primary); }
.border-r { border-right: var(--border-width) solid var(--color-primary); }

/* Cursor */
.cursor-pointer { cursor: pointer; }
.cursor-not-allowed { cursor: not-allowed; }

/* Visibility */
.visible { visibility: visible; }
.invisible { visibility: hidden; }
```

#### 9. Tailwind Configuration

```javascript
// tailwind.config.js
module.exports = {
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
        6: 'var(--space-7)',
        8: 'var(--space-8)',
        12: 'var(--space-9)',
        16: 'var(--space-10)',
      },
      borderRadius: {
        NONE: '0',
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
    },
  },
  plugins: [],
};
```

#### 10. Theme Switching

```typescript
// hooks/useTheme.ts
export type Theme = 'brutalist-dark' | 'brutalist-light' | 'high-contrast';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem('speclang-theme') as Theme;
    if (stored) return stored;
    
    if (window.matchMedia('(prefers-contrast: more)').matches) {
      return 'high-contrast';
    }
    if (window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'brutalist-light';
    }
    return 'brutalist-dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('speclang-theme', theme);
  }, [theme]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem('speclang-theme')) {
        setTheme(e.matches ? 'brutalist-dark' : 'brutalist-light');
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return { theme, setTheme };
}
```

## Test Cases
1. Variables correctly applied to components
2. Theme switching updates all colors
3. Grid background renders correctly
4. Typography scales properly
5. Animations respect reduced motion
6. High contrast theme meets WCAG AAA
7. Focus states visible in all themes

## Validation
```bash
# Build CSS
bun run build:css

# Check for CSS errors
stylelint "src/dashboard/styles/**/*.css"

# Visual regression tests
bunx playwright test e2e/visual.spec.ts

# Accessibility audit
bunx axe-cli http://localhost:5173
```

## Output Format
After completing, output:
1. CSS files created
2. Themes implemented
3. Color contrast ratios
4. Reduced motion support
