import React from 'react'

export function Button({
  children,
  variant = 'primary', // primary, secondary, danger, outline, ghost
  size = 'md',        // sm, md, lg
  className = '',
  disabled = false,
  loading = false,
  type = 'button',
  onClick,
  style = {},
  ...props
}) {
  const baseStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 600,
    borderRadius: 'var(--radius-pill)',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
    border: 'none',
    outline: 'none',
    opacity: disabled ? 0.6 : 1,
    gap: '0.5rem',
    whiteSpace: 'nowrap',
  }

  const sizes = {
    sm: { padding: '0.45rem 1rem', fontSize: '0.85rem' },
    md: { padding: '0.75rem 1.5rem', fontSize: '0.95rem' },
    lg: { padding: '0.95rem 2rem', fontSize: '1.05rem' },
  }

  const variants = {
    primary: {
      background: 'var(--accent)',
      color: '#ffffff',
      boxShadow: '0 6px 16px rgba(249, 115, 22, 0.25)',
    },
    secondary: {
      background: 'var(--surface)',
      color: 'var(--ink)',
      border: '1px solid var(--border)',
      boxShadow: 'var(--shadow-sm)',
    },
    danger: {
      background: '#EF4444',
      color: '#ffffff',
      boxShadow: '0 4px 12px rgba(239, 68, 68, 0.25)',
    },
    outline: {
      background: 'transparent',
      color: 'var(--ink)',
      border: '1.5px solid var(--border)',
    },
    ghost: {
      background: 'transparent',
      color: 'var(--ink-muted)',
    },
  }

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      style={{
        ...baseStyles,
        ...sizes[size],
        ...variants[variant],
        ...style,
      }}
      className={className}
      {...props}
    >
      {loading ? (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{
            width: '14px',
            height: '14px',
            border: '2px solid currentColor',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite'
          }} />
          Memuat...
        </span>
      ) : (
        children
      )}
    </button>
  )
}
