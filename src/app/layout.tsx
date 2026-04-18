// Path: /src/app/layout.tsx
// Module: Root Layout
// Depends on: next, next/font/google, ./globals.css
// Description: Root layout shared across all app routes.

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Multi-Service Integrator',
  description: 'Centralized credential & service management',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>{children}</body>
    </html>
  )
}
