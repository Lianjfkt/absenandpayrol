import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/Card'
import { CheckInButton } from '@/components/attendance/CheckInButton'
import { Badge } from '@/components/ui/Badge'
import { formatTanggal, formatJam, formatRupiah, ROLES } from '@/lib/constants'

export default async function AbsensiPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  const isOwner = profile?.role === ROLES.OWNER
  const todayStr = new Date().toISOString().split('T')[0]
  const todayDay = new Date().getDay()
  const isHariLibur = todayDay === profile?.hari_libur

  // Ambil absensi hari ini untuk user
  const { data: todayAttendance } = await supabase
    .from('attendance')
    .select('*')
    .eq('employee_id', user.id)
    .eq('tanggal', todayStr)
    .maybeSingle()

  // Ambil histori riwayat absensi bulan ini
  let query = supabase
    .from('attendance')
    .select('*, profiles:employee_id(nama, jabatan)')
    .order('tanggal', { ascending: false })
    .limit(30)

  if (!isOwner) {
    query = query.eq('employee_id', user.id)
  }

  const { data: history } = await query

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.02em', margin: 0 }}>
          {isOwner ? 'Presensi & Monitoring Staf' : 'Absensi GPS Kedai'}
        </h1>
        <p style={{ color: 'var(--ink-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
          {isOwner
            ? 'Pantau log lokasi & waktu masuk seluruh staf kedai secara akurat.'
            : 'Lakukan check-in & check-out saat Anda tiba di lokasi kedai.'}
        </p>
      </div>

      {/* Area Check-In untuk Karyawan atau Owner */}
      <Card style={{ padding: '2rem 1.25rem', display: 'flex', justifyContent: 'center' }}>
        <CheckInButton todayAttendance={todayAttendance} isHariLibur={isHariLibur} />
      </Card>

      {/* Riwayat Absensi */}
      <div>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '1rem' }}>
          {isOwner ? 'Riwayat Absensi Seluruh Tim' : 'Riwayat Absensi Saya'}
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {!history || history.length === 0 ? (
            <Card style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--ink-muted)' }}>
              Belum ada data riwayat absensi.
            </Card>
          ) : (
            history.map((att) => {
              let badgeVariant = 'default'
              if (att.status === 'hadir') badgeVariant = 'success'
              if (att.status === 'telat') badgeVariant = 'warning'
              if (att.status === 'off') badgeVariant = 'danger'
              if (att.status === 'libur_mingguan') badgeVariant = 'info'

              return (
                <Card key={att.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem' }}>
                  <div>
                    {isOwner && att.profiles && (
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--ink)' }}>{att.profiles.nama}</div>
                    )}
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--ink)' }}>
                      {formatTanggal(att.tanggal)}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--ink-muted)', marginTop: '0.2rem' }}>
                      In: {att.jam_checkin ? formatJam(att.jam_checkin) : '-'} | Out: {att.jam_checkout ? formatJam(att.jam_checkout) : '-'}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.35rem' }}>
                    <Badge variant={badgeVariant}>{att.status}</Badge>
                    {att.potongan_telat > 0 && (
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#B91C1C' }}>
                        Potongan: {formatRupiah(att.potongan_telat)}
                      </span>
                    )}
                  </div>
                </Card>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
