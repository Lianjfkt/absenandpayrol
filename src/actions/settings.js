'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateSettingsAction(formData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'owner') {
    return { error: 'Hanya Owner yang dapat mengubah pengaturan kedai.' }
  }

  const nama_kedai = formData.get('nama_kedai')
  const lokasi_lat = parseFloat(formData.get('lokasi_lat'))
  const lokasi_lng = parseFloat(formData.get('lokasi_lng'))
  const radius_meter = parseInt(formData.get('radius_meter') || '10', 10)
  const jam_masuk = formData.get('jam_masuk')
  const jam_pulang = formData.get('jam_pulang')
  const toleransi_telat_menit = parseInt(formData.get('toleransi_telat_menit') || '5', 10)
  const potongan_off = parseInt(formData.get('potongan_off') || '50000', 10)
  const bonus_masuk_libur = parseInt(formData.get('bonus_masuk_libur') || '50000', 10)
  const tier1_rate = parseInt(formData.get('tier1_rate') || '1000', 10)
  const tier2_rate = parseInt(formData.get('tier2_rate') || '2000', 10)
  const tier3_flat = parseInt(formData.get('tier3_flat') || '50000', 10)

  const { error } = await supabase
    .from('settings')
    .upsert({
      id: 1,
      nama_kedai,
      lokasi_lat,
      lokasi_lng,
      radius_meter,
      jam_masuk,
      jam_pulang,
      toleransi_telat_menit,
      potongan_off,
      bonus_masuk_libur,
      tier1_rate,
      tier2_rate,
      tier3_flat,
      updated_at: new Date().toISOString(),
    })

  if (error) {
    return { error: `Gagal menyimpan pengaturan: ${error.message}` }
  }

  revalidatePath('/pengaturan')
  revalidatePath('/absensi')
  return { success: true }
}
