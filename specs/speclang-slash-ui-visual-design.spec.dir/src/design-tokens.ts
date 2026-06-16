/**
 * SPECLANG-GENERATED: Visual design system tokens
 * Source: @speclang/ui.visual-design @block:dashboard/visual-design-system
 * Source: @speclang/ui.visual-design @block:ui/design-themes
 * Source: @speclang/ui.visual-design @block:dashboard/accessibility-considerations
 */

export const visualDesignSystem = {
  aestheticDirection: 'Brutalist/Raw',
  conceptualFoundation: {
    inspiration: 'Architectural brutalism, exposed concrete, raw materials, functionalist design',
    metaphor: 'Exposed mechanics of the reactive cascade',
    emotion: 'Utilitarian, powerful, transparent, no-nonsense',
  },
  colorPalette: {
    primary: '#000000',
    secondary: '#ffffff',
    accent: '#ff0000',
    background: '#1a1a1a',
    surface: '#2a2a2a',
    text: '#ffffff',
    textMuted: '#888888',
    success: '#00ff00',
    warning: '#ffff00',
    error: '#ff0000',
  },
  typography: {
    displayFont: "'Courier New', Courier, monospace",
    bodyFont: "'IBM Plex Mono', 'Courier New', monospace",
    monoFont: "'Courier New', Courier, monospace",
    sizes: {
      hero: '72px',
      h1: '48px',
      h2: '32px',
      h3: '24px',
      body: '16px',
      small: '14px',
      tiny: '12px',
    },
  },
  spatialSystem: {
    grid: '8px baseline grid with exposed grid lines as background texture',
    spacingScale: [0, 4, 8, 12, 16, 24, 32, 48, 64, 96, 128],
    borderRadius: '0px',
    shadows: 'None, or harsh 2px black drop shadows for elevation',
  },
  motionDesign: {
    easing: 'linear',
    durations: {
      instant: '50ms',
      fast: '100ms',
      normal: '200ms',
      slow: '400ms',
      dramatic: '600ms',
    },
    staggerDelays: 'Uniform 50ms steps for list items',
  },
  componentStyles: {
    cards: 'No rounded corners, solid 1px borders, exposed grid lines as subtle background texture',
    buttons: 'Flat with no shadows, 1px border on hover, uppercase monospace labels',
    inputs: 'Underline-only styling, no rounded corners, raw text entry',
    navigation: 'Exposed tabs with raw separators, no rounded edges',
    timeline: 'Vertical lines with raw connectors, monospace labels',
    metrics: 'Large monospace numbers with exposed grid backgrounds',
  },
  distinctiveElements: [
    'Exposed grid lines overlay across entire UI (subtle texture)',
    'Monospace typography enforced throughout',
    'Harsh black/white/red color scheme with no gradients',
    'No rounded corners anywhere',
    'Visible 1px borders separating all components',
    'Raw data presentation with minimal abstraction',
    'Technical diagrams with blueprint aesthetic',
  ],
  responsiveBehavior: {
    mobileAdaptations: 'Maintain vertical stacking, grid lines may disappear on small screens',
    breakpointChanges: 'At 768px: expose grid lines; at 1024px: increase grid density',
  },
} as const;

export const designThemes = {
  brutalistDark: {
    background: 'var(--color-background)',
    surface: 'var(--color-surface)',
    text: 'var(--color-text)',
    border: 'var(--color-primary)',
    codeBackground: '#000000',
    gridLines: 'visible',
    aesthetic: 'raw, exposed, utilitarian',
  },
  brutalistLight: {
    background: '#ffffff',
    surface: '#f0f0f0',
    text: '#000000',
    border: '#000000',
    codeBackground: '#ffffff',
    gridLines: 'visible',
    aesthetic: 'high contrast, raw',
  },
  highContrastBrutalist: {
    background: '#000000',
    surface: '#000000',
    text: '#ffffff',
    border: '#ffffff',
    codeBackground: '#000000',
    gridLines: 'high_visibility',
    largerClickTargets: true,
    reducedAnimations: true,
  },
  editorThemes: {
    speclangBrutalistDark: 'matches brutalist_dark theme',
    speclangBrutalistLight: 'matches brutalist_light theme',
    speclangRaw: 'monochrome with syntax highlighting only in red/green',
  },
} as const;

export const accessibilityConsiderations = {
  colorContrast: [
    'Black/white contrast ratio: 21:1 (exceeds WCAG AAA)',
    'Red on black: 5.3:1 (may need enhancement for colorblind users)',
    'Green on black: 15.3:1 (good)',
    'Yellow on black: 19.6:1 (good)',
  ],
  typographyReadability: [
    'Monospace fonts may reduce readability for dyslexic users',
    'Provide option to switch to sans-serif font',
    'Font size scaling: all sizes use relative units (rem)',
    'Line height: 1.5 minimum for monospace',
  ],
  motionSensitivity: [
    'All animations respect prefers-reduced-motion',
    'Blinking animations limited to 3 times',
    'No auto-playing animations that cannot be paused',
    'Linear easing (mechanical) reduces motion sickness',
  ],
  keyboardNavigation: [
    'All interactive elements have focus indicators',
    'Focus order follows visual layout',
    'Skip links available for bypassing repetitive content',
    'Complex widgets (graph, timeline) have keyboard alternatives',
  ],
  screenReaderOptimizations: [
    'ARIA labels for all grid lines and decorative elements',
    'Live regions for real-time updates (cascade status, logs)',
    'Status announcements for state changes',
    'Alternative text for visualizations (graph, charts)',
  ],
  highContrastMode: [
    'High contrast brutalist theme provided',
    'Forced colors mode (Windows High Contrast) supported',
    'Custom focus indicators visible in high contrast',
  ],
  cognitiveAccessibility: [
    'Consistent layout reduces cognitive load',
    'Raw data presentation benefits technical users',
    'Minimal abstraction may increase complexity for novice users',
    'Provide tooltips and explanations for technical terms',
  ],
} as const;