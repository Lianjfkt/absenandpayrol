'use client'

import { logoutAction } from '@/actions/auth'
import { Button } from '@/components/ui/Button'

export function Header({ user, profile }) {
  const initial = profile?.nama ? profile.nama.charAt(0).toUpperCase() : 'U'

  return (
    <header
      style={{
        height: 'var(--header-height)',
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 var(--page-px)',
        position: 'sticky',
        top: 0,
        zIndex: 40,
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0, flex: 1, marginRight: '0.5rem' }}>
        <div style={{
          width: '36px',
          height: '36px',
          minWidth: '36px',
          borderRadius: '50%',
          background: 'var(--accent-soft)',
          color: 'var(--accent)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          fontSize: '0.95rem',
          border: '1.5px solid var(--accent)'
        }}>
          {initial}
        </div>
        <div style={{ minWidth: 0 }}>
          <h2 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--ink)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {profile?.nama || 'Pengguna'}
          </h2>
          <span style={{ fontSize: '0.72rem', color: 'var(--ink-muted)', textTransform: 'capitalize', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {profile?.role === 'owner' ? 'Owner Kedai' : 'Karyawan Kedai'}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
        <form action={logoutAction}>
          <Button type="submit" variant="secondary" size="sm" style={{ borderRadius: 'var(--radius-pill)', padding: '0.35rem 0.85rem', fontSize: '0.8rem' }}>
            Keluar
          </Button>
        </form>
      </div>
    </header>
  )
}
