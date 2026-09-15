'use server'

import { createClient } from '@/lib/supabase/server'
import { getDbClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { kalkulasiPayrollKaryawan, getPayrollPeriod } from '@/lib/utils/payroll'
import { DEFAULT_SETTINGS, ATTENDANCE_STATUS } from '@/lib/constants'

/**
 * Server action: Generate Payroll Otomatis untuk Semua Karyawan Aktif
 */
export async function generatePayrollPeriodAction(periodeBulan, periodeTahun) {
  const supabase = await createClient()

  // 1. Verifikasi Owner
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sesi habis, silakan login kembali.' }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'owner') {
    return { error: 'Hanya Owner yang dapat men-generate payroll.' }
  }

  const db = getDbClient(supabase)

  // 2. Ambil setting kedai
  const { data: settings } = await db.from('settings').select('*').eq('id', 1).single()
  const currentSettings = settings || DEFAULT_SETTINGS

  // 3. Ambil semua karyawan aktif (role non-owner dan status_aktif bukan false)
  const { data: allProfiles, error: empErr } = await db
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: true })

  if (empErr || !allProfiles) {
    return { error: 'Gagal mengambil data karyawan: ' + (empErr?.message || 'Database error') }
  }

  const employees = allProfiles.filter(
    (p) => p.role !== 'owner' && p.status_aktif !== false
  )

  const inactiveEmployees = allProfiles.filter(
    (p) => p.role === 'owner' || p.status_aktif === false
  )

  // Bersihkan draft payroll untuk karyawan yang sudah dinonaktifkan
  if (inactiveEmployees.length > 0) {
    const inactiveIds = inactiveEmployees.map((e) => e.id)
    await db
      .from('payroll')
      .delete()
      .in('employee_id', inactiveIds)
      .eq('periode_bulan', periodeBulan)
      .eq('periode_tahun', periodeTahun)
      .eq('status_pembayaran', 'belum_dibayar')
  }

  if (employees.length === 0) {
    return { error: 'Tidak ada karyawan aktif yang ditemukan.' }
  }

  // 4. Hitung payroll per karyawan secara paralel dan tangguh
  await Promise.all(
    employees.map(async (emp) => {
      try {
        // Hitung range tanggal periode berdasarkan tanggal bergabung karyawan
        const { startDate: empStartDate, endDate: empEndDate } = getPayrollPeriod(emp, periodeBulan, periodeTahun)

        const [{ data: attendances }, { data: bonuses }, { data: activeLoans }, { data: existingPayroll }] = await Promise.all([
          db
            .from('attendance')
            .select('*')
            .eq('employee_id', emp.id)
            .gte('tanggal', empStartDate)
            .lte('tanggal', empEndDate),
          db
            .from('bonus')
            .select('*')
            .eq('employee_id', emp.id)
            .gte('tanggal', empStartDate)
            .lte('tanggal', empEndDate),
          db
            .from('loans')
            .select('*')
            .eq('employee_id', emp.id)
            .eq('status', 'aktif'),
          db
            .from('payroll')
            .select('adjustment, keterangan_adjustment, status_pembayaran, tanggal_dibayar')
            .eq('employee_id', emp.id)
            .eq('periode_bulan', periodeBulan)
            .eq('periode_tahun', periodeTahun)
            .maybeSingle(),
        ])

        const adj = existingPayroll?.adjustment || 0

        const calcResult = kalkulasiPayrollKaryawan({
          employee: emp,
          attendances: attendances || [],
          bonuses: bonuses || [],
          loans: activeLoans || [],
          leaves: [],
          settings: currentSettings,
          adjustment: adj,
          periodeBulan,
          periodeTahun,
        })

        await db.from('payroll').upsert(
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
      } catch (err) {
        console.error(`Error calculating payroll for employee ${emp.nama || emp.id}:`, err)
      }
    })
  )

  revalidatePath('/payroll')
  revalidatePath('/rekap')
  return { success: true }
}

/**
 * Server action: Update Status Pembayaran Gaji & Auto-Deduct Kasbon Karyawan
 */
export async function updatePaymentStatusAction(payrollId, statusPembayaran, tanggalDibayar = null) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sesi habis, silakan login kembali.' }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'owner') {
    return { error: 'Hanya Owner yang dapat mengubah status pembayaran.' }
  }

  const db = getDbClient(supabase)

  // Ambil record payroll saat ini
  const { data: currentPayroll } = await db
    .from('payroll')
    .select('*')
    .eq('id', payrollId)
    .single()

  if (!currentPayroll) {
    return { error: 'Data payroll tidak ditemukan.' }
  }

  const prevStatus = currentPayroll.status_pembayaran

  // 1. Update status pembayaran payroll
  const { error } = await db
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

  // 2. Otomatisasi Pemotongan Saldo Kasbon jika berubah menjadi 'sudah_dibayar'
  if (prevStatus !== 'sudah_dibayar' && statusPembayaran === 'sudah_dibayar') {
    const { data: activeLoans } = await db
      .from('loans')
      .select('*')
      .eq('employee_id', currentPayroll.employee_id)
      .eq('status', 'aktif')
      .order('created_at', { ascending: true })

    if (activeLoans && activeLoans.length > 0 && currentPayroll.total_potongan_kasbon > 0) {
      let sisaPotongan = currentPayroll.total_potongan_kasbon
      for (const loan of activeLoans) {
        if (sisaPotongan <= 0) break
        const deduction = Math.min(loan.sisa_pinjaman, loan.cicilan_per_bulan, sisaPotongan)
        const newSisa = Math.max(0, loan.sisa_pinjaman - deduction)
        const newStatus = newSisa === 0 ? 'lunas' : 'aktif'

        await db
          .from('loans')
          .update({
            sisa_pinjaman: newSisa,
            status: newStatus,
            updated_at: new Date().toISOString(),
          })
          .eq('id', loan.id)

        sisaPotongan -= deduction
      }
    }
  }

  // 3. Rollback pengembalian saldo kasbon jika diubah kembali ke 'belum_dibayar'
  else if (prevStatus === 'sudah_dibayar' && statusPembayaran === 'belum_dibayar') {
    const { data: empLoans } = await db
      .from('loans')
      .select('*')
      .eq('employee_id', currentPayroll.employee_id)
      .order('created_at', { ascending: false })

    if (empLoans && empLoans.length > 0 && currentPayroll.total_potongan_kasbon > 0) {
      let sisaKembali = currentPayroll.total_potongan_kasbon
      for (const loan of empLoans) {
        if (sisaKembali <= 0) break
        const maxRestore = loan.nominal_pinjaman - loan.sisa_pinjaman
        const toRestore = Math.min(maxRestore, sisaKembali)
        if (toRestore > 0) {
          const newSisa = loan.sisa_pinjaman + toRestore
          await db
            .from('loans')
            .update({
              sisa_pinjaman: newSisa,
              status: 'aktif',
              updated_at: new Date().toISOString(),
            })
            .eq('id', loan.id)

          sisaKembali -= toRestore
        }
      }
    }
  }

  revalidatePath('/payroll')
  revalidatePath('/kasbon')
  revalidatePath('/rekap')
  return { success: true }
}

/**
 * Server action: Update Adjustment Manual Payroll
 */
export async function updateAdjustmentAction(payrollId, adjustment, keterangan) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sesi habis, silakan login kembali.' }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'owner') {
    return { error: 'Hanya Owner yang dapat mengubah adjustment.' }
  }

  const db = getDbClient(supabase)

  const { data: current } = await db.from('payroll').select('*').eq('id', payrollId).single()
  if (!current) return { error: 'Data payroll tidak ditemukan.' }

  const adjNum = parseInt(adjustment || '0', 10)
  // Hitung ulang total gaji dengan semua komponen termasuk potongan kasbon
  const totalGajiBaru = Math.max(
    0,
    current.gaji_pokok +
      current.total_bonus_libur +
      current.total_bonus_manual -
      current.total_potongan_telat -
      current.total_potongan_off -
      (current.total_potongan_kasbon || 0) +
      adjNum
  )

  const { error } = await db
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
