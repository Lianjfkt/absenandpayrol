'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { isDalamRadius } from '@/lib/utils/geo'
import { tentukanStatusAbsensi } from '@/lib/utils/attendance'
import { DEFAULT_SETTINGS, ATTENDANCE_STATUS } from '@/lib/constants'

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
  const todayStr = now.toISOString().split('T')[0]

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

  revalidatePath('/absensi')
  revalidatePath('/dashboard')
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
  const todayStr = now.toISOString().split('T')[0]

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
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'owner') {
    return { error: 'Hanya Owner yang dapat mengubah data absensi manual.' }
  }

  const employee_id = formData.get('employee_id')
  const tanggal = formData.get('tanggal')
  const status = formData.get('status')
  const potongan_telat = parseInt(formData.get('potongan_telat') || '0', 10)
  const catatan = formData.get('catatan') || 'Manual override oleh owner'

  const { error } = await supabase.from('attendance').upsert(
    {
      employee_id,
      tanggal,
      status,
      potongan_telat,
      is_override: true,
      catatan,
    },
    { onConflict: 'employee_id,tanggal' }
  )

  if (error) {
    return { error: `Gagal memperbarui absensi: ${error.message}` }
  }

  revalidatePath('/absensi')
  revalidatePath('/rekap')
  return { success: true }
}
