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
  ...props
}) {
  const baseStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 600,
    borderRadius: 'var(--radius-md)',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s ease',
    border: 'none',
    outline: 'none',
    opacity: disabled ? 0.6 : 1,
    gap: '0.5rem',
  }

  const sizes = {
    sm: { padding: '0.4rem 0.8rem', fontSize: '0.85rem' },
    md: { padding: '0.65rem 1.25rem', fontSize: '0.95rem' },
    lg: { padding: '0.85rem 1.75rem', fontSize: '1.05rem' },
  }

  const variants = {
    primary: {
      background: 'var(--primary-gradient)',
      color: '#ffffff',
      boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
    },
    secondary: {
      background: 'var(--bg-surface-elevated)',
      color: 'var(--text-main)',
      border: '1px solid var(--border)',
    },
    danger: {
      background: 'var(--danger)',
      color: '#ffffff',
      boxShadow: '0 4px 12px rgba(239, 68, 68, 0.25)',
    },
    outline: {
      background: 'transparent',
      color: 'var(--text-main)',
      border: '1px solid var(--border)',
    },
    ghost: {
      background: 'transparent',
      color: 'var(--text-muted)',
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
      }}
      className={className}
      {...props}
    >
      {loading ? (
        <span>Memuat...</span>
      ) : (
        children
      )}
    </button>
  )
}
