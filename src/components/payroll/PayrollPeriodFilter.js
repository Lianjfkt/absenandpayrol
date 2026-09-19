'use client'

import { useRouter } from 'next/navigation'

export function PayrollPeriodFilter({ currentMonth, currentYear }) {
  const router = useRouter()

  const handlePeriodChange = (e) => {
    const [year, month] = e.target.value.split('-')
    router.push(`/payroll?bulan=${parseInt(month, 10)}&tahun=${year}`)
  }

  const handlePrevMonth = () => {
    let prevM = currentMonth - 1
    let prevY = currentYear
    if (prevM < 1) {
      prevM = 12
      prevY -= 1
    }
    router.push(`/payroll?bulan=${prevM}&tahun=${prevY}`)
  }

  const handleNextMonth = () => {
    let nextM = currentMonth + 1
    let nextY = currentYear
    if (nextM > 12) {
      nextM = 1
      nextY += 1
    }
    router.push(`/payroll?bulan=${nextM}&tahun=${nextY}`)
  }

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '0.85rem',
        padding: '0.85rem 1.25rem',
        background: 'var(--surface)',
        borderRadius: 'var(--radius-card)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.85rem', color: 'var(--ink-muted)', fontWeight: 600 }}>Pilih Periode:</span>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <button
            type="button"
            onClick={handlePrevMonth}
            title="Bulan Sebelumnya"
            style={{
              background: 'var(--surface-muted)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-pill)',
              padding: '0.35rem 0.65rem',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.85rem',
              color: 'var(--ink)',
            }}
          >
            ‹
          </button>

          <input
            type="month"
            value={`${currentYear}-${String(currentMonth).padStart(2, '0')}`}
            onChange={handlePeriodChange}
            style={{
              padding: '0.45rem 0.85rem',
              borderRadius: 'var(--radius-pill)',
              background: 'var(--surface-muted)',
              border: '1.5px solid var(--border)',
              color: 'var(--ink)',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              outline: 'none',
            }}
          />

          <button
            type="button"
            onClick={handleNextMonth}
            title="Bulan Berikutnya"
            style={{
              background: 'var(--surface-muted)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-pill)',
              padding: '0.35rem 0.65rem',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.85rem',
              color: 'var(--ink)',
            }}
          >
            ›
          </button>
        </div>
      </div>
    </div>
  )
}
