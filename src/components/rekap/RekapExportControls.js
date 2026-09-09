'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { downloadCSV, triggerPrint } from '@/lib/utils/export'
import { Button } from '@/components/ui/Button'

export function RekapExportControls({ payrolls = [], currentMonth, currentYear }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handlePeriodChange = (e) => {
    const [year, month] = e.target.value.split('-')
    router.push(`/rekap?bulan=${parseInt(month, 10)}&tahun=${year}`)
  }

  const handleExportCSV = () => {
    if (!payrolls.length) {
      alert('Tidak ada data payroll untuk di-export.')
      return
    }

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

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '1rem',
        padding: '0.75rem 1rem',
        background: 'var(--bg-surface)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Pilih Periode:</span>
        <input
          type="month"
          value={`${currentYear}-${String(currentMonth).padStart(2, '0')}`}
          onChange={handlePeriodChange}
          style={{
            padding: '0.4rem 0.75rem',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-main)',
            border: '1px solid var(--border)',
            color: 'inherit',
            fontSize: '0.9rem',
          }}
        />
      </div>

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <Button variant="outline" size="sm" onClick={triggerPrint}>
          🖨️ Cetak / PDF
        </Button>
        <Button variant="primary" size="sm" onClick={handleExportCSV}>
          📥 Export Excel / CSV
        </Button>
      </div>
    </div>
  )
}
