'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { OWNER_MENU, KARYAWAN_MENU, ROLES } from '@/lib/constants'

export function Sidebar({ userRole }) {
  const pathname = usePathname()
  const menu = userRole === ROLES.OWNER ? OWNER_MENU : KARYAWAN_MENU

  const getIcon = (icon) => {
    switch (icon) {
      case 'dashboard':
        return '📊'
      case 'people':
        return '👥'
      case 'checklist':
        return '📅'
      case 'payments':
        return '💰'
      case 'assessment':
        return '📈'
      case 'settings':
        return '⚙️'
      case 'receipt':
        return '🧾'
      default:
        return '📌'
    }
  }

  return (
    <aside
      style={{
        width: 'var(--sidebar-width)',
        background: 'var(--bg-surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        position: 'sticky',
        top: 0,
      }}
      className="desktop-only"
    >
      <div
        style={{
          padding: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--primary-gradient)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.2rem',
          }}
        >
          🍗
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Kedai Absensi</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {userRole === ROLES.OWNER ? 'Portal Owner' : 'Portal Karyawan'}
          </div>
        </div>
      </div>

      <nav style={{ padding: '1rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', flex: 1 }}>
        {menu.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.65rem 0.9rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.9rem',
                fontWeight: isActive ? 600 : 500,
                color: isActive ? '#ffffff' : 'var(--text-muted)',
                background: isActive ? 'var(--primary)' : 'transparent',
                transition: 'all 0.2s ease',
              }}
            >
              <span>{getIcon(item.icon)}</span>
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
