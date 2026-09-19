'use client'

import { useRouter } from 'next/navigation'
import { downloadCSV } from '@/lib/utils/export'
import { generateLaporanKeuanganPDF } from '@/lib/utils/pdfGenerator'
import { Button } from '@/components/ui/Button'

const BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

export function RekapExportControls({ payrolls = [], currentMonth, currentYear, settings = {} }) {
  const router = useRouter()

  const navigate = (month, year) => {
    router.push(`/rekap?bulan=${month}&tahun=${year}`)
  }

  const handlePrev = () => {
    if (currentMonth === 1) navigate(12, currentYear - 1)
    else navigate(currentMonth - 1, currentYear)
  }

  const handleNext = () => {
    if (currentMonth === 12) navigate(1, currentYear + 1)
    else navigate(currentMonth + 1, currentYear)
  }

  const handleExportPDF = () => {
    if (!payrolls.length) { alert('Tidak ada data payroll untuk di-export.'); return }
    generateLaporanKeuanganPDF(payrolls, currentMonth, currentYear, settings)
  }

  const handleExportCSV = () => {
    if (!payrolls.length) { alert('Tidak ada data payroll untuk di-export.'); return }
    const rows = payrolls.map((p) => ({
      'Periode Bulan': p.periode_bulan,
      'Periode Tahun': p.periode_tahun,
      'Nama Karyawan': p.profiles?.nama || '',
      'Jabatan': p.profiles?.jabatan || '',
      'Gaji Pokok': p.gaji_pokok,
      'Hari Hadir': p.total_hari_hadir,
      'Hari Telat': p.total_hari_telat,
      'Hari Off': p.total_hari_off,
      'Masuk Hari Libur': p.total_hari_libur_masuk,
      'Potongan Telat': p.total_potongan_telat,
      'Potongan Off': p.total_potongan_off,
      'Potongan Kasbon': p.total_potongan_kasbon || 0,
      'Bonus Masuk Libur': p.total_bonus_libur,
      'Bonus Tambahan': p.total_bonus_manual,
      'Adjustment': p.adjustment,
      'Keterangan Adjustment': p.keterangan_adjustment || '',
      'Total Gaji Bersih': p.total_gaji,
      'Status Pembayaran': p.status_pembayaran,
      'Tanggal Dibayar': p.tanggal_dibayar || '',
    }))
    downloadCSV(`Rekap_Payroll_Kedai_${currentMonth}_${currentYear}.csv`, rows)
  }

  const nowYear = new Date().getFullYear()
  const nowMonth = new Date().getMonth() + 1
  const isCurrentPeriod = currentMonth === nowMonth && currentYear === nowYear

  return (
    <div style={{
      background: 'var(--surface)',
      borderRadius: 'var(--radius-card)',
      border: '1px solid var(--border)',
      boxShadow: 'var(--shadow-card)',
      overflow: 'hidden',
    }}>
      {/* Period Navigator */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1rem 1.25rem',
        borderBottom: '1px solid var(--border)',
        gap: '0.5rem',
      }}>
        {/* Prev */}
        <button
          type="button"
          onClick={handlePrev}
          aria-label="Bulan sebelumnya"
          style={{
            width: '40px', height: '40px',
            borderRadius: 'var(--radius-input)',
            border: '1.5px solid var(--border)',
            background: 'var(--surface-muted)',
            color: 'var(--ink)',
            fontSize: '1.1rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            transition: 'background 0.15s, border-color 0.15s',
          }}
          onMouseOver={e => { e.currentTarget.style.background = 'var(--border)' }}
          onMouseOut={e => { e.currentTarget.style.background = 'var(--surface-muted)' }}
        >
          ‹
        </button>

        {/* Center: Month + Year */}
        <div style={{ textAlign: 'center', flex: 1 }}>
          <div style={{
            fontSize: '1.2rem',
            fontWeight: 800,
            color: 'var(--ink)',
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
          }}>
            {BULAN[currentMonth - 1]}
          </div>
          <div style={{
            fontSize: '0.8rem',
            fontWeight: 600,
            color: 'var(--ink-muted)',
            marginTop: '0.1rem',
          }}>
            {currentYear}
            {isCurrentPeriod && (
              <span style={{
                marginLeft: '0.4rem',
                background: 'var(--accent)',
                color: '#fff',
                fontSize: '0.65rem',
                fontWeight: 700,
                padding: '0.1rem 0.45rem',
                borderRadius: 'var(--radius-pill)',
                verticalAlign: 'middle',
              }}>
                BERJALAN
              </span>
            )}
          </div>
        </div>

        {/* Next */}
        <button
          type="button"
          onClick={handleNext}
          aria-label="Bulan berikutnya"
          style={{
            width: '40px', height: '40px',
            borderRadius: 'var(--radius-input)',
            border: '1.5px solid var(--border)',
            background: 'var(--surface-muted)',
            color: 'var(--ink)',
            fontSize: '1.1rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            transition: 'background 0.15s, border-color 0.15s',
          }}
          onMouseOver={e => { e.currentTarget.style.background = 'var(--border)' }}
          onMouseOut={e => { e.currentTarget.style.background = 'var(--surface-muted)' }}
        >
          ›
        </button>
      </div>

      {/* Quick Month Chips — 6 bulan terakhir */}
      <div style={{
        display: 'flex',
        gap: '0.35rem',
        padding: '0.65rem 1.25rem',
        overflowX: 'auto',
        borderBottom: '1px solid var(--border)',
        scrollbarWidth: 'none',
      }}>
        {Array.from({ length: 6 }, (_, i) => {
          let m = nowMonth - i
          let y = nowYear
          if (m <= 0) { m += 12; y -= 1 }
          const active = m === currentMonth && y === currentYear
          return (
            <button
              key={`${y}-${m}`}
              type="button"
              onClick={() => navigate(m, y)}
              style={{
                flexShrink: 0,
                padding: '0.3rem 0.75rem',
                borderRadius: 'var(--radius-pill)',
                border: active ? '2px solid var(--accent)' : '1.5px solid var(--border)',
                background: active ? 'var(--accent)' : 'var(--surface-muted)',
                color: active ? '#fff' : 'var(--ink)',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s',
                whiteSpace: 'nowrap',
              }}
            >
              {BULAN[m - 1].slice(0, 3)} {y}
            </button>
          )
        })}
      </div>

      {/* Export Buttons */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        padding: '0.75rem 1.25rem',
        flexWrap: 'wrap',
      }}>
        <Button variant="outline" size="sm" onClick={handleExportPDF} style={{ flex: 1, minWidth: '120px' }}>
          📄 Unduh PDF
        </Button>
        <Button variant="primary" size="sm" onClick={handleExportCSV} style={{ flex: 1, minWidth: '120px' }}>
          📥 Export CSV
        </Button>
      </div>
    </div>
  )
}

