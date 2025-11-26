import type { Metadata } from 'next'
import './globals.css'
import { AppStateProvider } from '@/lib/stateContext'
import ClientLayout from '@/components/ClientLayout'

export const metadata: Metadata = {
  title: 'Family Task Tracker',
  description: 'Домашний трекер задач для семьи',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <body>
        <AppStateProvider>
          <ClientLayout>
            {children}
          </ClientLayout>
        </AppStateProvider>
      </body>
    </html>
  )
}

