# MinecraftCAD - UI Design Language

## Design Philosophy

**Core Principle**: Clean, functional blueprint aesthetic inspired by technical drawings and architectural plans. The interface should feel professional, precise, and focused on the drawing task at hand.

**Visual Goals:**
- Minimal visual noise - every element serves a purpose
- Technical drawing feel with clean lines and precise spacing
- Blueprint color scheme that's easy on the eyes for extended use
- Responsive design that maximizes workspace area
- Consistent interaction patterns across all views and tools

## Color Palette

### Primary Colors
```css
--primary-bg: #1e3a5f;           /* Main background - deep blueprint blue */
--secondary-bg: #122032;         /* Sidebar/panel background - darker blue */
--workspace-bg: #0a1420;         /* Workspace background - darkest blue */
--accent-blue: #64b5f6;          /* Primary accent - bright blueprint blue */
--text-primary: #e8f4f8;         /* Primary text - light blue-white */
--border-color: #64b5f6;         /* All borders and lines */
```

### Interactive States
```css
--hover-bg: rgba(100, 181, 246, 0.1);    /* Subtle hover state */
--active-bg: rgba(100, 181, 246, 0.2);   /* Selected/pressed state */
--focus-bg: rgba(100, 181, 246, 0.3);    /* Focused/current state */
```

### Block Pattern Colors
```css
--pattern-solid: #666;           /* Block A - solid fill */
--pattern-diagonal: #888;        /* Block B - diagonal lines */
--pattern-cross: #444;           /* Block C - cross-hatch */
--pattern-dots: #555;            /* Block D - dots */
--pattern-brick: #777;           /* Block E - brick pattern */
```

## Typography

### Font Stack
```css
font-family: 'Courier New', 'Monaco', 'Menlo', monospace;
```

**Rationale**: Monospace fonts reinforce the technical/blueprint aesthetic and ensure consistent character spacing for coordinates and measurements.

### Font Sizes & Hierarchy
```css
--font-title: 24px;              /* Main application title */
--font-header: 14px;             /* Panel headers */
--font-button: 12px;             /* Buttons and interactive elements */
--font-body: 12px;               /* General body text */
--font-status: 11px;             /* Status bar and small info */
--font-tool: 10px;               /* Tool button labels */
```

### Text Styling Rules
- **Panel Headers**: UPPERCASE, bold, 1px letter-spacing
- **Button Labels**: UPPERCASE, normal weight, 1px letter-spacing
- **Status Information**: Normal case, compact spacing
- **Coordinates**: Monospace benefits for alignment

## Layout System

### Grid Structure
```
┌─────────────────────────────────────────────────────────┐
│ [20px border padding around entire interface]          │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Application Title (flex-shrink: 0)                  │ │
│ ├─────────────────────────────────────────────────────┤ │
│ │ ┌─────────┐ ┌─────────────────────────────────────┐ │ │
│ │ │ Sidebar │ │          Workspace                  │ │ │
│ │ │ (280px) │ │         (flex: 1)                   │ │ │
│ │ │         │ │                                     │ │ │
│ │ └─────────┘ └─────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Responsive Breakpoints
```css
/* Large desktop */
@media (min-width: 1800px) {
  --sidebar-width: 320px;
}

/* Standard desktop */
@media (min-width: 1200px) {
  --sidebar-width: 280px;
}

/* Medium screens */
@media (max-width: 1200px) {
  --sidebar-width: 240px;
}

/* Small screens */
@media (max-width: 800px) {
  --sidebar-width: 200px;
  --container-padding: 10px;
  --title-font-size: 18px;
}
```

### Spacing System
```css
--spacing-xs: 5px;               /* Tight spacing between related elements */
--spacing-sm: 8px;               /* Small gaps, button groups */
--spacing-md: 12px;              /* Standard padding inside components */
--spacing-lg: 15px;              /* Panel content padding */
--spacing-xl: 20px;              /* Major section separation */
```

## Component Standards

### Panels
```css
.panel {
  background: var(--secondary-bg);
  border-bottom: 1px solid var(--border-color);
  flex: 1;
}

.panel-header {
  background: var(--primary-bg);
  padding: var(--spacing-md);
  font-size: var(--font-header);
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 1px;
  border-bottom: 1px solid var(--border-color);
}

.panel-content {
  padding: var(--spacing-lg);
  height: calc(100% - 45px);
  overflow-y: auto;
}
```

### Buttons & Interactive Elements
```css
.button-primary {
  border: 1px solid var(--border-color);
  background: transparent;
  color: var(--text-primary);
  font-family: inherit;
  font-size: var(--font-button);
  text-transform: uppercase;
  letter-spacing: 1px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.button-primary:hover {
  background: var(--hover-bg);
}

.button-primary:active,
.button-primary.active {
  background: var(--active-bg);
}
```

### Block Type Items
```css
.block-item {
  border: 1px solid var(--border-color);
  padding: var(--spacing-md) var(--spacing-sm);
  text-align: center;
  cursor: pointer;
  font-size: var(--font-status);
  transition: background 0.2s ease;
}

.block-pattern {
  width: 40px;
  height: 20px;
  margin: 0 auto var(--spacing-sm);
  border: 1px solid var(--border-color);
}
```

### Tool Buttons
```css
.tool-btn {
  width: 35px;
  height: 35px;
  border: 1px solid var(--border-color);
  background: transparent;
  color: var(--text-primary);
  cursor: pointer;
  font-size: var(--font-tool);
  transition: background 0.2s ease;
}
```

## Hatch Patterns

### Pattern Definitions
```css
/* Solid Fill */
.pattern-solid {
  background: var(--pattern-solid);
}

/* Diagonal Lines */
.pattern-diagonal {
  background: linear-gradient(45deg, 
    transparent 40%, var(--pattern-diagonal) 40%, 
    var(--pattern-diagonal) 60%, transparent 60%);
  background-size: 8px 8px;
}

/* Cross-Hatch */
.pattern-cross {
  background: 
    linear-gradient(45deg, 
      transparent 40%, var(--pattern-cross) 40%, 
      var(--pattern-cross) 60%, transparent 60%),
    linear-gradient(-45deg, 
      transparent 40%, var(--pattern-cross) 40%, 
      var(--pattern-cross) 60%, transparent 60%);
  background-size: 8px 8px;
}

/* Dots */
.pattern-dots {
  background: radial-gradient(circle, var(--pattern-dots) 30%, transparent 30%);
  background-size: 8px 8px;
}

/* Brick Pattern */
.pattern-brick {
  background: 
    linear-gradient(0deg, var(--pattern-brick) 50%, transparent 50%),
    linear-gradient(90deg, var(--pattern-brick) 50%, transparent 50%);
  background-size: 16px 8px, 8px 16px;
}
```

## Workspace & Canvas

### Grid System
```css
.canvas-area {
  background: 
    linear-gradient(rgba(100, 181, 246, 0.1) 1px, transparent 1px),
    linear-gradient(90deg, rgba(100, 181, 246, 0.1) 1px, transparent 1px);
  background-size: 20px 20px;
}
```

### Status Bar
```css
.status-bar {
  height: 30px;
  background: var(--primary-bg);
  border-top: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  padding: 0 var(--spacing-xl);
  justify-content: space-between;
  font-size: var(--font-status);
}
```

## Interaction Guidelines

### Hover States
- **Subtle feedback**: Use `rgba(100, 181, 246, 0.1)` for hover backgrounds
- **Consistent timing**: All transitions use `0.2s ease`
- **Clear affordances**: Cursor changes to pointer for all interactive elements

### Active/Selected States
- **Clear indication**: Use `rgba(100, 181, 246, 0.2)` for active items
- **Single selection**: Only one block type, view mode, or tool active at a time
- **Persistent state**: Active states remain until user selects something else

### Focus States
- **Keyboard navigation**: Support tab navigation through interface
- **Visual clarity**: Focus states use `rgba(100, 181, 246, 0.3)` background

## Animation & Transitions

### Standard Transitions
```css
/* Default transition for interactive elements */
transition: background 0.2s ease;

/* For layout changes (panel resizing, etc.) */
transition: all 0.3s ease;
```

### Animation Principles
- **Subtle and functional**: Animations support usability, not decoration
- **Consistent timing**: 0.2s for state changes, 0.3s for layout changes
- **Easing**: Use `ease` for natural feeling transitions
- **Performance**: Animate only `background`, `opacity`, and `transform` properties

## Error States & Feedback

### Error Colors
```css
--error-color: #ff5555;          /* Error/warning accent */
--success-color: #50fa7b;        /* Success/confirmation accent */
```

### Validation States
- **Error borders**: Replace border-color with `--error-color`
- **Success feedback**: Brief success color flash for successful actions
- **Loading states**: Subtle opacity reduction during processing

## Accessibility

### Contrast Requirements
- Text on background: Minimum 7:1 contrast ratio
- Interactive elements: Minimum 3:1 contrast for borders/shapes
- Color not sole indicator: All states include shape/text changes

### Keyboard Navigation
- **Tab order**: Logical left-to-right, top-to-bottom flow
- **Skip links**: Allow jumping to main workspace
- **Escape key**: Cancel current operation/tool
- **Enter/Space**: Activate buttons and selections

## Implementation Notes

### CSS Custom Properties
Use CSS custom properties for all colors, spacing, and sizing to enable:
- Easy theme customization
- Consistent values across components
- Runtime theme switching capability

### Component Organization
```
styles/
├── variables.css        /* All CSS custom properties */
├── base.css            /* Base styles, typography */
├── layout.css          /* Grid system, main layout */
├── components/
│   ├── panels.css      /* Panel styles */
│   ├── buttons.css     /* Button variations */
│   ├── patterns.css    /* Hatch pattern definitions */
│   └── workspace.css   /* Canvas and workspace styles */
└── responsive.css      /* All media queries */
```

### Performance Considerations
- **GPU acceleration**: Use `transform` and `opacity` for animations
- **Minimal repaints**: Avoid animating layout properties
- **Pattern optimization**: Use CSS patterns instead of images when possible
- **Selector efficiency**: Use class selectors over complex combinations

---

**Last Updated**: [Current Date]  
**Version**: 1.0  
**Status**: Design System Complete