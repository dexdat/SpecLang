# speclang-header lines:9
id: "@speclang/ui-visual-design"
version: 0.1.0
layer: 0
project_level: Alpha
agent_support: agent_assisted
tags: [ui, visual-design]
short: UI visual design system
---

# UI Visual Design System

This is a parent spec for the UI visual design system directory.

## Overview

### @block::purpose @kind:entity

Purpose:
  description: Visual design system for SpecLang dashboard
  components:
    - Colors
    - Typography
    - Spacing
    - Components

### @block::colors @kind:entity

Colors:
  primary:
    - name: Blue
      hex: "#0066CC"
    - name: Green
      hex: "#28A745"
      
  neutral:
    - name: Gray 100
      hex: "#F7F7F9"
    - name: Gray 900
      hex: "#1A1A1A"

### @block::typography @kind:entity

Typography:
  fonts:
    - family: Inter
      weights: [400, 500, 600, 700]
      
  sizes:
    - name: xs
      px: 12
    - name: sm
      px: 14
    - name: md
      px: 16
    - name: lg
      px: 20
    - name: xl
      px: 24

### @block::spacing @kind:entity

Spacing:
  scale:
    - name: 0
      px: 0
    - name: 1
      px: 4
    - name: 2
      px: 8
    - name: 3
      px: 12
    - name: 4
      px: 16
    - name: 6
      px: 24
    - name: 8
      px: 32
