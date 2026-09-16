'use server'

import { createClient } from '@/lib/supabase/server'
import { getDbClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { isDalamRadius } from '@/lib/utils/geo'
import { tentukanStatusAbsensi } from '@/lib/utils/attendance'
import { DEFAULT_SETTINGS, ATTENDANCE_STATUS } from '@/lib/constants'
import { syncSingleEmployeePayrollByDate } from '@/actions/payroll'

/** Mengembalikan string tanggal YYYY-MM-DD dalam zona waktu WIB (UTC+7) */
function getTodayWIB(now = new Date()) {
  const wib = new Date(now.getTime() + 7 * 60 * 60 * 1000)
  return wib.toISOString().split('T')[0]
}

/**
 * Server action untuk Check-In absensi karyawan
 */
export async function checkInAction(latitude, longitude, fotoCheckin = null, accuracyMeter = null) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Sesi habis, silakan login kembali.' }
  }

  // 1. Ambil profile karyawan dan settings kedai
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  const { data: settings } = await supabase.from('settings').select('*').eq('id', 1).single()

  const currentSettings = settings || DEFAULT_SETTINGS

  // 2. Validasi Geofence GPS
  const { isInside, jarakMeter } = isDalamRadius(
    latitude,
    longitude,
    currentSettings.lokasi_lat,
    currentSettings.lokasi_lng,
    currentSettings.radius_meter
  )

  if (!isInside) {
    return {
      error: `Anda berada di luar radius kedai! Jarak Anda: ${jarakMeter} meter (Maksimal: ${currentSettings.radius_meter} meter).`,
      jarakMeter,
    }
  }

  // 3. Tentukan waktu check in dan hitung status (Hadir/Telat)
  const now = new Date()
  const todayStr = getTodayWIB(now) // Tanggal WIB, bukan UTC

  const { status, menitTelat, potonganTelat } = tentukanStatusAbsensi(
    now,
    profile.hari_libur,
    currentSettings
  )

  // 4. Simpan record absensi
  const { error: insertError } = await supabase.from('attendance').insert({
    employee_id: user.id,
    tanggal: todayStr,
    jam_checkin: now.toISOString(),
    latitude_checkin: latitude,
    longitude_checkin: longitude,
    foto_checkin: fotoCheckin,
    accuracy_meter: accuracyMeter,
    status,
    menit_telat: menitTelat,
    potongan_telat: potonganTelat,
  })

  if (insertError) {
    if (insertError.code === '23505') {
      return { error: 'Anda sudah melakukan check-in untuk hari ini.' }
    }
    return { error: `Gagal mencatat absensi: ${insertError.message}` }
  }

  // Sinkronisasi otomatis ke payroll jika record payroll periode ini sudah ada
  const db = getDbClient(supabase)
  await syncSingleEmployeePayrollByDate(db, user.id, todayStr)

  revalidatePath('/absensi')
  revalidatePath('/dashboard')
  revalidatePath('/payroll')
  revalidatePath('/rekap')
  return { success: true, status, menitTelat, potonganTelat }
}

/**
 * Server action untuk Check-Out absensi karyawan
 */
export async function checkOutAction(latitude, longitude) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Sesi habis, silakan login kembali.' }
  }

  const now = new Date()
  const todayStr = getTodayWIB(now) // Tanggal WIB, bukan UTC

  // Update attendance check-out
  const { data, error } = await supabase
    .from('attendance')
    .update({
      jam_checkout: now.toISOString(),
      latitude_checkout: latitude,
      longitude_checkout: longitude,
    })
    .eq('employee_id', user.id)
    .eq('tanggal', todayStr)
    .select()

  if (error || !data || data.length === 0) {
    return { error: 'Belum ada catatan check-in untuk hari ini atau gagal check-out.' }
  }

  revalidatePath('/absensi')
  revalidatePath('/dashboard')
  return { success: true }
}

/**
 * Server action untuk Manual Absensi Override oleh Owner
 */
export async function manualAttendanceOverrideAction(formData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sesi habis, silakan login kembali.' }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'owner') {
    return { error: 'Hanya Owner yang dapat mengubah data absensi manual.' }
  }

  const db = getDbClient(supabase)

  const employee_id = formData.get('employee_id')
  const tanggal = formData.get('tanggal')
  const status = formData.get('status') || ATTENDANCE_STATUS.HADIR
  const jam_masuk = formData.get('jam_masuk')
  const jam_pulang = formData.get('jam_pulang')
  const menit_telat = parseInt(formData.get('menit_telat') || '0', 10)
  const potongan_telat = parseInt(formData.get('potongan_telat') || '0', 10)
  const catatan = formData.get('catatan') || 'Input manual oleh owner'

  if (!employee_id || !tanggal) {
    return { error: 'Karyawan dan Tanggal wajib diisi.' }
  }

  // Konversi jam masuk & jam pulang ke ISO timestamp dengan offset WIB (+07:00)
  let jamCheckinISO = null
  let jamCheckoutISO = null

  if (jam_masuk && (status === 'hadir' || status === 'telat')) {
    // Format tanggal dan jam ke WIB
    const formattedJamMasuk = jam_masuk.length === 5 ? `${jam_masuk}:00` : jam_masuk
    jamCheckinISO = new Date(`${tanggal}T${formattedJamMasuk}+07:00`).toISOString()
  }

  if (jam_pulang && (status === 'hadir' || status === 'telat')) {
    const formattedJamPulang = jam_pulang.length === 5 ? `${jam_pulang}:00` : jam_pulang
    jamCheckoutISO = new Date(`${tanggal}T${formattedJamPulang}+07:00`).toISOString()
  }

  const { error } = await db.from('attendance').upsert(
    {
      employee_id,
      tanggal,
      status,
      jam_checkin: jamCheckinISO,
      jam_checkout: jamCheckoutISO,
      menit_telat: status === 'telat' ? menit_telat : 0,
      potongan_telat: status === 'telat' ? potongan_telat : 0,
      is_override: true,
      catatan,
    },
    { onConflict: 'employee_id,tanggal' }
  )

  if (error) {
    return { error: `Gagal menyimpan data absensi: ${error.message}` }
  }

  // Sinkronisasi otomatis ke payroll
  await syncSingleEmployeePayrollByDate(db, employee_id, tanggal)

  revalidatePath('/absensi')
  revalidatePath('/dashboard')
  revalidatePath('/rekap')
  revalidatePath('/payroll')
  return { success: true }
}

/**
 * Server action untuk menghapus data absensi (hanya Owner)
 */
export async function deleteAttendanceAction(attendanceId) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sesi habis, silakan login kembali.' }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'owner') {
    return { error: 'Hanya Owner yang dapat menghapus data absensi.' }
  }

  const db = getDbClient(supabase)

  // Ambil data absensi sebelum dihapus untuk mengetahui employee_id dan tanggal
  const { data: existingAtt } = await db
    .from('attendance')
    .select('employee_id, tanggal')
    .eq('id', attendanceId)
    .single()

  const { error } = await db
    .from('attendance')
    .delete()
    .eq('id', attendanceId)

  if (error) {
    return { error: `Gagal menghapus absensi: ${error.message}` }
  }

  if (existingAtt) {
    await syncSingleEmployeePayrollByDate(db, existingAtt.employee_id, existingAtt.tanggal)
  }

  revalidatePath('/absensi')
  revalidatePath('/dashboard')
  revalidatePath('/rekap')
  revalidatePath('/payroll')
  return { success: true }
}


