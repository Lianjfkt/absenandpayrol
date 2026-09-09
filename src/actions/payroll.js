'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { kalkulasiPayrollKaryawan } from '@/lib/utils/payroll'
import { DEFAULT_SETTINGS, ATTENDANCE_STATUS } from '@/lib/constants'

/**
 * Server action: Generate Payroll Otomatis untuk Semua Karyawan Aktif
 */
export async function generatePayrollPeriodAction(periodeBulan, periodeTahun) {
  const supabase = await createClient()

  // 1. Verifikasi Owner
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'owner') {
    return { error: 'Hanya Owner yang dapat men-generate payroll.' }
  }

  // 2. Ambil setting kedai
  const { data: settings } = await supabase.from('settings').select('*').eq('id', 1).single()
  const currentSettings = settings || DEFAULT_SETTINGS

  // 3. Ambil semua karyawan aktif
  const { data: employees } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'karyawan')
    .eq('status_aktif', true)

  if (!employees || employees.length === 0) {
    return { error: 'Tidak ada karyawan aktif yang ditemukan.' }
  }

  // Tanggal awal dan akhir bulan periode
  const startDateStr = `${periodeTahun}-${String(periodeBulan).padStart(2, '0')}-01`
  const lastDay = new Date(periodeTahun, periodeBulan, 0).getDate()
  const endDateStr = `${periodeTahun}-${String(periodeBulan).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

  // 4. Hitung payroll per karyawan
  for (const emp of employees) {
    // Ambil data attendance bulan ini
    const { data: attendances } = await supabase
      .from('attendance')
      .select('*')
      .eq('employee_id', emp.id)
      .gte('tanggal', startDateStr)
      .lte('tanggal', endDateStr)

    // Ambil bonus manual bulan ini
    const { data: bonuses } = await supabase
      .from('bonus')
      .select('*')
      .eq('employee_id', emp.id)
      .eq('periode_bulan', periodeBulan)
      .eq('periode_tahun', periodeTahun)

    // Cek apakah ada record payroll draft/adjustment lama
    const { data: existingPayroll } = await supabase
      .from('payroll')
      .select('adjustment, keterangan_adjustment, status_pembayaran, tanggal_dibayar')
      .eq('employee_id', emp.id)
      .eq('periode_bulan', periodeBulan)
      .eq('periode_tahun', periodeTahun)
      .maybeSingle()

    const adj = existingPayroll?.adjustment || 0

    const calcResult = kalkulasiPayrollKaryawan({
      employee: emp,
      attendances: attendances || [],
      bonuses: bonuses || [],
      settings: currentSettings,
      adjustment: adj,
      periodeBulan,
      periodeTahun,
    })

    await supabase.from('payroll').upsert(
      {
        ...calcResult,
        status: 'draft',
        status_pembayaran: existingPayroll?.status_pembayaran || 'belum_dibayar',
        tanggal_dibayar: existingPayroll?.tanggal_dibayar || null,
        keterangan_adjustment: existingPayroll?.keterangan_adjustment || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'employee_id,periode_bulan,periode_tahun' }
    )
  }

  revalidatePath('/payroll')
  revalidatePath('/rekap')
  return { success: true }
}

/**
 * Server action: Update Status Pembayaran Gaji
 */
export async function updatePaymentStatusAction(payrollId, statusPembayaran, tanggalDibayar = null) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'owner') {
    return { error: 'Hanya Owner yang dapat mengubah status pembayaran.' }
  }

  const { error } = await supabase
    .from('payroll')
    .update({
      status_pembayaran: statusPembayaran,
      tanggal_dibayar: statusPembayaran === 'sudah_dibayar' ? (tanggalDibayar || new Date().toISOString().split('T')[0]) : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', payrollId)

  if (error) {
    return { error: `Gagal memperbarui status pembayaran: ${error.message}` }
  }

  revalidatePath('/payroll')
  return { success: true }
}

/**
 * Server action: Update Adjustment Manual Payroll
 */
export async function updateAdjustmentAction(payrollId, adjustment, keterangan) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'owner') {
    return { error: 'Hanya Owner yang dapat mengubah adjustment.' }
  }

  const { data: current } = await supabase.from('payroll').select('*').eq('id', payrollId).single()
  if (!current) return { error: 'Data payroll tidak ditemukan.' }

  const adjNum = parseInt(adjustment || '0', 10)
  const totalGajiBaru = Math.max(
    0,
    current.gaji_pokok +
      current.total_bonus_libur +
      current.total_bonus_manual -
      current.total_potongan_telat -
      current.total_potongan_off +
      adjNum
  )

  const { error } = await supabase
    .from('payroll')
    .update({
      adjustment: adjNum,
      keterangan_adjustment: keterangan,
      total_gaji: totalGajiBaru,
      updated_at: new Date().toISOString(),
    })
    .eq('id', payrollId)

  if (error) {
    return { error: `Gagal menyimpan adjustment: ${error.message}` }
  }

  revalidatePath('/payroll')
  return { success: true }
}
