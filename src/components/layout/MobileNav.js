'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { OWNER_MENU, KARYAWAN_MENU, ROLES } from '@/lib/constants'

export function MobileNav({ userRole }) {
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
      case 'event_busy':
        return '🏥'
      case 'account_balance_wallet':
        return '💳'
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
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 'var(--bottom-nav-height)',
        background: 'var(--bg-glass)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        padding: '0 0.5rem',
        zIndex: 50,
      }}
      className="mobile-only"
    >
      {menu.map((item) => {
        const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(`${item.href}/`))
        return (
          <Link
            key={item.href}
            href={item.href}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.2rem',
              color: isActive ? 'var(--primary)' : 'var(--text-muted)',
              fontSize: '0.75rem',
              fontWeight: isActive ? 600 : 500,
              textDecoration: 'none',
              padding: '0.4rem',
              flex: 1,
            }}
          >
            <span style={{ fontSize: '1.2rem' }}>{getIcon(item.icon)}</span>
            <span style={{ whiteSpace: 'nowrap' }}>{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
