export { ThemeWrapper } from './ThemeProvider'
export { ThemeWrapper as ThemeProvider } from './ThemeProvider'
export * from './helpers'

// Re-export useThemeMode (Recoil-based in production, hardcoded here)
export const useThemeMode = () => ({
  themeMode: 'light' as const,
  setThemeMode: (() => {}) as (mode: 'light' | 'dark') => void,
  isDarkMode: false,
  toggleTheme: () => {},
})
