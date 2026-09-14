'use client'

import { useState, useEffect } from 'react'
import { Button } from './Button'

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    // Daftarkan Service Worker
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .catch((err) => console.log('SW registration failed:', err))
    }

    // Cek apakah sudah terinstall / standalone
    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true
    ) {
      setIsStandalone(true)
      return
    }

    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowPrompt(true)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setShowPrompt(false)
    }
    setDeferredPrompt(null)
  }

  if (isStandalone || !showPrompt) return null

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '80px',
        left: '16px',
        right: '16px',
        maxWidth: '420px',
        margin: '0 auto',
        background: 'var(--surface)',
        border: '1.5px solid var(--accent)',
        borderRadius: 'var(--radius-card)',
        padding: '1rem 1.25rem',
        boxShadow: 'var(--shadow-card)',
        zIndex: 90,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.75rem',
        animation: 'fadeIn 0.3s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'var(--accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            fontSize: '1.25rem',
            fontWeight: 800,
          }}
        >
          📱
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--ink)' }}>
            Pasang Aplikasi Kedai
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)' }}>
            Akses instan dari layar utama HP
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
        <Button variant="primary" size="sm" onClick={handleInstall}>
          Pasang
        </Button>
        <button
          type="button"
          onClick={() => setShowPrompt(false)}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--ink-muted)',
            cursor: 'pointer',
            padding: '0.25rem',
            fontSize: '0.9rem',
          }}
        >
          ✕
        </button>
      </div>
    </div>
  )
}
