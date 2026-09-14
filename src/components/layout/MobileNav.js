'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { OWNER_MENU, KARYAWAN_MENU, ROLES } from '@/lib/constants'

export function MobileNav({ userRole }) {
  const pathname = usePathname()
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const isOwner = userRole === ROLES.OWNER

  const getIconSvg = (icon) => {
    switch (icon) {
      case 'dashboard':
        return <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="9" rx="2"/><rect x="14" y="3" width="7" height="5" rx="2"/><rect x="14" y="12" width="7" height="9" rx="2"/><rect x="3" y="16" width="7" height="5" rx="2"/></svg>
      case 'checklist':
      case 'absensi':
        return <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
      case 'event_busy':
      case 'izin':
        return <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18M10 14l4 4M14 14l-4 4"/></svg>
      case 'account_balance_wallet':
      case 'kasbon':
        return <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="17" cy="12" r="1.5"/></svg>
      case 'payments':
      case 'receipt':
      case 'gaji':
      case 'payroll':
        return <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
      case 'people':
      case 'karyawan':
        return <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
      case 'assessment':
      case 'rekap':
        return <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>
      case 'settings':
      case 'pengaturan':
        return <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
      case 'menu':
        return <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
      default:
        return <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/></svg>
    }
  }

  // Items to display in the main floating bottom bar
  const mainBarItems = isOwner
    ? [
        { label: 'Home', href: '/dashboard', icon: 'dashboard' },
        { label: 'Staf', href: '/karyawan', icon: 'people' },
        { label: 'Absensi', href: '/absensi', icon: 'checklist', isCenter: true },
        { label: 'Payroll', href: '/payroll', icon: 'payments' },
        { label: 'Menu', href: '#more', icon: 'menu', isMore: true },
      ]
    : [
        { label: 'Home', href: '/dashboard', icon: 'dashboard' },
        { label: 'Absensi', href: '/absensi', icon: 'checklist', isCenter: true },
        { label: 'Izin', href: '/izin', icon: 'event_busy' },
        { label: 'Slip Gaji', href: '/slip-gaji', icon: 'receipt' },
      ]

  return (
    <>
      {/* Bottom Nav Bar */}
      <div
        style={{
          position: 'fixed',
          bottom: '0.75rem',
          left: '0.75rem',
          right: '0.75rem',
          zIndex: 90,
          display: 'flex',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}
        className="mobile-only"
      >
        <nav
          style={{
            pointerEvents: 'auto',
            background: 'var(--bg-surface)',
            borderRadius: 'var(--radius-pill)',
            boxShadow: 'var(--shadow-nav)',
            border: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.35rem 0.5rem',
            maxWidth: '420px',
            width: '100%',
          }}
        >
          {mainBarItems.map((item) => {
            const isCenter = item.isCenter
            const isMore = item.isMore
            const isMoreActive = isOwner && ['/izin', '/kasbon', '/rekap', '/pengaturan'].some(path => pathname.startsWith(path))
            const isActive = isMore
              ? (showMoreMenu || isMoreActive)
              : pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(`${item.href}/`))

            if (isCenter) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setShowMoreMenu(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: 'var(--accent)',
                    color: '#ffffff',
                    boxShadow: '0 6px 18px rgba(249, 115, 22, 0.45)',
                    transform: 'translateY(-10px)',
                    textDecoration: 'none',
                    transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    flexShrink: 0,
                  }}
                  title={item.label}
                >
                  {getIconSvg(item.icon)}
                </Link>
              )
            }

            if (isMore) {
              return (
                <button
                  key="more-button"
                  type="button"
                  onClick={() => setShowMoreMenu(!showMoreMenu)}
                  style={{
                    background: 'none',
                    border: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.15rem',
                    color: isActive ? 'var(--accent)' : 'var(--ink-muted)',
                    fontSize: '0.68rem',
                    fontWeight: isActive ? 700 : 500,
                    padding: '0.35rem 0.5rem',
                    cursor: 'pointer',
                    flex: 1,
                  }}
                >
                  <span>{getIconSvg(item.icon)}</span>
                  <span style={{ whiteSpace: 'nowrap' }}>{item.label}</span>
                </button>
              )
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setShowMoreMenu(false)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.15rem',
                  color: isActive ? 'var(--accent)' : 'var(--ink-muted)',
                  fontSize: '0.68rem',
                  fontWeight: isActive ? 700 : 500,
                  textDecoration: 'none',
                  padding: '0.35rem 0.5rem',
                  transition: 'color 0.2s ease',
                  flex: 1,
                }}
              >
                <span>{getIconSvg(item.icon)}</span>
                <span style={{ whiteSpace: 'nowrap' }}>{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Slide-Up Modal Drawer for Owner More Menu */}
      {showMoreMenu && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(23, 23, 23, 0.45)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            zIndex: 95,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            padding: '1rem',
          }}
          className="mobile-only"
          onClick={() => setShowMoreMenu(false)}
        >
          <div
            style={{
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-card)',
              padding: '1.25rem',
              boxShadow: 'var(--shadow-nav)',
              border: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              marginBottom: 'calc(var(--bottom-nav-height) + 0.5rem)',
              maxHeight: '70vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
              <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--ink)' }}>Menu Manajemen Kedai</div>
              <button
                type="button"
                onClick={() => setShowMoreMenu(false)}
                style={{
                  background: 'var(--bg-surface-muted)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '28px',
                  height: '28px',
                  fontWeight: 700,
                  color: 'var(--ink)',
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.65rem' }}>
              {OWNER_MENU.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(`${item.href}/`))
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setShowMoreMenu(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.65rem',
                      padding: '0.75rem 0.85rem',
                      borderRadius: 'var(--radius-md)',
                      background: isActive ? 'var(--accent-soft)' : 'var(--bg-surface-muted)',
                      color: isActive ? 'var(--accent)' : 'var(--ink)',
                      fontWeight: isActive ? 700 : 600,
                      fontSize: '0.85rem',
                      textDecoration: 'none',
                      border: isActive ? '1px solid var(--accent)' : '1px solid var(--border)',
                    }}
                  >
                    <span>{getIconSvg(item.icon)}</span>
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
