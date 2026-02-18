// MUI type augmentation — matches safeworkplace-web-app/src/app/theme/widgets/ThemeWrapper.tsx
// Last synced: 2026-02-17
// Without this file, TypeScript reports errors on every custom palette/theme access.
import { CSSProperties } from 'react'

type WelcomeColors = {
  background: CSSProperties['color']
  border: CSSProperties['color']
  brand: CSSProperties['color']
  gradient: CSSProperties['color']
  text: CSSProperties['color']
  buttonText: CSSProperties['color']
}

declare module '@material-ui/core/styles/createTheme' {
  interface Theme {
    name: string
    drawerWidth: number
    drawerWidthCollapsed: number
    headerHeight: number
    welcome: WelcomeColors
  }
  interface ThemeOptions {
    name: string
    drawerWidth: number
    drawerWidthCollapsed: number
    headerHeight: number
    welcome: WelcomeColors
  }
}

declare module '@material-ui/core/styles/createPalette' {
  interface Palette {
    brand: Palette['primary']
    gray: Palette['primary']
    neutral: Palette['primary']
    button: Palette['primary']
    buttonText: Palette['primary']
  }
  interface PaletteOptions {
    brand: PaletteOptions['primary']
    gray: PaletteOptions['primary']
    neutral: PaletteOptions['primary']
    button: PaletteOptions['primary']
    buttonText: PaletteOptions['primary']
  }
}
