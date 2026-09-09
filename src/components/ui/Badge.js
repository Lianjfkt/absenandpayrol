import React from 'react'

export function Badge({
  children,
  variant = 'default', // success, warning, danger, info, default
  size = 'md',
  style = {}
}) {
  const baseStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.35rem',
    borderRadius: 'var(--radius-full)',
    fontWeight: 600,
    textTransform: 'capitalize',
  }

  const sizes = {
    sm: { padding: '0.2rem 0.6rem', fontSize: '0.75rem' },
    md: { padding: '0.3rem 0.75rem', fontSize: '0.85rem' },
  }

  const variants = {
    default: {
      background: 'var(--bg-surface-elevated)',
      color: 'var(--text-muted)',
    },
    success: {
      background: 'var(--success-bg)',
      color: 'var(--success)',
      border: '1px solid rgba(16, 185, 129, 0.3)',
    },
    warning: {
      background: 'var(--warning-bg)',
      color: 'var(--warning)',
      border: '1px solid rgba(245, 158, 11, 0.3)',
    },
    danger: {
      background: 'var(--danger-bg)',
      color: 'var(--danger)',
      border: '1px solid rgba(239, 68, 68, 0.3)',
    },
    info: {
      background: 'var(--info-bg)',
      color: 'var(--info)',
      border: '1px solid rgba(59, 130, 246, 0.3)',
    },
  }

  return (
    <span
      style={{
        ...baseStyle,
        ...sizes[size],
        ...variants[variant],
        ...style,
      }}
    >
      {children}
    </span>
  )
}
