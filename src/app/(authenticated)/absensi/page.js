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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>
          {isOwner ? 'Monitoring & Absensi' : 'Absensi Harian GPS'}
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          {isOwner
            ? 'Pantau kehadiran seluruh staf kedai secara realtime.'
            : 'Lakukan check-in & check-out saat Anda berada di kedai.'}
        </p>
      </div>

      {/* Area Check-In untuk Karyawan atau Owner */}
      <Card variant="glass" style={{ padding: '2rem 1rem', display: 'flex', justifyContent: 'center' }}>
        <CheckInButton todayAttendance={todayAttendance} isHariLibur={isHariLibur} />
      </Card>

      {/* Riwayat Absensi */}
      <div>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.75rem' }}>
          {isOwner ? 'Riwayat Absensi Seluruh Karyawan' : 'Riwayat Absensi Saya'}
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {history?.length === 0 ? (
            <Card style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              Belum ada riwayat absensi.
            </Card>
          ) : (
            history?.map((att) => {
              let badgeVariant = 'default'
              if (att.status === 'hadir') badgeVariant = 'success'
              if (att.status === 'telat') badgeVariant = 'warning'
              if (att.status === 'off') badgeVariant = 'danger'
              if (att.status === 'libur_mingguan') badgeVariant = 'info'

              return (
                <Card key={att.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    {isOwner && att.profiles && (
                      <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{att.profiles.nama}</div>
                    )}
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {formatTanggal(att.tanggal)}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
                      In: {att.jam_checkin ? formatJam(att.jam_checkin) : '-'} | Out: {att.jam_checkout ? formatJam(att.jam_checkout) : '-'}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.3rem' }}>
                    <Badge variant={badgeVariant}>{att.status}</Badge>
                    {att.potongan_telat > 0 && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--danger)' }}>
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
