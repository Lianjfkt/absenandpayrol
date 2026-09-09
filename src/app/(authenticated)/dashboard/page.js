import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { CheckInButton } from '@/components/attendance/CheckInButton'
import { ROLES, formatRupiah, formatJam } from '@/lib/constants'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user?.id)
    .maybeSingle()

  const isOwner = profile?.role === ROLES.OWNER
  const todayStr = new Date().toISOString().split('T')[0]
  const todayDay = new Date().getDay()
  const isHariLibur = todayDay === profile?.hari_libur

  // Monthly stats calculation (current month)
  const currentMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]

  // Data untuk Karyawan
  const { data: todayAttendance } = user
    ? await supabase
        .from('attendance')
        .select('*')
        .eq('employee_id', user.id)
        .eq('tanggal', todayStr)
        .maybeSingle()
    : { data: null }

  const { data: monthlyAttendance } = user && !isOwner
    ? await supabase
        .from('attendance')
        .select('*')
        .eq('employee_id', user.id)
        .gte('tanggal', currentMonthStart)
    : { data: [] }

  const hadirDays = monthlyAttendance?.filter(a => a.status === 'hadir' || a.status === 'telat').length || 0
  const targetDays = 26
  const attendancePercentage = Math.min(100, Math.round((hadirDays / targetDays) * 100))

  // Data untuk Owner
  const { data: allEmployees } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'karyawan')

  const { data: todayAllAttendance } = await supabase
    .from('attendance')
    .select('*, profiles:employee_id(nama)')
    .eq('tanggal', todayStr)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header Display */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.02em', margin: 0 }}>
            Selamat Pagi, {profile?.nama || 'Pengguna'} 👋
          </h1>
          <p style={{ color: 'var(--ink-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            {isOwner
              ? 'Ringkasan aktivitas operasional & tim kedai hari ini'
              : 'Pantau kehadiran, jadwal shift & perkiraan gaji Anda'}
          </p>
        </div>

        {!isOwner && (
          <Badge variant={isHariLibur ? 'warning' : 'accent'} size="lg">
            {isHariLibur ? 'Jadwal Libur' : 'Hari Kerja'}
          </Badge>
        )}
      </div>

      {/* DASHBOARD KARYAWAN */}
      {!isOwner && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Link href="/absensi" style={{ flex: '1 1 180px' }}>
              <Button variant="primary" size="lg" style={{ width: '100%' }}>
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
                Absen Sekarang
              </Button>
            </Link>
            <Link href="/absensi" style={{ flex: '1 1 180px' }}>
              <Button variant="secondary" size="lg" style={{ width: '100%' }}>
                Riwayat Saya
              </Button>
            </Link>
          </div>

          {/* Card Checkin Quick Action */}
          <Card style={{ padding: '1.75rem 1.25rem', textAlign: 'center' }}>
            <CheckInButton todayAttendance={todayAttendance} isHariLibur={isHariLibur} />
          </Card>

          {/* Progress Card Kehadiran Bulan Ini */}
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--ink)', margin: 0 }}>
                  Kehadiran Bulan Ini
                </h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--ink-muted)' }}>Target 26 hari kerja</span>
              </div>
              <Badge variant="accent" size="lg">
                {attendancePercentage}% Hadir
              </Badge>
            </div>

            {/* Progress Bar */}
            <div style={{
              width: '100%',
              height: '10px',
              borderRadius: 'var(--radius-pill)',
              background: 'var(--surface-muted)',
              overflow: 'hidden',
              marginBottom: '1rem',
            }}>
              <div style={{
                width: `${attendancePercentage}%`,
                height: '100%',
                background: 'var(--accent)',
                borderRadius: 'var(--radius-pill)',
                transition: 'width 0.5s ease',
              }} />
            </div>

            <div style={{
              display: 'flex',
              justify: 'space-between',
              alignItems: 'center',
              paddingTop: '0.75rem',
              borderTop: '1px solid var(--border)',
            }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--ink-muted)' }}>Gaji Pokok Berjalan</span>
              <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent)' }}>
                {formatRupiah(profile?.gaji_pokok || 0)}
              </span>
            </div>
          </Card>
        </div>
      )}

      {/* DASHBOARD OWNER */}
      {isOwner && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Quick Metrics Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
            <Card variant="accent-soft">
              <div style={{ color: 'var(--ink-muted)', fontSize: '0.85rem', fontWeight: 600 }}>Total Staf</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--ink)', marginTop: '0.25rem' }}>
                {allEmployees?.filter((e) => e.status_aktif).length || 0} <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>orang</span>
              </div>
            </Card>

            <Card>
              <div style={{ color: 'var(--ink-muted)', fontSize: '0.85rem', fontWeight: 600 }}>Hadir Hari Ini</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#16A34A', marginTop: '0.25rem' }}>
                {todayAllAttendance?.filter((a) => a.status === 'hadir').length || 0} <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--ink-muted)' }}>tim</span>
              </div>
            </Card>

            <Card>
              <div style={{ color: 'var(--ink-muted)', fontSize: '0.85rem', fontWeight: 600 }}>Telat Hari Ini</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent)', marginTop: '0.25rem' }}>
                {todayAllAttendance?.filter((a) => a.status === 'telat').length || 0} <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--ink-muted)' }}>orang</span>
              </div>
            </Card>
          </div>

          {/* List Kehadiran Staf */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--ink)', margin: 0 }}>
                Status Presensi Hari Ini
              </h2>
              <Link href="/absensi">
                <Button variant="outline" size="sm">Lihat Semua</Button>
              </Link>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {allEmployees?.map((emp) => {
                const att = todayAllAttendance?.find((a) => a.employee_id === emp.id)
                return (
                  <Card key={emp.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: 'var(--surface-muted)',
                        color: 'var(--ink)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '0.9rem'
                      }}>
                        {emp.nama ? emp.nama.charAt(0).toUpperCase() : 'K'}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--ink)', fontSize: '0.95rem' }}>{emp.nama}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--ink-muted)' }}>
                          {att
                            ? `Masuk: ${formatJam(att.jam_checkin)} ${att.jam_checkout ? `| Pulang: ${formatJam(att.jam_checkout)}` : ''}`
                            : 'Belum presensi hari ini'}
                        </div>
                      </div>
                    </div>

                    <div>
                      {att ? (
                        <Badge variant={att.status === 'hadir' ? 'success' : 'warning'}>
                          {att.status} {att.menit_telat > 0 ? `(${att.menit_telat}m)` : ''}
                        </Badge>
                      ) : (
                        <Badge variant="default">Belum Absen</Badge>
                      )}
                    </div>
                  </Card>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
