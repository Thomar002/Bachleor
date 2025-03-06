import type { Metadata } from 'next'
import './globals.css'
import MainLayout from '@/components/layouts/main-layout'

export const metadata: Metadata = {
  title: 'Exam Creator',
  description: 'Create and manage exams',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <MainLayout>{children}</MainLayout>
      </body>
    </html>
  )
}
