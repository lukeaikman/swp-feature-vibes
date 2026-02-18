import React from 'react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeWrapper } from '@app/theme'
import { AppRouter } from './app/router'
import { Layout } from './app/shell/Layout'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: Infinity, retry: false },
  },
})

export const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeWrapper>
      <BrowserRouter>
        <Layout>
          <AppRouter />
        </Layout>
      </BrowserRouter>
    </ThemeWrapper>
  </QueryClientProvider>
)
