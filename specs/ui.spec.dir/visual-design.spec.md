# speclang-header lines:11
id: "@speclang/ui.visual-design"
parent: "@ref:specs/ui"
part: 2/14
short: Visual design system, CSS architecture, themes, accessibility
project_level: Alpha
agent_support: agent_assisted
tags: [speclang]
version: 0.1.0
layer: 0
---

## Visual Design System

### @dashboard/visual-design-system

```speclang
# @block:dashboard/visual-design-system @kind:entity
VisualDesignSystem:
  aesthetic_direction: "Brutalist/Raw"
  
  conceptual_foundation:
    inspiration: "Architectural brutalism, exposed concrete, raw materials, functionalist design"
    metaphor: "Exposed mechanics of the reactive cascade"
    emotion: "Utilitarian, powerful, transparent, no-nonsense"
  
  color_palette:
    primary: "#000000 - Black (dominant surfaces, text)"
    secondary: "#FFFFFF - White (sharp contrast, highlights)"
    accent: "#FF0000 - Red (urgent actions, errors, warnings)"
    background: "#1a1a1a - Dark gray (main background)"
    surface: "#2a2a2a - Medium gray (cards, panels)"
    text: "#FFFFFF - White (primary text)"
    text_muted: "#888888 - Gray (secondary text, labels)"
    success: "#00FF00 - Green (success states, completed)"
    warning: "#FFFF00 - Yellow (warnings, pending)"
    error: "#FF0000 - Red (errors, failures)"
    
  typography:
    display_font: "Courier New - Raw monospace for headers, titles, and data displays"
    body_font: "IBM Plex Mono - Refined monospace for body text and UI labels"
    mono_font: "Courier New - Raw monospace for code and technical displays"
    sizes:
      - hero: "72px - Page titles"
      - h1: "48px - Section headers"
      - h2: "32px - Card titles"
      - h3: "24px - Subsections"
      - body: "16px - Main text"
      - small: "14px - Labels, metadata"
      - tiny: "12px - Timestamps, tags"
  
  spatial_system:
    grid: "8px baseline grid with exposed grid lines as background texture"
    spacing_scale: [0, 4, 8, 12, 16, 24, 32, 48, 64, 96, 128]
    border_radius: "0px (sharp corners only)"
    shadows: "None, or harsh 2px black drop shadows for elevation"
  
  motion_design:
    easing: "linear (mechanical, precise)"
    durations:
      - instant: "50ms - Micro-interactions"
      - fast: "100ms - Button states"
      - normal: "200ms - Transitions"
      - slow: "400ms - Page transitions"
      - dramatic: "600ms - Hero animations"
    stagger_delays: "Uniform 50ms steps for list items"
  
  component_styles:
    cards: "No rounded corners, solid 1px borders, exposed grid lines as subtle background texture"
    buttons: "Flat with no shadows, 1px border on hover, uppercase monospace labels"
    inputs: "Underline-only styling, no rounded corners, raw text entry"
    navigation: "Exposed tabs with raw separators, no rounded edges"
    timeline: "Vertical lines with raw connectors, monospace labels"
    metrics: "Large monospace numbers with exposed grid backgrounds"
  
  distinctive_elements:
    - "Exposed grid lines overlay across entire UI (subtle texture)"
    - "Monospace typography enforced throughout"
    - "Harsh black/white/red color scheme with no gradients"
    - "No rounded corners anywhere"
    - "Visible 1px borders separating all components"
    - "Raw data presentation with minimal abstraction"
    - "Technical diagrams with blueprint aesthetic"
  
  responsive_behavior:
    mobile_adaptations: "Maintain vertical stacking, grid lines may disappear on small screens"
    breakpoint_changes: "At 768px: expose grid lines; at 1024px: increase grid density"
```

### @dashboard/css-architecture

```speclang
# @block:dashboard/css-architecture @kind:code
```css
/* CSS Custom Properties - Brutalist Design System */
:root {
  /* Colors */
  --color-primary: #000000;
  --color-secondary: #ffffff;
  --color-accent: #ff0000;
  --color-background: #1a1a1a;
  --color-surface: #2a2a2a;
  --color-text: #ffffff;
  --color-text-muted: #888888;
  --color-success: #00ff00;
  --color-warning: #ffff00;
  --color-error: #ff0000;
  
  /* Typography */
  --font-display: 'Courier New', Courier, monospace;
  --font-body: 'IBM Plex Mono', 'Courier New', monospace;
  --font-mono: 'Courier New', Courier, monospace;
  
  /* Spacing */
  --space-unit: 8px;
  --space-0: 0;
  --space-1: calc(var(--space-unit) * 0.5);  /* 4px */
  --space-2: var(--space-unit);              /* 8px */
  --space-3: calc(var(--space-unit) * 1.5);  /* 12px */
  --space-4: calc(var(--space-unit) * 2);    /* 16px */
  --space-5: calc(var(--space-unit) * 3);    /* 24px */
  --space-6: calc(var(--space-unit) * 4);    /* 32px */
  --space-7: calc(var(--space-unit) * 6);    /* 48px */
  --space-8: calc(var(--space-unit) * 8);    /* 64px */
  --space-9: calc(var(--space-unit) * 12);   /* 96px */
  --space-10: calc(var(--space-unit) * 16);  /* 128px */
  
  /* Motion */
  --ease-linear: linear;
  --duration-instant: 50ms;
  --duration-fast: 100ms;
  --duration-normal: 200ms;
  --duration-slow: 400ms;
  --duration-dramatic: 600ms;
  
  /* Borders */
  --border-width: 1px;
  --border-radius: 0px;
  
  /* Grid */
  --grid-size: 8px;
  --grid-color: rgba(255, 255, 255, 0.05);
  --grid-line-width: 1px;
  
  /* Shadows */
  --shadow-harsh: 2px 2px 0px rgba(0, 0, 0, 0.8);
  --shadow-none: none;
}

/* Grid background texture */
.grid-background {
  background-image: 
    linear-gradient(var(--grid-color) var(--grid-line-width), transparent var(--grid-line-width)),
    linear-gradient(90deg, var(--grid-color) var(--grid-line-width), transparent var(--grid-line-width));
  background-size: var(--grid-size) var(--grid-size);
  background-position: calc(var(--grid-size) * -0.5) calc(var(--grid-size) * -0.5);
}

/* Brutalist utility classes */
.brutalist-card {
  background-color: var(--color-surface);
  border: var(--border-width) solid var(--color-primary);
  border-radius: var(--border-radius);
  font-family: var(--font-body);
}

.brutalist-button {
  font-family: var(--font-display);
  text-transform: uppercase;
  border: var(--border-width) solid transparent;
  background-color: var(--color-surface);
  color: var(--color-text);
  padding: var(--space-2) var(--space-4);
  transition: border-color var(--duration-fast) var(--ease-linear);
}

.brutalist-button:hover {
  border-color: var(--color-accent);
}

.brutalist-input {
  font-family: var(--font-mono);
  background-color: transparent;
  border: none;
  border-bottom: var(--border-width) solid var(--color-text-muted);
  border-radius: var(--border-radius);
  padding: var(--space-2) 0;
  color: var(--color-text);
}

.brutalist-input:focus {
  border-bottom-color: var(--color-accent);
  outline: none;
}

/* Animation keyframes */
@keyframes brutalist-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

@keyframes brutalist-slide {
  from { transform: translateX(-100%); }
  to { transform: translateX(0); }
}

@keyframes brutalist-blink {
  0%, 100% { background-color: var(--color-surface); }
  50% { background-color: var(--color-accent); }
}
```
```

### @ui/design-themes

```speclang
# @block:ui/design-themes @kind:entity
Themes:
  
  brutalist_dark:
    background: var(--color-background)
    surface: var(--color-surface)
    text: var(--color-text)
    border: var(--color-primary)
    code_background: #000000
    grid_lines: visible
    aesthetic: "raw, exposed, utilitarian"
  
  brutalist_light:
    background: #ffffff
    surface: #f0f0f0
    text: #000000
    border: #000000
    code_background: #ffffff
    grid_lines: visible
    aesthetic: "high contrast, raw"
  
  high_contrast_brutalist:
    background: #000000
    surface: #000000
    text: #ffffff
    border: #ffffff
    code_background: #000000
    grid_lines: high_visibility
    larger_click_targets: true
    reduced_animations: true
  
  editor_themes:
    speclang_brutalist_dark: matches brutalist_dark theme
    speclang_brutalist_light: matches brutalist_light theme
    speclang_raw: monochrome with syntax highlighting only in red/green
```

### @dashboard/accessibility-considerations

```speclang
# @block:dashboard/accessibility-considerations @kind:entity
AccessibilityConsiderations:
  
  color_contrast:
    - "Black/white contrast ratio: 21:1 (exceeds WCAG AAA)"
    - "Red on black: 5.3:1 (may need enhancement for colorblind users)"
    - "Green on black: 15.3:1 (good)"
    - "Yellow on black: 19.6:1 (good)"
  
  typography_readability:
    - "Monospace fonts may reduce readability for dyslexic users"
    - "Provide option to switch to sans-serif font"
    - "Font size scaling: all sizes use relative units (rem)"
    - "Line height: 1.5 minimum for monospace"
  
  motion_sensitivity:
    - "All animations respect prefers-reduced-motion"
    - "Blinking animations limited to 3 times"
    - "No auto-playing animations that cannot be paused"
    - "Linear easing (mechanical) reduces motion sickness"
  
  keyboard_navigation:
    - "All interactive elements have focus indicators"
    - "Focus order follows visual layout"
    - "Skip links available for bypassing repetitive content"
    - "Complex widgets (graph, timeline) have keyboard alternatives"
  
  screen_reader_optimizations:
    - "ARIA labels for all grid lines and decorative elements"
    - "Live regions for real-time updates (cascade status, logs)"
    - "Status announcements for state changes"
    - "Alternative text for visualizations (graph, charts)"
  
  high_contrast_mode:
    - "High contrast brutalist theme provided"
    - "Forced colors mode (Windows High Contrast) supported"
    - "Custom focus indicators visible in high contrast"
  
  cognitive_accessibility:
    - "Consistent layout reduces cognitive load"
    - "Raw data presentation benefits technical users"
    - "Minimal abstraction may increase complexity for novice users"
    - "Provide tooltips and explanations for technical terms"
```
