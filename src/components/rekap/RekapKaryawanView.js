'use client'

import { useRouter } from 'next/navigation'
import { formatRupiah, formatTanggal, formatJam, ATTENDANCE_STATUS } from '@/lib/constants'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { downloadCSV } from '@/lib/utils/export'
import { generateRekapKaryawanPDF } from '@/lib/utils/pdfGenerator'
import { FotoCheckinPreview } from '@/components/attendance/FotoCheckinPreview'

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

  const handlePrevPeriod = () => {
    if (currentMonth === 1) router.push(`/rekap/${employee.id}?bulan=12&tahun=${currentYear - 1}`)
    else router.push(`/rekap/${employee.id}?bulan=${currentMonth - 1}&tahun=${currentYear}`)
  }

  const handleNextPeriod = () => {
    if (currentMonth === 12) router.push(`/rekap/${employee.id}?bulan=1&tahun=${currentYear + 1}`)
    else router.push(`/rekap/${employee.id}?bulan=${currentMonth + 1}&tahun=${currentYear}`)
  }

  const nowYear = new Date().getFullYear()
  const nowMonth = new Date().getMonth() + 1
  const isCurrentPeriod = currentMonth === nowMonth && currentYear === nowYear

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

      {/* ── FILTER CARD: Karyawan + Periode ── */}
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-card)',
        boxShadow: 'var(--shadow-card)',
        overflow: 'hidden',
      }}>
        {/* Karyawan chips */}
        <div style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--ink-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            Karyawan
          </div>
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            overflowX: 'auto',
            scrollbarWidth: 'none',
            paddingBottom: '2px',
          }}>
            {allEmployees.map((emp) => {
              const active = emp.id === employee.id
              const initials = emp.nama ? emp.nama.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '?'
              return (
                <button
                  key={emp.id}
                  type="button"
                  onClick={() => router.push(`/rekap/${emp.id}?bulan=${currentMonth}&tahun=${currentYear}`)}
                  style={{
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    padding: '0.35rem 0.75rem 0.35rem 0.4rem',
                    borderRadius: 'var(--radius-pill)',
                    border: active ? '2px solid var(--accent)' : '1.5px solid var(--border)',
                    background: active ? 'var(--accent-soft)' : 'var(--surface-muted)',
                    color: active ? 'var(--accent)' : 'var(--ink)',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    fontWeight: active ? 700 : 600,
                    fontSize: '0.8rem',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <span style={{
                    width: '22px', height: '22px',
                    borderRadius: '50%',
                    background: active ? 'var(--accent)' : 'var(--border-strong)',
                    color: active ? '#fff' : 'var(--ink-muted)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    flexShrink: 0,
                  }}>
                    {initials}
                  </span>
                  {emp.nama}
                </button>
              )
            })}
          </div>
        </div>

        {/* Period Navigator */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.85rem 1.25rem',
          borderBottom: '1px solid var(--border)',
          gap: '0.5rem',
        }}>
          <button
            type="button"
            onClick={handlePrevPeriod}
            aria-label="Bulan sebelumnya"
            style={{
              width: '38px', height: '38px',
              borderRadius: 'var(--radius-input)',
              border: '1.5px solid var(--border)',
              background: 'var(--surface-muted)',
              color: 'var(--ink)',
              fontSize: '1.1rem', fontWeight: 700,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            ‹
          </button>

          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.01em', lineHeight: 1.1 }}>
              {BULAN[currentMonth - 1]}
            </div>
            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--ink-muted)', marginTop: '0.1rem' }}>
              {currentYear}
              {isCurrentPeriod && (
                <span style={{
                  marginLeft: '0.4rem',
                  background: 'var(--accent)', color: '#fff',
                  fontSize: '0.6rem', fontWeight: 700,
                  padding: '0.1rem 0.4rem',
                  borderRadius: 'var(--radius-pill)',
                  verticalAlign: 'middle',
                }}>
                  BERJALAN
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleNextPeriod}
            aria-label="Bulan berikutnya"
            style={{
              width: '38px', height: '38px',
              borderRadius: 'var(--radius-input)',
              border: '1.5px solid var(--border)',
              background: 'var(--surface-muted)',
              color: 'var(--ink)',
              fontSize: '1.1rem', fontWeight: 700,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            ›
          </button>
        </div>

        {/* Quick month chips */}
        <div style={{
          display: 'flex', gap: '0.35rem',
          padding: '0.55rem 1.25rem',
          overflowX: 'auto', scrollbarWidth: 'none',
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
                onClick={() => router.push(`/rekap/${employee.id}?bulan=${m}&tahun=${y}`)}
                style={{
                  flexShrink: 0,
                  padding: '0.28rem 0.7rem',
                  borderRadius: 'var(--radius-pill)',
                  border: active ? '2px solid var(--accent)' : '1.5px solid var(--border)',
                  background: active ? 'var(--accent)' : 'var(--surface-muted)',
                  color: active ? '#fff' : 'var(--ink)',
                  fontSize: '0.75rem', fontWeight: 700,
                  cursor: 'pointer', whiteSpace: 'nowrap',
                  transition: 'all 0.15s',
                }}
              >
                {BULAN[m - 1].slice(0, 3)} {y}
              </button>
            )
          })}
        </div>

        {/* Export buttons */}
        <div style={{ display: 'flex', gap: '0.5rem', padding: '0.65rem 1.25rem', flexWrap: 'wrap' }}>
          <Button variant="outline" size="sm" onClick={handleExportPDF} style={{ flex: 1, minWidth: '100px' }}>📄 PDF</Button>
          <Button variant="primary" size="sm" onClick={handleExportCSV} style={{ flex: 1, minWidth: '100px' }}>📥 CSV</Button>
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
                {/* Kiri: Foto + Tanggal + Catatan */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <FotoCheckinPreview
                    fotoCheckin={att.foto_checkin}
                    namaKaryawan={employee?.nama || ''}
                    tanggal={att.tanggal}
                    jamCheckin={att.jam_checkin}
                    accuracy={att.accuracy_meter}
                  />
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
