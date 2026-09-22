import { createClient } from '@/lib/supabase/server'
import { getDbClient } from '@/lib/supabase/admin'
import { AbsensiClientView } from '@/components/attendance/AbsensiClientView'
import { ROLES, DEFAULT_SETTINGS } from '@/lib/constants'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AbsensiPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  const isOwner = profile?.role === ROLES.OWNER
  const db = isOwner ? getDbClient(supabase) : supabase

  // Gunakan WIB (UTC+7) agar tanggal dan hari tidak meleset di server UTC
  const now = new Date()
  const wibNow = new Date(now.getTime() + 7 * 60 * 60 * 1000)
  const todayStr = wibNow.toISOString().split('T')[0]
  const todayDay = wibNow.getUTCDay()
  const isHariLibur = todayDay === profile?.hari_libur

  let historyQuery
  let employees = []
  let currentSettings = DEFAULT_SETTINGS

  if (isOwner) {
    // Ambil semua karyawan aktif beserta tanggal_mulai untuk validasi tanggal modal
    const [allProfilesRes, settingsRes] = await Promise.all([
      db.from('profiles').select('id, nama, jabatan, status_aktif, role, tanggal_mulai, hari_libur').order('nama', { ascending: true }),
      db.from('settings').select('*').eq('id', 1).maybeSingle(),
    ])

    employees = (allProfilesRes.data || []).filter(
      (p) => p.role !== 'owner' && p.status_aktif !== false
    )
    currentSettings = settingsRes.data || DEFAULT_SETTINGS

    // Query history mulai dari tanggal bergabung paling awal di antara semua karyawan
    const earliestDate = employees.reduce((earliest, emp) => {
      if (emp.tanggal_mulai && emp.tanggal_mulai < earliest) return emp.tanggal_mulai
      return earliest
    }, todayStr)

    historyQuery = db
      .from('attendance')
      .select('*, profiles:employee_id(nama, jabatan)')
      .gte('tanggal', earliestDate)
      .order('tanggal', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(100)
  } else {
    // Karyawan: tampilkan history mulai dari tanggal bergabung saja
    const sinceDate = profile?.tanggal_mulai || todayStr

    historyQuery = db
      .from('attendance')
      .select('*, profiles:employee_id(nama, jabatan)')
      .eq('employee_id', user.id)
      .gte('tanggal', sinceDate)
      .order('tanggal', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(100)
  }

  const [
    { data: todayAttendance },
    { data: history },
  ] = await Promise.all([
    db
      .from('attendance')
      .select('*')
      .eq('employee_id', user.id)
      .eq('tanggal', todayStr)
      .maybeSingle(),
    historyQuery,
  ])

  return (
    <AbsensiClientView
      isOwner={isOwner}
      todayAttendance={todayAttendance}
      isHariLibur={isHariLibur}
      history={history || []}
      employees={employees}
      settings={currentSettings}
      userProfile={profile}
    />
  )
}


