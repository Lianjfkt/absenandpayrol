import './globals.css'
import { Plus_Jakarta_Sans } from 'next/font/google'
import { Suspense } from 'react'
import { TopProgressBar } from '@/components/ui/TopProgressBar'

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-sans',
})

export const metadata = {
  title: 'Sistem Absensi & Payroll Kedai',
  description: 'Aplikasi Absensi Berbasis GPS & Payroll Karyawan Kedai Taichan & Chicken KA',
  manifest: '/manifest.json',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#F97316',
}

export default function RootLayout({ children }) {
  return (
    <html lang="id" className={plusJakartaSans.className}>
      <head>
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body>
        <Suspense fallback={null}>
          <TopProgressBar />
        </Suspense>
        {children}
      </body>
    </html>
  )
}
