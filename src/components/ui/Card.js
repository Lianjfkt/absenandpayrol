import React from 'react'

export function Card({
  children,
  className = '',
  variant = 'default', // default, elevated, glass, interactive
  style = {},
  onClick,
  ...props
}) {
  const baseStyle = {
    borderRadius: 'var(--radius-lg)',
    padding: '1.25rem',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    border: '1px solid var(--border)',
    background: 'var(--bg-surface)',
  }

  const variants = {
    default: {},
    elevated: {
      background: 'var(--bg-surface-elevated)',
      boxShadow: 'var(--shadow-md)',
    },
    glass: {
      background: 'var(--bg-glass)',
      backdropFilter: 'blur(12px)',
      border: '1px solid var(--border-light)',
    },
    interactive: {
      cursor: 'pointer',
      ':hover': {
        transform: 'translateY(-2px)',
      }
    }
  }

  return (
    <div
      onClick={onClick}
      style={{
        ...baseStyle,
        ...variants[variant],
        ...style,
      }}
      className={className}
      {...props}
    >
      {children}
    </div>
  )
}
