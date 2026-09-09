'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { OWNER_MENU, KARYAWAN_MENU, ROLES } from '@/lib/constants'

export function MobileNav({ userRole }) {
  const pathname = usePathname()
  const menu = userRole === ROLES.OWNER ? OWNER_MENU : KARYAWAN_MENU

  const getIconSvg = (icon) => {
    switch (icon) {
      case 'dashboard':
        return <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="9" rx="2"/><rect x="14" y="3" width="7" height="5" rx="2"/><rect x="14" y="12" width="7" height="9" rx="2"/><rect x="3" y="16" width="7" height="5" rx="2"/></svg>
      case 'checklist':
      case 'absensi':
        return <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
      case 'event_busy':
      case 'izin':
        return <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18M10 14l4 4M14 14l-4 4"/></svg>
      case 'account_balance_wallet':
      case 'kasbon':
        return <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="17" cy="12" r="1.5"/></svg>
      case 'payments':
      case 'receipt':
      case 'gaji':
        return <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
      case 'people':
        return <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
      case 'assessment':
        return <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>
      case 'settings':
        return <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
      default:
        return <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/></svg>
    }
  }

  // Find center action index (usually absensi for karyawan, or rekap for owner)
  const middleIndex = Math.floor(menu.length / 2)

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '1rem',
        left: '1rem',
        right: '1rem',
        zIndex: 100,
        display: 'flex',
        justifyContent: 'center',
        pointerEvents: 'none',
      }}
      className="mobile-only"
    >
      <nav
        style={{
          pointerEvents: 'auto',
          background: '#ffffff',
          borderRadius: 'var(--radius-pill)',
          boxShadow: 'var(--shadow-nav)',
          border: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          padding: '0.4rem 0.6rem',
          maxWidth: '440px',
          width: '100%',
        }}
      >
        {menu.map((item, index) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(`${item.href}/`))
          const isCenter = index === middleIndex

          if (isCenter) {
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  background: 'var(--accent)',
                  color: '#ffffff',
                  boxShadow: '0 8px 20px rgba(249, 115, 22, 0.4)',
                  transform: 'translateY(-12px)',
                  textDecoration: 'none',
                  transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
                title={item.label}
              >
                {getIconSvg(item.icon)}
              </Link>
            )
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.15rem',
                color: isActive ? 'var(--accent)' : 'var(--ink-muted)',
                fontSize: '0.7rem',
                fontWeight: isActive ? 700 : 500,
                textDecoration: 'none',
                padding: '0.4rem 0.6rem',
                transition: 'color 0.2s ease',
              }}
            >
              <span>{getIconSvg(item.icon)}</span>
              <span style={{ whiteSpace: 'nowrap' }}>{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
