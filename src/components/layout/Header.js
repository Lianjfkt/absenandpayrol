'use client'

import { logoutAction } from '@/actions/auth'
import { Button } from '@/components/ui/Button'

export function Header({ user, profile }) {
  const initial = profile?.nama ? profile.nama.charAt(0).toUpperCase() : 'U'

  return (
    <header
      style={{
        height: 'var(--header-height)',
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 1.5rem',
        position: 'sticky',
        top: 0,
        zIndex: 40,
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{
          width: '38px',
          height: '38px',
          borderRadius: '50%',
          background: 'var(--accent-soft)',
          color: 'var(--accent)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          fontSize: '1rem',
          border: '1.5px solid var(--accent)'
        }}>
          {initial}
        </div>
        <div>
          <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--ink)', margin: 0 }}>
            {profile?.nama || 'Pengguna'}
          </h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', textTransform: 'capitalize', display: 'block' }}>
            {profile?.role === 'owner' ? 'Owner Kedai' : 'Karyawan Kedai'}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <form action={logoutAction}>
          <Button type="submit" variant="secondary" size="sm" style={{ borderRadius: 'var(--radius-pill)', padding: '0.4rem 1rem' }}>
            Keluar
          </Button>
        </form>
      </div>
    </header>
  )
}
