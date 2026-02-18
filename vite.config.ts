import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

const MAIN_APP = path.resolve(__dirname, '../safeworkplace-web-app')

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Real components from the main app
      '@UI': path.join(MAIN_APP, 'src/UI'),

      // Local shims (replace main app modules that have heavy dependencies)
      '@app/theme': path.resolve(__dirname, 'src/shims/theme'),
      '@app/routes': path.resolve(__dirname, 'src/app/routes'),
      '@app/format': path.resolve(__dirname, 'src/shims/format'),
      '@lingui/macro': path.resolve(__dirname, 'src/shims/lingui'),
      '@lingui/react': path.resolve(__dirname, 'src/shims/lingui'),
      'next/link': path.resolve(__dirname, 'src/shims/next-link'),
      'next/head': path.resolve(__dirname, 'src/shims/next-head'),
      '@entities/user': path.resolve(__dirname, 'src/types/user'),
      '@entities/translation': path.resolve(__dirname, 'src/shims/translation'),

      // Shims for transitive imports from @UI barrel export components
      // These allow the barrel to load without errors even for components the module doesn't use
      '@public/logos/logo-swp.svg': path.resolve(__dirname, 'src/shims/public-logo'),
      '@report-configs': path.resolve(__dirname, 'src/shims/report-configs'),
      '@entities/report': path.resolve(__dirname, 'src/shims/entities-report'),
      '@widgets': path.resolve(__dirname, 'src/shims/widgets'),
      'nextjs-progressbar': path.resolve(__dirname, 'src/shims/nextjs-progressbar'),
    },
    // Prevents duplicate package resolution if safeworkplace-web-app
    // has node_modules installed. Without this, Vite may resolve react, MUI, etc.
    // from the web app's node_modules for aliased UI component files, causing
    // "Invalid hook call" errors and broken theme/styled-components contexts.
    dedupe: [
      'react',
      'react-dom',
      '@material-ui/core',
      '@material-ui/core/styles',
      'styled-components',
    ],
  },
  server: {
    port: 4000,
    proxy: {
      '/api': 'http://localhost:4001',
    },
  },
})
