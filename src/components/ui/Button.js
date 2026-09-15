'use client'

import React from 'react'
import { useFormStatus } from 'react-dom'

export function Button({
  children,
  variant = 'primary', // primary, secondary, danger, outline, ghost, success
  size = 'md',        // sm, md, lg
  className = '',
  disabled = false,
  loading = false,
  loadingText = 'Memproses...',
  type = 'button',
  onClick,
  style = {},
  ...props
}) {
  const formStatus = useFormStatus()
  const isPending = type === 'submit' ? formStatus.pending : false
  const isBusy = loading || isPending

  const baseStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 600,
    borderRadius: 'var(--radius-pill)',
    cursor: disabled || isBusy ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
    border: 'none',
    outline: 'none',
    opacity: disabled || isBusy ? 0.75 : 1,
    gap: '0.5rem',
    whiteSpace: 'nowrap',
    position: 'relative',
    userSelect: 'none',
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
    success: {
      background: '#16A34A',
      color: '#ffffff',
      boxShadow: '0 4px 12px rgba(22, 163, 74, 0.25)',
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
      disabled={disabled || isBusy}
      onClick={onClick}
      style={{
        ...baseStyles,
        ...sizes[size],
        ...variants[variant],
        ...style,
      }}
      className={`${className} ${isBusy ? 'btn-shimmer' : 'btn-active-scale'}`}
      {...props}
    >
      {isBusy ? (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.55rem' }}>
          <span
            style={{
              width: size === 'sm' ? '12px' : '16px',
              height: size === 'sm' ? '12px' : '16px',
              border: '2px solid currentColor',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              display: 'inline-block',
              animation: 'spin 0.65s linear infinite',
              flexShrink: 0,
            }}
          />
          <span style={{ letterSpacing: '-0.01em', fontWeight: 600 }}>{loadingText}</span>
        </span>
      ) : (
        children
      )}
    </button>
  )
}
