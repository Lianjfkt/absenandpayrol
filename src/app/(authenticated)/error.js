'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'

export default function ErrorBoundary({ error, reset }) {
  useEffect(() => {
    console.error('Authenticated Route Error:', error)
  }, [error])

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        textAlign: 'center',
        padding: '2rem 1rem',
      }}
    >
      <div
        style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: 'var(--danger-bg, #fee2e2)',
          color: 'var(--danger, #dc2626)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.75rem',
          marginBottom: '1.25rem',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        ⚠️
      </div>

      <h2
        style={{
          fontSize: '1.35rem',
          fontWeight: 800,
          color: 'var(--ink)',
          marginBottom: '0.5rem',
          letterSpacing: '-0.02em',
        }}
      >
        Terjadi Kendala Memuat Data
      </h2>

      <p
        style={{
          fontSize: '0.9rem',
          color: 'var(--ink-muted)',
          maxWidth: '420px',
          marginBottom: '1.75rem',
          lineHeight: 1.5,
        }}
      >
        {error?.message || 'Koneksi ke database terputus atau sesi telah kedaluwarsa. Silakan muat ulang atau kembali ke beranda.'}
      </p>

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <Button variant="primary" onClick={() => reset()}>
          🔄 Coba Lagi
        </Button>
        <Link href="/dashboard" style={{ textDecoration: 'none' }}>
          <Button variant="outline">
            🏠 Kembali ke Dashboard
          </Button>
        </Link>
      </div>
    </div>
  )
}
