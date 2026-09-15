'use client'

import { useRouter } from 'next/navigation'
import { formatRupiah, formatTanggal, formatJam, ATTENDANCE_STATUS } from '@/lib/constants'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { downloadCSV } from '@/lib/utils/export'
import { generateRekapKaryawanPDF } from '@/lib/utils/pdfGenerator'

const BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

const STATUS_LABEL = {
  hadir: 'Hadir',
  telat: 'Telat',
  off: 'Off / Alpa',
  libur_mingguan: 'Libur',
}

const STATUS_BADGE = {
  hadir: 'success',
  telat: 'warning',
  off: 'danger',
  libur_mingguan: 'info',
}

function StatCard({ label, value, sub, color = 'var(--ink)', bg }) {
  return (
    <div
      style={{
        background: bg || 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-card)',
        padding: '1rem 1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.2rem',
      }}
    >
      <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}
      </div>
      <div style={{ fontSize: '1.5rem', fontWeight: 800, color, lineHeight: 1.2 }}>{value}</div>
      {sub && <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)' }}>{sub}</div>}
    </div>
  )
}

export function RekapKaryawanView({
  employee,
  payroll,
  attendances = [],
  allEmployees = [],
  settings = {},
  currentMonth,
  currentYear,
  periodStart,
  periodEnd,
}) {
  const router = useRouter()

  const handlePeriodChange = (e) => {
    const [year, month] = e.target.value.split('-')
    router.push(`/rekap/${employee.id}?bulan=${parseInt(month, 10)}&tahun=${year}`)
  }

  const handleEmployeeChange = (e) => {
    router.push(`/rekap/${e.target.value}?bulan=${currentMonth}&tahun=${currentYear}`)
  }

  const handleExportPDF = () => {
    generateRekapKaryawanPDF(employee, payroll, attendances, currentMonth, currentYear, settings, periodStart, periodEnd)
  }

  const handleExportCSV = () => {
    const rows = attendances.map((a) => ({
      'Tanggal': a.tanggal,
      'Status': STATUS_LABEL[a.status] || a.status,
      'Jam Masuk': a.jam_checkin ? new Date(a.jam_checkin).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-',
      'Jam Pulang': a.jam_checkout ? new Date(a.jam_checkout).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-',
      'Keterlambatan (Menit)': a.menit_telat || 0,
      'Potongan Telat (Rp)': a.potongan_telat || 0,
      'Input Manual': a.is_override ? 'Ya' : 'Tidak',
      'Catatan': a.catatan || '',
    }))
    downloadCSV(`Rekap_${employee.nama.replace(/\s+/g, '_')}_${currentMonth}_${currentYear}.csv`, rows)
  }

  // Hitung ringkasan absensi dari data attendance
  const totalHadir = attendances.filter((a) => a.status === ATTENDANCE_STATUS.HADIR).length
  const totalTelat = attendances.filter((a) => a.status === ATTENDANCE_STATUS.TELAT).length
  const totalOff = attendances.filter((a) => a.status === ATTENDANCE_STATUS.OFF).length
  const totalLibur = attendances.filter((a) => a.status === ATTENDANCE_STATUS.LIBUR_MINGGUAN).length
  const totalPotonganTelat = attendances.reduce((s, a) => s + (a.potongan_telat || 0), 0)

  const fmtDate = (d) => d ? new Date(d + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : null
  const periodLabel = periodStart && periodEnd
    ? `${fmtDate(periodStart)} – ${fmtDate(periodEnd)}`
    : `${BULAN[currentMonth - 1]} ${currentYear}`

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

      {/* Header + Navigasi */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <button
          type="button"
          onClick={() => router.push(`/rekap?bulan=${currentMonth}&tahun=${currentYear}`)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--accent)', fontSize: '0.875rem', fontWeight: 600,
            padding: 0, width: 'fit-content',
          }}
        >
          ← Kembali ke Rekap Bulanan
        </button>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.02em', margin: 0 }}>
              {employee.nama}
            </h1>
            <p style={{ color: 'var(--ink-muted)', fontSize: '0.875rem', marginTop: '0.2rem' }}>
              {employee.jabatan || 'Staf Kedai'} · Rekap {periodLabel}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <Button variant="outline" size="sm" onClick={handleExportPDF}>
              📄 PDF
            </Button>
            <Button variant="primary" size="sm" onClick={handleExportCSV}>
              📥 CSV
            </Button>
          </div>
        </div>
      </div>

      {/* Filter: Karyawan + Periode */}
      <div
        style={{
          display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center',
          padding: '0.85rem 1.25rem',
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--ink-muted)' }}>Karyawan:</span>
          <select
            value={employee.id}
            onChange={handleEmployeeChange}
            style={{
              padding: '0.45rem 0.85rem', borderRadius: 'var(--radius-pill)',
              background: 'var(--surface-muted)', border: '1.5px solid var(--border)',
              color: 'var(--ink)', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', outline: 'none',
            }}
          >
            {allEmployees.map((emp) => (
              <option key={emp.id} value={emp.id}>{emp.nama}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--ink-muted)' }}>Periode:</span>
          <input
            type="month"
            value={`${currentYear}-${String(currentMonth).padStart(2, '0')}`}
            onChange={handlePeriodChange}
            style={{
              padding: '0.45rem 0.85rem', borderRadius: 'var(--radius-pill)',
              background: 'var(--surface-muted)', border: '1.5px solid var(--border)',
              color: 'var(--ink)', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', outline: 'none',
            }}
          />
        </div>
      </div>

      {/* Ringkasan Kehadiran */}
      <div>
        <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '0.75rem' }}>
          Ringkasan Kehadiran
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' }}>
          <StatCard label="Hadir" value={`${totalHadir} hr`} color="var(--success)" bg="#F0FDF4" />
          <StatCard label="Telat" value={`${totalTelat} hr`} color="var(--warning)" bg="#FFFBEB" />
          <StatCard label="Off / Alpa" value={`${totalOff} hr`} color="var(--danger)" bg="#FEF2F2" />
          <StatCard label="Libur Mingguan" value={`${totalLibur} hr`} color="var(--info)" bg="#EFF6FF" />
          <StatCard label="Total Absensi Tercatat" value={`${attendances.length} hr`} color="var(--ink)" />
        </div>
      </div>

      {/* Ringkasan Gaji (dari payroll) */}
      <div>
        <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '0.75rem' }}>
          Ringkasan Gaji — {periodLabel}
        </h2>

        {payroll ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(155px, 1fr))', gap: '0.75rem' }}>
            <StatCard label="Gaji Pokok" value={formatRupiah(payroll.gaji_pokok)} color="var(--ink)" />
            <StatCard
              label="Total Potongan"
              value={`-${formatRupiah((payroll.total_potongan_telat || 0) + (payroll.total_potongan_off || 0) + (payroll.total_potongan_kasbon || 0))}`}
              sub={`Telat: ${formatRupiah(payroll.total_potongan_telat)} | Off: ${formatRupiah(payroll.total_potongan_off)} | Kasbon: ${formatRupiah(payroll.total_potongan_kasbon || 0)}`}
              color="var(--danger)"
              bg="#FEF2F2"
            />
            <StatCard
              label="Total Bonus"
              value={`+${formatRupiah((payroll.total_bonus_libur || 0) + (payroll.total_bonus_manual || 0))}`}
              sub={`Libur masuk: ${formatRupiah(payroll.total_bonus_libur)} | Manual: ${formatRupiah(payroll.total_bonus_manual)}`}
              color="var(--success)"
              bg="#F0FDF4"
            />
            <StatCard
              label="Total Gaji Bersih"
              value={formatRupiah(payroll.total_gaji)}
              sub={payroll.status_pembayaran === 'sudah_dibayar' ? '✅ Sudah Dibayar' : '⏳ Belum Dibayar'}
              color="var(--accent)"
              bg="#EEF2FF"
            />
          </div>
        ) : (
          <Card style={{ textAlign: 'center', padding: '2rem', color: 'var(--ink-muted)' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📋</div>
            <div style={{ fontWeight: 600 }}>Payroll belum di-generate untuk periode ini.</div>
            <div style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>Silakan generate payroll terlebih dahulu di menu Payroll.</div>
            {totalPotonganTelat > 0 && (
              <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: 'var(--warning)', fontWeight: 600 }}>
                Estimasi potongan telat dari absensi: {formatRupiah(totalPotonganTelat)}
              </div>
            )}
          </Card>
        )}
      </div>

      {/* Log Absensi Harian */}
      <div>
        <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '0.75rem' }}>
          Log Absensi Harian — {periodLabel}
        </h2>

        {attendances.length === 0 ? (
          <Card style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--ink-muted)' }}>
            Tidak ada data absensi untuk karyawan ini pada periode {periodLabel}.
          </Card>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {attendances.map((att) => (
              <Card
                key={att.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                  padding: '0.85rem 1.25rem',
                }}
              >
                {/* Kiri: Tanggal + Catatan */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', minWidth: '120px' }}>
                  <div style={{ fontWeight: 700, color: 'var(--ink)', fontSize: '0.9rem' }}>
                    {formatTanggal(att.tanggal)}
                  </div>
                  {att.is_override && (
                    <span style={{
                      fontSize: '0.68rem', fontWeight: 700,
                      background: '#FEF3C7', color: '#92400E',
                      border: '1px solid #FCD34D',
                      padding: '0.1rem 0.4rem',
                      borderRadius: 'var(--radius-pill)',
                      width: 'fit-content',
                    }}>
                      ✎ Manual Owner
                    </span>
                  )}
                  {att.catatan && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', fontStyle: 'italic' }}>
                      {att.catatan}
                    </div>
                  )}
                </div>

                {/* Tengah: Jam masuk & pulang */}
                <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.875rem', color: 'var(--ink)' }}>
                  <div>
                    <span style={{ color: 'var(--ink-muted)', fontWeight: 500 }}>Masuk: </span>
                    <strong>{att.jam_checkin ? formatJam(att.jam_checkin) : '—'}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--ink-muted)', fontWeight: 500 }}>Pulang: </span>
                    <strong>{att.jam_checkout ? formatJam(att.jam_checkout) : '—'}</strong>
                  </div>
                  {att.menit_telat > 0 && (
                    <div style={{ color: 'var(--warning)', fontWeight: 700 }}>
                      +{att.menit_telat} mnt telat
                    </div>
                  )}
                </div>

                {/* Kanan: Badge + Potongan */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
                  <Badge variant={STATUS_BADGE[att.status] || 'default'}>
                    {STATUS_LABEL[att.status] || att.status?.toUpperCase()}
                  </Badge>
                  {att.potongan_telat > 0 && (
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--danger)' }}>
                      -{formatRupiah(att.potongan_telat)}
                    </span>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}
