import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Cinema — Agency Dashboard',
  description: 'Internal operations dashboard for Cinema landing page agency',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full overflow-hidden bg-bg text-fg">{children}</body>
    </html>
  )
}
