export default function Loading() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%', opacity: 0.85 }} className="fade-up">
      {/* Header skeleton */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ width: '220px', height: '28px', background: 'var(--border)', borderRadius: 'var(--radius-sm)', animation: 'pulse 1.5s infinite ease-in-out' }} />
          <div style={{ width: '320px', height: '16px', background: 'var(--border)', borderRadius: 'var(--radius-sm)', animation: 'pulse 1.5s infinite ease-in-out' }} />
        </div>
        <div style={{ width: '140px', height: '40px', background: 'var(--border)', borderRadius: 'var(--radius-input)', animation: 'pulse 1.5s infinite ease-in-out' }} />
      </div>

      {/* Card skeleton */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-card)',
              padding: '1.5rem',
              border: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
            }}
          >
            <div style={{ width: '40%', height: '14px', background: 'var(--border)', borderRadius: 'var(--radius-sm)', animation: 'pulse 1.5s infinite ease-in-out' }} />
            <div style={{ width: '70%', height: '24px', background: 'var(--border)', borderRadius: 'var(--radius-sm)', animation: 'pulse 1.5s infinite ease-in-out' }} />
          </div>
        ))}
      </div>

      {/* Main card list skeleton */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-card)',
              padding: '1.25rem',
              border: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', width: '60%' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--border)', animation: 'pulse 1.5s infinite ease-in-out' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', width: '70%' }}>
                <div style={{ width: '80%', height: '16px', background: 'var(--border)', borderRadius: 'var(--radius-sm)', animation: 'pulse 1.5s infinite ease-in-out' }} />
                <div style={{ width: '50%', height: '12px', background: 'var(--border)', borderRadius: 'var(--radius-sm)', animation: 'pulse 1.5s infinite ease-in-out' }} />
              </div>
            </div>
            <div style={{ width: '80px', height: '28px', background: 'var(--border)', borderRadius: 'var(--radius-pill)', animation: 'pulse 1.5s infinite ease-in-out' }} />
          </div>
        ))}
      </div>
    </div>
  )
}
