'use server'

import { createClient } from '@/lib/supabase/server'
import { getDbClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { kalkulasiPayrollKaryawan, getPayrollPeriod, getPayrollPeriodForDate, sanitizePayrollPayload } from '@/lib/utils/payroll'
import { DEFAULT_SETTINGS, ATTENDANCE_STATUS } from '@/lib/constants'

/**
 * Helper: Sinkronisasi ulang record payroll satu karyawan secara real-time
 */
export async function syncSingleEmployeePayroll(db, employeeId, periodeBulan, periodeTahun, specificPayrollId = null) {
  try {
    const { data: emp } = await db.from('profiles').select('*').eq('id', employeeId).single()
    if (!emp || emp.role === 'owner' || emp.status_aktif === false) return

    const { data: existingPayrolls } = await db
      .from('payroll')
      .select('id, adjustment, keterangan_adjustment, status_pembayaran, tanggal_dibayar')
      .eq('employee_id', employeeId)
      .eq('periode_bulan', periodeBulan)
      .eq('periode_tahun', periodeTahun)
      .order('updated_at', { ascending: false })

    const existingPayroll = specificPayrollId
      ? existingPayrolls?.find((p) => p.id === specificPayrollId) || existingPayrolls?.[0]
      : existingPayrolls?.[0]

    // Bersihkan record duplikat jika ada
    if (existingPayrolls && existingPayrolls.length > 1) {
      const keepId = existingPayroll?.id || existingPayrolls[0].id
      const duplicateIds = existingPayrolls.filter((p) => p.id !== keepId).map((p) => p.id)
      if (duplicateIds.length > 0) {
        await db.from('payroll').delete().in('id', duplicateIds)
      }
    }

    // Jangan timpa otomatis jika sudah berstatus 'sudah_dibayar'
    if (existingPayroll && existingPayroll.status_pembayaran === 'sudah_dibayar') {
      return
    }

    const { startDate: empStartDate, endDate: empEndDate } = getPayrollPeriod(emp, periodeBulan, periodeTahun)
    const { data: settings } = await db.from('settings').select('*').eq('id', 1).maybeSingle()
    const currentSettings = settings || DEFAULT_SETTINGS

    const [{ data: attendances }, { data: bonuses }, { data: activeLoans }] = await Promise.all([
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
        .eq('periode_bulan', periodeBulan)
        .eq('periode_tahun', periodeTahun),
      db
        .from('loans')
        .select('*')
        .eq('employee_id', emp.id)
        .eq('status', 'aktif'),
    ])

    const adj = existingPayroll?.adjustment || 0

    const calcResult = kalkulasiPayrollKaryawan({
      employee: emp,
      attendances: attendances || [],
      bonuses: bonuses || [],
      loans: activeLoans || [],
      settings: currentSettings,
      adjustment: adj,
      periodeBulan,
      periodeTahun,
    })

    const payload = sanitizePayrollPayload({
      ...calcResult,
      updated_at: new Date().toISOString(),
    })

    if (existingPayroll) {
      const { error: updErr } = await db.from('payroll').update(payload).eq('id', existingPayroll.id)
      if (updErr) console.error('Error updating payroll:', updErr)
    } else {
      const { error: insErr } = await db.from('payroll').upsert(
        {
          ...payload,
          status: 'draft',
          status_pembayaran: 'belum_dibayar',
          tanggal_dibayar: null,
          keterangan_adjustment: null,
        },
        { onConflict: 'employee_id,periode_bulan,periode_tahun' }
      )
      if (insErr) console.error('Error inserting payroll:', insErr)
    }
  } catch (err) {
    console.error('Error in syncSingleEmployeePayroll:', err)
  }
}

/**
 * Helper: Sinkronisasi seluruh payroll karyawan aktif untuk satu periode secara real-time
 */
export async function syncAllActivePayrolls(db, periodeBulan, periodeTahun) {
  try {
    const { data: allProfiles } = await db
      .from('profiles')
      .select('*')
      .neq('role', 'owner')
      .eq('status_aktif', true)

    if (!allProfiles || allProfiles.length === 0) return

    await Promise.all(
      allProfiles.map((emp) => syncSingleEmployeePayroll(db, emp.id, periodeBulan, periodeTahun))
    )
  } catch (err) {
    console.error('Error in syncAllActivePayrolls:', err)
  }
}

/**
 * Helper: Menghitung payroll secara LIVE real-time dan otomatis menyinkronkan ke database
 * sehingga halaman Payroll dan Rekap SELALU menampilkan kalkulasi terkini tanpa perlu klik generate manual.
 */
export async function getLivePayrollList(db, currentMonth, currentYear) {
  // Tentukan tanggal hari ini dalam WIB
  const wibNow = new Date(new Date().getTime() + 7 * 60 * 60 * 1000)
  const todayStr = wibNow.toISOString().split('T')[0]
  const todayMonth = wibNow.getUTCMonth() + 1
  const todayYear = wibNow.getUTCFullYear()
  // Jika user melihat bulan berjalan → gunakan periode aktif tiap karyawan
  // (bukan paksa semua pakai range kalender currentMonth yang sama)
  const isCurrentPeriod = currentMonth === todayMonth && currentYear === todayYear

  const [{ data: allProfiles }, { data: settings }] = await Promise.all([
    db.from('profiles').select('*').order('created_at', { ascending: true }),
    db.from('settings').select('*').eq('id', 1).maybeSingle(),
  ])

  const currentSettings = settings || DEFAULT_SETTINGS
  const employees = (allProfiles || []).filter(
    (p) => p.role !== 'owner' && p.status_aktif !== false
  )

  if (employees.length === 0) {
    return { payrollList: [], settings: currentSettings }
  }

  const payrollList = await Promise.all(
    employees.map(async (emp) => {
      // Tentukan periode yang relevan untuk karyawan ini
      let activeBulan = currentMonth
      let activeTahun = currentYear

      if (isCurrentPeriod) {
        // Gunakan periode aktif berdasarkan tanggal hari ini (WIB)
        const { periodeBulan, periodeTahun } = getPayrollPeriodForDate(emp, todayStr)
        activeBulan = periodeBulan
        activeTahun = periodeTahun
      }

      const { startDate: empStartDate, endDate: empEndDate } = getPayrollPeriod(emp, activeBulan, activeTahun)

      const [
        { data: attendances },
        { data: bonuses },
        { data: activeLoans },
        { data: existingPayrolls }
      ] = await Promise.all([
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
          .eq('periode_bulan', activeBulan)
          .eq('periode_tahun', activeTahun),
        db
          .from('loans')
          .select('*')
          .eq('employee_id', emp.id)
          .eq('status', 'aktif'),
        db
          .from('payroll')
          .select('*')
          .eq('employee_id', emp.id)
          .eq('periode_bulan', activeBulan)
          .eq('periode_tahun', activeTahun)
          .order('updated_at', { ascending: false }),
      ])

      const existingPayroll = existingPayrolls && existingPayrolls.length > 0 ? existingPayrolls[0] : null

      // Bersihkan record duplikat jika ada
      if (existingPayrolls && existingPayrolls.length > 1) {
        const duplicateIds = existingPayrolls.slice(1).map((r) => r.id)
        await db.from('payroll').delete().in('id', duplicateIds)
      }

      // Jika sudah dibayar, gunakan snapshot data yang sudah dibayar
      if (existingPayroll && existingPayroll.status_pembayaran === 'sudah_dibayar') {
        return {
          ...existingPayroll,
          profiles: emp,
        }
      }

      const adj = existingPayroll?.adjustment || 0
      const calcResult = kalkulasiPayrollKaryawan({
        employee: emp,
        attendances: attendances || [],
        bonuses: bonuses || [],
        loans: activeLoans || [],
        settings: currentSettings,
        adjustment: adj,
        periodeBulan: activeBulan,
        periodeTahun: activeTahun,
      })

      let payrollId = existingPayroll?.id
      const payload = sanitizePayrollPayload({
        ...calcResult,
        updated_at: new Date().toISOString(),
      })

      // Upsert ke database secara otomatis agar record payroll selalu sinkron
      try {
        if (existingPayroll) {
          const { error: updErr } = await db
            .from('payroll')
            .update(payload)
            .eq('id', existingPayroll.id)
          if (updErr) console.error('Error auto-syncing update payroll record:', updErr)
        } else {
          const { data: newPayroll, error: insErr } = await db
            .from('payroll')
            .upsert(
              {
                ...payload,
                status: 'draft',
                status_pembayaran: 'belum_dibayar',
                tanggal_dibayar: null,
                keterangan_adjustment: null,
              },
              { onConflict: 'employee_id,periode_bulan,periode_tahun' }
            )
            .select('id')
            .single()
          if (insErr) console.error('Error auto-syncing upsert payroll record:', insErr)
          payrollId = newPayroll?.id
        }
      } catch (e) {
        console.error('Error auto-syncing payroll record:', e)
      }

      return {
        ...calcResult,
        id: payrollId || existingPayroll?.id || `temp-${emp.id}`,
        status_pembayaran: existingPayroll?.status_pembayaran || 'belum_dibayar',
        tanggal_dibayar: existingPayroll?.tanggal_dibayar || null,
        keterangan_adjustment: existingPayroll?.keterangan_adjustment || null,
        profiles: emp,
      }
    })
  )

  return { payrollList, settings: currentSettings }
}


/**
 * Helper: Sinkronisasi ulang payroll karyawan berdasarkan tanggal absensi
 */
export async function syncSingleEmployeePayrollByDate(db, employeeId, dateStr) {
  try {
    const { data: emp } = await db.from('profiles').select('*').eq('id', employeeId).single()
    if (!emp || emp.role === 'owner') return
    const { periodeBulan, periodeTahun } = getPayrollPeriodForDate(emp, dateStr)
    await syncSingleEmployeePayroll(db, employeeId, periodeBulan, periodeTahun)
  } catch (err) {
    console.error('Error in syncSingleEmployeePayrollByDate:', err)
  }
}

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

        const [{ data: attendances }, { data: bonuses }, { data: activeLoans }, { data: existingPayrolls }] = await Promise.all([
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
            .eq('periode_bulan', periodeBulan)
            .eq('periode_tahun', periodeTahun),
          db
            .from('loans')
            .select('*')
            .eq('employee_id', emp.id)
            .eq('status', 'aktif'),
          db
            .from('payroll')
            .select('id, adjustment, keterangan_adjustment, status_pembayaran, tanggal_dibayar')
            .eq('employee_id', emp.id)
            .eq('periode_bulan', periodeBulan)
            .eq('periode_tahun', periodeTahun)
            .order('updated_at', { ascending: false }),
        ])

        const existingPayroll = existingPayrolls && existingPayrolls.length > 0 ? existingPayrolls[0] : null

        // Bersihkan duplikat jika ada
        if (existingPayrolls && existingPayrolls.length > 1) {
          const duplicateIds = existingPayrolls.slice(1).map((r) => r.id)
          await db.from('payroll').delete().in('id', duplicateIds)
        }

        const adj = existingPayroll?.adjustment || 0

        const calcResult = kalkulasiPayrollKaryawan({
          employee: emp,
          attendances: attendances || [],
          bonuses: bonuses || [],
          loans: activeLoans || [],
          settings: currentSettings,
          adjustment: adj,
          periodeBulan,
          periodeTahun,
        })

        const payload = sanitizePayrollPayload({
          ...calcResult,
          status: 'draft',
          status_pembayaran: existingPayroll?.status_pembayaran || 'belum_dibayar',
          tanggal_dibayar: existingPayroll?.tanggal_dibayar || null,
          keterangan_adjustment: existingPayroll?.keterangan_adjustment || null,
          updated_at: new Date().toISOString(),
        })

        const { error: upsertErr } = await db.from('payroll').upsert(
          payload,
          { onConflict: 'employee_id,periode_bulan,periode_tahun' }
        )
        if (upsertErr) console.error(`Error upserting payroll for ${emp.nama}:`, upsertErr)
      } catch (err) {
        console.error(`Error calculating payroll for employee ${emp.nama || emp.id}:`, err)
      }
    })
  )

  revalidatePath('/payroll')
  revalidatePath('/rekap')
  revalidatePath('/slip-gaji')
  revalidatePath('/', 'layout')
  return { success: true }
}

/**
 * Server action: Update Status Pembayaran Gaji & Auto-Deduct Kasbon Karyawan
 */
export async function updatePaymentStatusAction(payrollId, statusPembayaran, tanggalDibayar = null, extraContext = {}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sesi habis, silakan login kembali.' }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'owner') {
    return { error: 'Hanya Owner yang dapat mengubah status pembayaran.' }
  }

  const db = getDbClient(supabase)

  let targetId = payrollId
  let currentPayroll = null

  // 1. Cari by ID jika payrollId valid UUID
  if (targetId && !targetId.startsWith('temp-')) {
    const { data } = await db.from('payroll').select('*').eq('id', targetId).maybeSingle()
    currentPayroll = data
  }

  // 2. Fallback: jika tidak ditemukan by ID, cari by employee_id + periode
  const empId = extraContext.employeeId || (payrollId?.startsWith('temp-') ? payrollId.replace('temp-', '') : null)
  const pBulan = extraContext.periodeBulan
  const pTahun = extraContext.periodeTahun

  if (!currentPayroll && empId && pBulan && pTahun) {
    const { data: list } = await db
      .from('payroll')
      .select('*')
      .eq('employee_id', empId)
      .eq('periode_bulan', pBulan)
      .eq('periode_tahun', pTahun)
      .order('updated_at', { ascending: false })

    if (list && list.length > 0) {
      currentPayroll = list[0]
      targetId = currentPayroll.id
    }
  }

  // 3. Jika record belum ada sama sekali di DB, lakukan sync terlebih dahulu
  if (!currentPayroll && empId && pBulan && pTahun) {
    await syncSingleEmployeePayroll(db, empId, pBulan, pTahun)
    const { data: freshList } = await db
      .from('payroll')
      .select('*')
      .eq('employee_id', empId)
      .eq('periode_bulan', pBulan)
      .eq('periode_tahun', pTahun)
      .order('updated_at', { ascending: false })
    if (freshList && freshList.length > 0) {
      currentPayroll = freshList[0]
      targetId = currentPayroll.id
    }
  }

  if (!currentPayroll || !targetId) {
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
    .eq('id', targetId)

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
  revalidatePath(`/payroll/${targetId}`)
  revalidatePath('/kasbon')
  revalidatePath('/rekap')
  revalidatePath('/slip-gaji')
  revalidatePath('/', 'layout')
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

  const { data: current } = await db.from('payroll').select('*').eq('id', payrollId).maybeSingle()
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
  revalidatePath(`/payroll/${payrollId}`)
  revalidatePath('/rekap')
  revalidatePath('/slip-gaji')
  revalidatePath('/', 'layout')
  return { success: true }
}
