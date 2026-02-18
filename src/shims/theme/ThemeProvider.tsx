// Hardcoded SWP theme — replaces production ThemeWrapper which uses useGetClient() + useThemeMode()
// Values from: safeworkplace-api/database/config/admin/client.json
// Structure from: safeworkplace-web-app/src/app/theme/widgets/ThemeWrapper.tsx lines 57-140
import React from 'react'
import { createTheme, ThemeProvider, darken, lighten } from '@material-ui/core/styles'
import CssBaseline from '@material-ui/core/CssBaseline'

const theme = createTheme({
  name: 'Safe Workplace',
  drawerWidth: 280,
  drawerWidthCollapsed: 80,
  headerHeight: 240,
  palette: {
    type: 'light',
    brand: {
      main: '#FF9900',
      dark: darken('#FF9900', 0.2),
      light: lighten('#FF9900', 0.5),
    },
    primary: {
      main: '#11233b',
      light: lighten('#11233b', 0.05),
    },
    secondary: {
      main: '#FAFAFA',
    },
    success: {
      main: '#4ECDC4',
    },
    warning: {
      main: '#FFB715',
    },
    error: {
      main: '#C83636',
    },
    info: {
      main: '#0066C0',
    },
    button: {
      main: '#FF9900',
      dark: darken('#FF9900', 0.25),
      light: lighten('#FF9900', 0.25),
    },
    buttonText: {
      main: '#11233b',
    },
    gray: {
      main: '#A9A9A9',
    },
    neutral: {
      main: '#E8E8E8',
    },
  },
  welcome: {
    brand: '#FF9900',
    gradient: 'linear-gradient(180deg, #2b3745 33.6%, #232f3f 33.6%)',
    background: '#11233b',
    text: '#FAFAFA',
    border: '#FFFFFF',
    buttonText: '#11233b',
  },
  shape: { borderRadius: 8 },
  overrides: {
    MuiButton: {
      root: {
        fontFamily: 'Poppins',
        fontWeight: 500,
        textTransform: 'none',
      },
    },
    MuiTooltip: {
      tooltip: {
        fontSize: 12,
      },
    },
    MuiAccordion: {
      root: {
        '&$expanded': {
          marginTop: 0,
        },
      },
    },
  },
  typography: {
    fontFamily: "'DM Sans', sans-serif",
  },
})

export const ThemeWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider theme={theme}>
    <CssBaseline />
    {children}
  </ThemeProvider>
)
