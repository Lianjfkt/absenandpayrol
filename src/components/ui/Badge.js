import React from 'react'

export function Badge({
  children,
  variant = 'default', // success, warning, danger, info, accent, default
  size = 'md',
  style = {},
  className = ''
}) {
  const baseStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.35rem',
    borderRadius: 'var(--radius-pill)',
    fontWeight: 600,
    letterSpacing: '-0.01em',
  }

  const sizes = {
    sm: { padding: '0.2rem 0.65rem', fontSize: '0.75rem' },
    md: { padding: '0.35rem 0.85rem', fontSize: '0.825rem' },
    lg: { padding: '0.45rem 1rem', fontSize: '0.9rem' },
  }

  const variants = {
    default: {
      background: 'var(--surface-muted)',
      color: 'var(--ink-muted)',
    },
    accent: {
      background: 'var(--accent-soft)',
      color: 'var(--accent)',
    },
    success: {
      background: '#DCFCE7',
      color: '#15803D',
    },
    warning: {
      background: 'var(--accent-soft)',
      color: 'var(--accent)',
    },
    danger: {
      background: '#FEE2E2',
      color: '#B91C1C',
    },
    info: {
      background: '#E0F2FE',
      color: '#0369A1',
    },
  }

  return (
    <span
      className={className}
      style={{
        ...baseStyle,
        ...sizes[size],
        ...variants[variant] || variants.default,
        ...style,
      }}
    >
      {children}
    </span>
  )
}
