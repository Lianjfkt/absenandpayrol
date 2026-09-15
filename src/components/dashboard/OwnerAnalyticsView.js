'use client'

import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { formatRupiah } from '@/lib/constants'

export function OwnerAnalyticsView({
  employees = [],
  monthlyAttendance = [],
  activeLoans = [],
}) {
  // 1. Hitung total metrik kehadiran bulan berjalan
  const totalHadir = monthlyAttendance.filter((a) => a.status === 'hadir').length
  const totalTelat = monthlyAttendance.filter((a) => a.status === 'telat').length
  const totalOff = monthlyAttendance.filter((a) => a.status === 'off').length
  const totalEvents = Math.max(1, totalHadir + totalTelat + totalOff)

  const pctHadir = Math.round((totalHadir / totalEvents) * 100)
  const pctTelat = Math.round((totalTelat / totalEvents) * 100)
  const pctOff = Math.round((totalOff / totalEvents) * 100)

  // 2. Ranking Staf berdasarkan Kedisiplinan
  const staffStats = employees.map((emp) => {
    const empAtt = monthlyAttendance.filter((a) => a.employee_id === emp.id)
    const empHadir = empAtt.filter((a) => a.status === 'hadir').length
    const empTelat = empAtt.filter((a) => a.status === 'telat').length
    const empOff = empAtt.filter((a) => a.status === 'off').length
    const totalMenitTelat = empAtt.reduce((acc, a) => acc + (a.menit_telat || 0), 0)

    const totalDays = empAtt.length
    const onTimeScore = totalDays > 0 ? Math.round((empHadir / totalDays) * 100) : 100

    return {
      ...emp,
      hadir: empHadir,
      telat: empTelat,
      off: empOff,
      totalMenitTelat,
      onTimeScore,
    }
  })

  // Urutkan staf paling rajin (onTimeScore tertinggi)
  const topDisciplined = [...staffStats].sort((a, b) => b.onTimeScore - a.onTimeScore || a.telat - b.telat).slice(0, 3)
  
  // Staf yang sering telat / off
  const needsAttention = [...staffStats].filter((s) => s.telat > 0 || s.off > 0).sort((a, b) => (b.telat + b.off) - (a.telat + a.off)).slice(0, 3)

  // 3. Proyeksi Anggaran Penggajian Berjalan
  const totalGajiPokokSemua = employees.reduce((acc, e) => acc + (e.gaji_pokok || 0), 0)
  const totalPotonganBerjalan = monthlyAttendance.reduce((acc, a) => acc + (a.potongan_telat || 0), 0)
  const totalKasbonBeredar = activeLoans.reduce((acc, l) => acc + (l.sisa_pinjaman || 0), 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Visual Bar Breakdown Kehadiran */}
      <Card variant="default" style={{ padding: '1.25rem 1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--ink)', margin: 0 }}>
              📊 Komposisi Kehadiran Tim Bulan Ini
            </h3>
            <div style={{ fontSize: '0.8rem', color: 'var(--ink-muted)', marginTop: '0.15rem' }}>
              Statistik agregat kedisiplinan dan absensi seluruh staf
            </div>
          </div>
          <Badge variant="accent">Bulan Berjalan</Badge>
        </div>

        {/* Multi-segmented Progress Bar */}
        <div
          style={{
            display: 'flex',
            height: '14px',
            borderRadius: 'var(--radius-pill)',
            overflow: 'hidden',
            background: 'var(--surface-muted)',
            marginBottom: '1rem',
          }}
        >
          <div style={{ width: `${pctHadir}%`, background: '#10B981', transition: 'width 0.5s ease' }} title={`Hadir: ${pctHadir}%`} />
          <div style={{ width: `${pctTelat}%`, background: '#F59E0B', transition: 'width 0.5s ease' }} title={`Telat: ${pctTelat}%`} />
          <div style={{ width: `${pctOff}%`, background: '#EF4444', transition: 'width 0.5s ease' }} title={`Off / Alpa: ${pctOff}%`} />
        </div>

        {/* Legend */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10B981' }} />
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)' }}>Tepat Waktu</div>
              <strong style={{ fontSize: '0.9rem', color: 'var(--ink)' }}>{totalHadir} ({pctHadir}%)</strong>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#F59E0B' }} />
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)' }}>Terlambat</div>
              <strong style={{ fontSize: '0.9rem', color: 'var(--ink)' }}>{totalTelat} ({pctTelat}%)</strong>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#EF4444' }} />
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)' }}>Off / Alpa (-50rb)</div>
              <strong style={{ fontSize: '0.9rem', color: 'var(--ink)' }}>{totalOff} ({pctOff}%)</strong>
            </div>
          </div>
        </div>
      </Card>

      {/* 2 Kolom: Staf Teladan vs Perlu Evaluasi */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
        {/* Top Rajin */}
        <Card variant="default">
          <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--success)', margin: '0 0 0.75rem 0' }}>
            🏆 Staf Paling Disiplin
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {topDisciplined.length === 0 ? (
              <div style={{ fontSize: '0.8rem', color: 'var(--ink-muted)' }}>Belum ada data absensi bulan ini.</div>
            ) : (
              topDisciplined.map((staf, idx) => (
                <div
                  key={staf.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.5rem 0.75rem',
                    background: 'var(--surface-muted)',
                    borderRadius: 'var(--radius-input)',
                    fontSize: '0.85rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontWeight: 800, color: 'var(--accent)' }}>#{idx + 1}</span>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--ink)' }}>{staf.nama}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--ink-muted)' }}>{staf.jabatan || 'Staf'}</div>
                    </div>
                  </div>
                  <Badge variant="success" size="sm">
                    {staf.onTimeScore}% On-Time
                  </Badge>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Perlu Perhatian */}
        <Card variant="default">
          <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--warning)', margin: '0 0 0.75rem 0' }}>
            ⚠️ Catatan Keterlambatan
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {needsAttention.length === 0 ? (
              <div style={{ fontSize: '0.8rem', color: 'var(--success)', fontWeight: 600 }}>
                ✨ Luar biasa! Seluruh staf tidak ada yang telat bulan ini.
              </div>
            ) : (
              needsAttention.map((staf) => (
                <div
                  key={staf.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.5rem 0.75rem',
                    background: 'var(--surface-muted)',
                    borderRadius: 'var(--radius-input)',
                    fontSize: '0.85rem',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--ink)' }}>{staf.nama}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--ink-muted)' }}>
                      Akumulasi Telat: {staf.totalMenitTelat} menit
                    </div>
                  </div>
                  <Badge variant="warning" size="sm">
                    {staf.telat}x Telat
                  </Badge>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Proyeksi Finansial Berjalan */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <Card variant="accent-soft">
          <div style={{ fontSize: '0.8rem', color: 'var(--ink-muted)', fontWeight: 600 }}>Proyeksi Anggaran Gaji Pokok</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent)', marginTop: '0.25rem' }}>
            {formatRupiah(totalGajiPokokSemua)}
          </div>
        </Card>

        <Card>
          <div style={{ fontSize: '0.8rem', color: 'var(--ink-muted)', fontWeight: 600 }}>Akumulasi Denda Telat Berjalan</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--danger)', marginTop: '0.25rem' }}>
            -{formatRupiah(totalPotonganBerjalan)}
          </div>
        </Card>

        <Card>
          <div style={{ fontSize: '0.8rem', color: 'var(--ink-muted)', fontWeight: 600 }}>Total Piutang Kasbon Tim</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#3B82F6', marginTop: '0.25rem' }}>
            {formatRupiah(totalKasbonBeredar)}
          </div>
        </Card>
      </div>
    </div>
  )
}
