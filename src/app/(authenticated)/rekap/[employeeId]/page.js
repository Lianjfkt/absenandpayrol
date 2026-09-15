import { createClient } from '@/lib/supabase/server'
import { getDbClient } from '@/lib/supabase/admin'
import { redirect, notFound } from 'next/navigation'
import { RekapKaryawanView } from '@/components/rekap/RekapKaryawanView'
import { getPayrollPeriod } from '@/lib/utils/payroll'

export default async function RekapKaryawanPage({ params, searchParams }) {
  const { employeeId } = await params
  const sp = await searchParams

  const now = new Date()
  const currentMonth = parseInt(sp?.bulan || (now.getMonth() + 1).toString(), 10)
  const currentYear = parseInt(sp?.tahun || now.getFullYear().toString(), 10)

  const supabase = await createClient()

  // Guard: hanya owner
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: ownerProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (ownerProfile?.role !== 'owner') redirect('/dashboard')

  const db = getDbClient(supabase)

  // Ambil profil dulu untuk menghitung range tanggal periode berdasarkan tanggal bergabung
  const { data: employee } = await db.from('profiles').select('*').eq('id', employeeId).single()
  if (!employee || employee.role === 'owner') notFound()

  const { startDate, endDate } = getPayrollPeriod(employee, currentMonth, currentYear)

  const [
    { data: payroll },
    { data: attendances },
    { data: allEmployees },
    { data: settings },
  ] = await Promise.all([
    db
      .from('payroll')
      .select('*')
      .eq('employee_id', employeeId)
      .eq('periode_bulan', currentMonth)
      .eq('periode_tahun', currentYear)
      .maybeSingle(),
    db
      .from('attendance')
      .select('*')
      .eq('employee_id', employeeId)
      .gte('tanggal', startDate)
      .lte('tanggal', endDate)
      .order('tanggal', { ascending: true }),
    db
      .from('profiles')
      .select('id, nama, jabatan')
      .neq('role', 'owner')
      .eq('status_aktif', true)
      .order('nama', { ascending: true }),
    db.from('settings').select('*').eq('id', 1).maybeSingle(),
  ])

  return (
    <RekapKaryawanView
      employee={employee}
      payroll={payroll}
      attendances={attendances || []}
      allEmployees={allEmployees || []}
      settings={settings || {}}
      currentMonth={currentMonth}
      currentYear={currentYear}
      periodStart={startDate}
      periodEnd={endDate}
    />
  )
}
