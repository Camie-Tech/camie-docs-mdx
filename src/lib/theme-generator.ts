// src/lib/theme-generator.ts
import { colord, extend } from 'colord'
import a11yPlugin from 'colord/plugins/a11y'
import mixPlugin from 'colord/plugins/mix'

// Extend colord with plugins
extend([a11yPlugin, mixPlugin])

interface ThemeConfig {
  primary: string
  secondary: string  
  accent: string
}

export interface GeneratedTheme {
  light: Record<string, string>
  dark: Record<string, string>
}

export function generateTheme(config: ThemeConfig): GeneratedTheme {
  const primary = colord(config.primary)
  const secondary = colord(config.secondary)
  const accent = colord(config.accent)

  // Light theme colors
  const lightTheme = {
    // Base colors
    background: 'oklch(1 0 0)', // Pure white
    foreground: 'oklch(0.145 0 0)', // Almost black
    
    // Card colors
    card: 'oklch(1 0 0)', // White
    'card-foreground': 'oklch(0.145 0 0)',
    
    // Popover colors
    popover: 'oklch(1 0 0)',
    'popover-foreground': 'oklch(0.145 0 0)',
    
    // Primary colors (user's primary color)
    primary: primary.toHex(),
    'primary-foreground': primary.isLight() 
      ? 'oklch(0.145 0 0)' 
      : 'oklch(0.985 0 0)',
    
    // Secondary colors (user's secondary color)
    secondary: secondary.lighten(0.4).toHex(),
    'secondary-foreground': secondary.darken(0.3).toHex(),
    
    // Muted colors (derived from secondary)
    muted: secondary.lighten(0.45).toHex(),
    'muted-foreground': secondary.darken(0.1).toHex(),
    
    // Accent colors (user's accent color)
    accent: accent.lighten(0.4).toHex(),
    'accent-foreground': accent.darken(0.3).toHex(),
    
    // Destructive (red - fixed)
    destructive: 'oklch(0.577 0.245 27.325)',
    
    // Border and input colors
    border: 'oklch(0.922 0 0)',
    input: 'oklch(0.922 0 0)',
    ring: primary.alpha(0.3).toHex(),
    
    // Chart colors (variations of user colors)
    'chart-1': primary.toHex(),
    'chart-2': secondary.toHex(), 
    'chart-3': accent.toHex(),
    'chart-4': primary.mix(accent, 0.5).toHex(),
    'chart-5': secondary.mix(accent, 0.5).toHex(),
    
    // Sidebar colors
    sidebar: 'oklch(0.985 0 0)',
    'sidebar-foreground': 'oklch(0.145 0 0)',
    'sidebar-primary': primary.toHex(),
    'sidebar-primary-foreground': primary.isLight() 
      ? 'oklch(0.145 0 0)' 
      : 'oklch(0.985 0 0)',
    'sidebar-accent': secondary.lighten(0.4).toHex(),
    'sidebar-accent-foreground': secondary.darken(0.3).toHex(),
    'sidebar-border': 'oklch(0.922 0 0)',
    'sidebar-ring': primary.alpha(0.3).toHex()
  }

  // Dark theme colors
  const darkTheme = {
    // Base colors - proper dark backgrounds
    background: 'oklch(0.11 0 0)', // Very dark gray
    foreground: 'oklch(0.98 0 0)', // Almost white
    
    // Card colors - slightly lighter than background
    card: 'oklch(0.15 0 0)', 
    'card-foreground': 'oklch(0.98 0 0)',
    
    // Popover colors
    popover: 'oklch(0.15 0 0)',
    'popover-foreground': 'oklch(0.98 0 0)',
    
    // Primary colors (brighter version of user's primary for dark mode)
    primary: primary.lighten(0.3).saturate(0.1).toHex(),
    'primary-foreground': 'oklch(0.11 0 0)', // Dark text on bright primary
    
    // Secondary colors (muted in dark mode)
    secondary: 'oklch(0.25 0 0)', // Neutral dark gray
    'secondary-foreground': 'oklch(0.98 0 0)',
    
    // Muted colors
    muted: 'oklch(0.25 0 0)',
    'muted-foreground': 'oklch(0.65 0 0)', // Medium gray
    
    // Accent colors (vibrant but not too bright)
    accent: 'oklch(0.25 0 0)',
    'accent-foreground': accent.lighten(0.4).toHex(),
    
    // Destructive (red)
    destructive: 'oklch(0.65 0.2 25)', // Softer red for dark mode
    
    // Border and input colors
    border: 'oklch(0.3 0 0)', // Visible but subtle
    input: 'oklch(0.3 0 0)',
    ring: primary.lighten(0.2).alpha(0.5).toHex(),
    
    // Chart colors (adjusted for dark mode)
    'chart-1': primary.lighten(0.2).toHex(),
    'chart-2': secondary.lighten(0.4).toHex(),
    'chart-3': accent.lighten(0.2).toHex(),
    'chart-4': primary.mix(accent, 0.5).lighten(0.2).toHex(),
    'chart-5': secondary.mix(accent, 0.5).lighten(0.3).toHex(),
    
    // Sidebar colors
    sidebar: 'oklch(0.13 0 0)', // Slightly different from main background
    'sidebar-foreground': 'oklch(0.98 0 0)',
    'sidebar-primary': primary.lighten(0.3).toHex(),
    'sidebar-primary-foreground': 'oklch(0.11 0 0)',
    'sidebar-accent': 'oklch(0.25 0 0)',
    'sidebar-accent-foreground': 'oklch(0.98 0 0)',
    'sidebar-border': 'oklch(0.3 0 0)',
    'sidebar-ring': primary.lighten(0.2).alpha(0.4).toHex()
  }

  return { light: lightTheme, dark: darkTheme }
}

export function applyThemeToDocument(theme: GeneratedTheme, isDark: boolean = false) {
  const root = document.documentElement
  
  // Apply the current theme (light or dark) to CSS variables
  const currentTheme = isDark ? theme.dark : theme.light
  Object.entries(currentTheme).forEach(([key, value]) => {
    root.style.setProperty(`--${key}`, value)
  })
  
  // Also create CSS rules for proper .dark class switching
  const lightCSS = Object.entries(theme.light)
    .map(([key, value]) => `  --${key}: ${value};`)
    .join('\n')
  
  const darkCSS = Object.entries(theme.dark)
    .map(([key, value]) => `  --${key}: ${value};`)
    .join('\n')
  
  // Remove existing dynamic theme styles
  const existingStyle = document.getElementById('dynamic-theme-styles')
  if (existingStyle) {
    existingStyle.remove()
  }
  
  // Add new theme styles
  const style = document.createElement('style')
  style.id = 'dynamic-theme-styles'
  style.textContent = `
:root {
${lightCSS}
}

.dark {
${darkCSS}
}

/* Ensure smooth transitions */
* {
  transition: background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease !important;
}
`
  document.head.appendChild(style)
}

// Utility to validate hex colors
export function isValidHexColor(color: string): boolean {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)
}

// Utility to get contrasting text color
export function getContrastingColor(backgroundColor: string): string {
  const color = colord(backgroundColor)
  return color.isLight() ? '#000000' : '#ffffff'
}

// Generate CSS custom properties string for server-side rendering
export function generateThemeCSS(theme: GeneratedTheme): string {
  const lightVars = Object.entries(theme.light)
    .map(([key, value]) => `  --${key}: ${value};`)
    .join('\n')
  
  const darkVars = Object.entries(theme.dark)
    .map(([key, value]) => `  --${key}: ${value};`)
    .join('\n')
  
  return `:root {\n${lightVars}\n}\n\n.dark {\n${darkVars}\n}`
}