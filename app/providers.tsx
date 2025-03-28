'use client'
import { QueryClientProvider } from '@tanstack/react-query'
import { getQueryClient } from '@/app/get-query-client'
import { ThemeProvider } from 'next-themes'
import type * as React from 'react'

export default function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient()

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
        themes={['dark', 'light', 'pink', 'green', 'blue', 'dark-blue', 'monochrome', 'dark-brown', 'rainbow', 'dark-rainbow' ]}
      >
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  )
}
