import React from 'react'

export function Input({
  label,
  error,
  type = 'text',
  id,
  className = '',
  containerStyle = {},
  ...props
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', width: '100%', ...containerStyle }}>
      {label && (
        <label
          htmlFor={id}
          style={{
            fontSize: '0.875rem',
            fontWeight: 500,
            color: 'var(--text-muted)',
          }}
        >
          {label}
        </label>
      )}
      <input
        type={type}
        id={id}
        style={{
          width: '100%',
          padding: '0.65rem 0.9rem',
          borderRadius: 'var(--radius-md)',
          background: 'var(--bg-main)',
          border: error ? '1px solid var(--danger)' : '1px solid var(--border)',
          color: 'var(--text-main)',
          fontSize: '0.95rem',
          outline: 'none',
          transition: 'border-color 0.2s ease',
        }}
        className={className}
        {...props}
      />
      {error && (
        <span style={{ fontSize: '0.8rem', color: 'var(--danger)' }}>
          {error}
        </span>
      )}
    </div>
  )
}
