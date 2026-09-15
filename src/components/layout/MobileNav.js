'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { OWNER_MENU, ROLES } from '@/lib/constants'

export function MobileNav({ userRole }) {
  const pathname = usePathname()
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const isOwner = userRole === ROLES.OWNER

  const getIconSvg = (icon) => {
    switch (icon) {
      case 'dashboard':
        return <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2"><rect x="3" y="3" width="7" height="9" rx="2"/><rect x="14" y="3" width="7" height="5" rx="2"/><rect x="14" y="12" width="7" height="9" rx="2"/><rect x="3" y="16" width="7" height="5" rx="2"/></svg>
      case 'checklist':
      case 'absensi':
        return <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.4"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
      case 'account_balance_wallet':
      case 'kasbon':
        return <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="17" cy="12" r="1.5"/></svg>
      case 'payments':
      case 'receipt':
      case 'gaji':
      case 'payroll':
      case 'slip-gaji':
        return <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2"><rect x="2" y="4" width="20" height="16" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
      case 'people':
      case 'karyawan':
        return <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
      case 'assessment':
      case 'rekap':
        return <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>
      case 'settings':
      case 'pengaturan':
        return <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
      case 'menu':
        return <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
      default:
        return <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2"><circle cx="12" cy="12" r="10"/></svg>
    }
  }

  // Items to display in the floating bottom navigation bar
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
        { label: 'Slip Gaji', href: '/slip-gaji', icon: 'receipt' },
      ]

  return (
    <>
      {/* Bottom Nav Bar */}
      <div
        style={{
          position: 'fixed',
          bottom: '0.85rem',
          left: '0.85rem',
          right: '0.85rem',
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
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderRadius: 'var(--radius-pill)',
            boxShadow: '0 12px 36px rgba(23, 23, 23, 0.12), 0 2px 6px rgba(0, 0, 0, 0.04)',
            border: '1.5px solid rgba(232, 228, 219, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-around',
            padding: '0.35rem 0.6rem',
            maxWidth: isOwner ? '440px' : '340px',
            width: '100%',
          }}
        >
          {mainBarItems.map((item) => {
            const isCenter = item.isCenter
            const isMore = item.isMore
            const isMoreActive = isOwner && ['/kasbon', '/rekap', '/pengaturan'].some(path => pathname.startsWith(path))
            const isActive = isMore
              ? (showMoreMenu || isMoreActive)
              : pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(`${item.href}/`))

            if (isCenter) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setShowMoreMenu(false)}
                  className="pulse-center-btn"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '52px',
                    height: '52px',
                    borderRadius: '50%',
                    background: 'var(--accent-gradient)',
                    color: '#ffffff',
                    border: '3px solid #ffffff',
                    boxShadow: isActive
                      ? '0 8px 24px rgba(249, 115, 22, 0.6)'
                      : '0 6px 18px rgba(249, 115, 22, 0.45)',
                    transform: 'translateY(-10px)',
                    textDecoration: 'none',
                    transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    flexShrink: 0,
                  }}
                  title={item.label}
                >
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {getIconSvg(item.icon)}
                  </span>
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
                    position: 'relative',
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
                    transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    transform: isActive ? 'translateY(-2px)' : 'translateY(0)',
                  }}
                >
                  {/* Active highlight background pill animation */}
                  {isActive && (
                    <span
                      className="nav-pill-active"
                      style={{
                        position: 'absolute',
                        inset: '2px 4px',
                        background: 'var(--accent-soft)',
                        borderRadius: 'var(--radius-pill)',
                        zIndex: -1,
                        opacity: 0.75,
                      }}
                    />
                  )}

                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      transition: 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
                      transform: isActive ? 'scale(1.14)' : 'scale(1)',
                    }}
                  >
                    {getIconSvg(item.icon)}
                  </span>

                  <span
                    style={{
                      whiteSpace: 'nowrap',
                      transition: 'color 0.2s ease, font-weight 0.2s ease',
                    }}
                  >
                    {item.label}
                  </span>

                  {/* Micro active dot animation */}
                  {isActive && (
                    <span
                      className="nav-dot-active"
                      style={{
                        width: '4px',
                        height: '4px',
                        borderRadius: '50%',
                        background: 'var(--accent)',
                        marginTop: '1px',
                      }}
                    />
                  )}
                </button>
              )
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setShowMoreMenu(false)}
                style={{
                  position: 'relative',
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
                  flex: 1,
                  transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  transform: isActive ? 'translateY(-2px)' : 'translateY(0)',
                }}
              >
                {/* Active highlight background pill animation */}
                {isActive && (
                  <span
                    className="nav-pill-active"
                    style={{
                      position: 'absolute',
                      inset: '2px 4px',
                      background: 'var(--accent-soft)',
                      borderRadius: 'var(--radius-pill)',
                      zIndex: -1,
                      opacity: 0.75,
                    }}
                  />
                )}

                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    transition: 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    transform: isActive ? 'scale(1.14)' : 'scale(1)',
                  }}
                >
                  {getIconSvg(item.icon)}
                </span>

                <span
                  style={{
                    whiteSpace: 'nowrap',
                    transition: 'color 0.2s ease, font-weight 0.2s ease',
                  }}
                >
                  {item.label}
                </span>

                {/* Micro active dot animation */}
                {isActive && (
                  <span
                    className="nav-dot-active"
                    style={{
                      width: '4px',
                      height: '4px',
                      borderRadius: '50%',
                      background: 'var(--accent)',
                      marginTop: '1px',
                    }}
                  />
                )}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Slide-Up Modal Drawer for Owner More Menu */}
      {showMoreMenu && (
        <div
          className="mobile-only modal-fade-in"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(23, 23, 23, 0.45)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            zIndex: 95,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            padding: '1rem',
          }}
          onClick={() => setShowMoreMenu(false)}
        >
          <div
            className="sheet-slide-up"
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
              <div>
                <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--ink)' }}>Menu Manajemen Kedai</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)' }}>Pilih modul operasional kedai</div>
              </div>
              <button
                type="button"
                onClick={() => setShowMoreMenu(false)}
                style={{
                  background: 'var(--bg-surface-muted)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  fontWeight: 700,
                  color: 'var(--ink)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
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
                      padding: '0.85rem 0.95rem',
                      borderRadius: 'var(--radius-md)',
                      background: isActive ? 'var(--accent-soft)' : 'var(--bg-surface-muted)',
                      color: isActive ? 'var(--accent)' : 'var(--ink)',
                      fontWeight: isActive ? 700 : 600,
                      fontSize: '0.85rem',
                      textDecoration: 'none',
                      border: isActive ? '1.5px solid var(--accent)' : '1px solid var(--border)',
                      transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                      transform: isActive ? 'scale(1.02)' : 'scale(1)',
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center' }}>{getIconSvg(item.icon)}</span>
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
