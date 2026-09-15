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

  // Ambil data absensi & data pendukung secara paralel
  let historyQuery = supabase
    .from('attendance')
    .select('*, profiles:employee_id(nama, jabatan)')
    .order('tanggal', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(60)

  if (!isOwner) {
    historyQuery = historyQuery.eq('employee_id', user.id)
  }

  const [
    { data: todayAttendance },
    { data: history },
    allProfilesRes,
    settingsRes,
  ] = await Promise.all([
    supabase
      .from('attendance')
      .select('*')
      .eq('employee_id', user.id)
      .eq('tanggal', todayStr)
      .maybeSingle(),
    historyQuery,
    isOwner
      ? supabase.from('profiles').select('id, nama, jabatan, status_aktif, role').order('nama', { ascending: true })
      : Promise.resolve({ data: [] }),
    isOwner
      ? supabase.from('settings').select('*').eq('id', 1).maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  const employees = (allProfilesRes.data || []).filter(
    (p) => p.role !== 'owner' && p.status_aktif !== false
  )
  const currentSettings = settingsRes.data || DEFAULT_SETTINGS

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

