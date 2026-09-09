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
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  const isOwner = profile?.role === ROLES.OWNER
  const todayStr = new Date().toISOString().split('T')[0]
  const todayDay = new Date().getDay()
  const isHariLibur = todayDay === profile?.hari_libur

  // Data untuk Karyawan
  const { data: todayAttendance } = await supabase
    .from('attendance')
    .select('*')
    .eq('employee_id', user.id)
    .eq('tanggal', todayStr)
    .maybeSingle()

  // Data untuk Owner
  const { data: allEmployees } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'karyawan')

  const { data: todayAllAttendance } = await supabase
    .from('attendance')
    .select('*, profiles(nama)')
    .eq('tanggal', todayStr)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header Welcome */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>
            Selamat Datang, {profile?.nama || 'Pengguna'}! 👋
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {isOwner
              ? 'Ringkasan operasional dan kehadiran staf kedai hari ini.'
              : 'Dashboard absensi dan performa kehadiran Anda.'}
          </p>
        </div>

        {!isOwner && (
          <Badge variant={isHariLibur ? 'info' : 'success'}>
            {isHariLibur ? 'Hari Libur Anda' : 'Hari Kerja'}
          </Badge>
        )}
      </div>

      {/* DASHBOARD KARYAWAN */}
      {!isOwner && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <Card variant="glass" style={{ padding: '2rem 1rem', display: 'flex', justifyContent: 'center' }}>
            <CheckInButton todayAttendance={todayAttendance} isHariLibur={isHariLibur} />
          </Card>

          <div className="grid grid-cols-1 grid-cols-2" style={{ gap: '1rem' }}>
            <Card>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>Gaji Pokok Anda</h3>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary-light)' }}>
                {formatRupiah(profile?.gaji_pokok || 0)}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                Per bulan (sebelum bonus & potongan)
              </div>
            </Card>

            <Card>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>Akses Cepat</h3>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                <Link href="/absensi">
                  <Button variant="secondary" size="sm">📅 Riwayat Absensi</Button>
                </Link>
                <Link href="/slip-gaji">
                  <Button variant="secondary" size="sm">🧾 Lihat Slip Gaji</Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* DASHBOARD OWNER */}
      {isOwner && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Quick Metrics */}
          <div className="grid grid-cols-1 grid-cols-3" style={{ gap: '1rem' }}>
            <Card>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Total Staf Aktif</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '0.25rem' }}>
                {allEmployees?.filter((e) => e.status_aktif).length || 0} Orang
              </div>
            </Card>

            <Card>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Hadir Hari Ini</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--success)', marginTop: '0.25rem' }}>
                {todayAllAttendance?.filter((a) => a.status === 'hadir').length || 0} Orang
              </div>
            </Card>

            <Card>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Telat Hari Ini</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--warning)', marginTop: '0.25rem' }}>
                {todayAllAttendance?.filter((a) => a.status === 'telat').length || 0} Orang
              </div>
            </Card>
          </div>

          {/* Status Kehadiran Karyawan Hari Ini */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Kehadiran Hari Ini ({todayStr})</h2>
              <Link href="/absensi">
                <Button variant="outline" size="sm">Semua Absensi</Button>
              </Link>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {allEmployees?.map((emp) => {
                const att = todayAllAttendance?.find((a) => a.employee_id === emp.id)
                return (
                  <Card key={emp.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{emp.nama}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {att
                          ? `In: ${formatJam(att.jam_checkin)} ${att.jam_checkout ? `| Out: ${formatJam(att.jam_checkout)}` : ''}`
                          : 'Belum Melakukan Absen'}
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
