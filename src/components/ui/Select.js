import React from 'react'

export function Select({
  label,
  error,
  id,
  options = [],
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
      <select
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
        }}
        className={className}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <span style={{ fontSize: '0.8rem', color: 'var(--danger)' }}>
          {error}
        </span>
      )}
    </div>
  )
}
