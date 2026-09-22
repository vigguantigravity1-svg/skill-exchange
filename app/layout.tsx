import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Skill Exchange — Trade Skills, Build Together',
  description: 'Connect with verified professionals and exchange skills. No money, just talent. Powered by AI trust verification.',
  keywords: 'skill exchange, freelance, barter skills, talent swap, peer learning',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#090514" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  )
}
