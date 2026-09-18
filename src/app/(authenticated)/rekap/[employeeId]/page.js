import { createClient } from '@/lib/supabase/server'
import { getDbClient } from '@/lib/supabase/admin'
import { redirect, notFound } from 'next/navigation'
import { RekapKaryawanView } from '@/components/rekap/RekapKaryawanView'
import { getPayrollPeriod, kalkulasiPayrollKaryawan, sanitizePayrollPayload } from '@/lib/utils/payroll'

export const dynamic = 'force-dynamic'
export const revalidate = 0

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
    { data: payrolls },
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
      .order('updated_at', { ascending: false }),
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

  const payroll = payrolls && payrolls.length > 0 ? payrolls[0] : null

  // Bersihkan duplikat jika ada
  if (payrolls && payrolls.length > 1) {
    const duplicateIds = payrolls.slice(1).map((r) => r.id)
    await db.from('payroll').delete().in('id', duplicateIds)
  }

  let activePayroll = payroll
  if (!payroll || payroll.status_pembayaran !== 'sudah_dibayar') {
    const [{ data: bonuses }, { data: activeLoans }] = await Promise.all([
      db
        .from('bonus')
        .select('*')
        .eq('employee_id', employeeId)
        .eq('periode_bulan', currentMonth)
        .eq('periode_tahun', currentYear),
      db
        .from('loans')
        .select('*')
        .eq('employee_id', employeeId)
        .eq('status', 'aktif'),
    ])

    const freshPayroll = kalkulasiPayrollKaryawan({
      employee,
      attendances: attendances || [],
      bonuses: bonuses || [],
      loans: activeLoans || [],
      leaves: [],
      settings: settings || {},
      adjustment: payroll?.adjustment || 0,
      periodeBulan: currentMonth,
      periodeTahun: currentYear,
    })

    const payload = sanitizePayrollPayload({
      ...freshPayroll,
      updated_at: new Date().toISOString(),
    })

    if (payroll) {
      await db.from('payroll').update(payload).eq('id', payroll.id)
      activePayroll = { ...payroll, ...freshPayroll }
    } else {
      const { data: inserted } = await db.from('payroll').upsert(
        {
          ...payload,
          status: 'draft',
          status_pembayaran: 'belum_dibayar',
          tanggal_dibayar: null,
          keterangan_adjustment: null,
        },
        { onConflict: 'employee_id,periode_bulan,periode_tahun' }
      ).select().single()
      activePayroll = inserted || {
        ...freshPayroll,
        status_pembayaran: 'belum_dibayar',
        tanggal_dibayar: null,
        keterangan_adjustment: null,
      }
    }
  }

  return (
    <RekapKaryawanView
      employee={employee}
      payroll={activePayroll}
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
