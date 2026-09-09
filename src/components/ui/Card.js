import React from 'react'

export function Card({
  children,
  className = '',
  variant = 'default', // default, muted, accent-soft, interactive
  style = {},
  onClick,
  ...props
}) {
  const baseStyle = {
    borderRadius: 'var(--radius-card)',
    padding: '20px',
    background: 'var(--bg-surface)',
    boxShadow: 'var(--shadow-card)',
    border: '1px solid var(--border)',
    transition: 'transform 0.18s ease, box-shadow 0.18s ease',
  }

  const variants = {
    default: {},
    muted: {
      background: 'var(--bg-surface-muted)',
      boxShadow: 'none',
    },
    'accent-soft': {
      background: 'var(--accent-soft)',
      border: '1px solid rgba(249,115,22,0.15)',
      boxShadow: 'none',
    },
    elevated: {
      boxShadow: 'var(--shadow-soft)',
    },
    // Legacy glass → now a white semi-transparent card
    glass: {
      background: 'var(--bg-glass)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      boxShadow: 'var(--shadow-card)',
    },
    interactive: {
      cursor: 'pointer',
    },
  }

  return (
    <div
      onClick={onClick}
      style={{
        ...baseStyle,
        ...variants[variant],
        ...(onClick ? { cursor: 'pointer' } : {}),
        ...style,
      }}
      className={className}
      {...props}
    >
      {children}
    </div>
  )
}
