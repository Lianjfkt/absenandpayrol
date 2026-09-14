import { createClient } from '@/lib/supabase/server'
import { AbsensiClientView } from '@/components/attendance/AbsensiClientView'
import { ROLES, DEFAULT_SETTINGS } from '@/lib/constants'

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

  // Ambil histori riwayat absensi
  let query = supabase
    .from('attendance')
    .select('*, profiles:employee_id(nama, jabatan)')
    .order('tanggal', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(60)

  if (!isOwner) {
    query = query.eq('employee_id', user.id)
  }

  const { data: history } = await query

  // Jika owner, ambil data karyawan aktif & settings kedai untuk modal manual
  let employees = []
  let currentSettings = DEFAULT_SETTINGS

  if (isOwner) {
    const { data: empData } = await supabase
      .from('profiles')
      .select('id, nama, jabatan')
      .eq('role', 'karyawan')
      .eq('status_aktif', true)
      .order('nama', { ascending: true })

    const { data: setRow } = await supabase
      .from('settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle()

    employees = empData || []
    if (setRow) currentSettings = setRow
  }

  return (
    <AbsensiClientView
      isOwner={isOwner}
      todayAttendance={todayAttendance}
      isHariLibur={isHariLibur}
      history={history || []}
      employees={employees}
      settings={currentSettings}
    />
  )
}

