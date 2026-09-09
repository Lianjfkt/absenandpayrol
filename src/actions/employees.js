'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createEmployeeAction(formData) {
  const supabase = await createClient()

  // 1. Verifikasi role Owner
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'owner') {
    return { error: 'Hanya Owner yang dapat menambah data karyawan.' }
  }

  const email = formData.get('email')
  const password = formData.get('password')
  const nama = formData.get('nama')
  const no_hp = formData.get('no_hp')
  const alamat = formData.get('alamat')
  const jabatan = formData.get('jabatan')
  const gaji_pokok = parseInt(formData.get('gaji_pokok') || '0', 10)
  const hari_libur = parseInt(formData.get('hari_libur') || '0', 10)

  if (!email || !password || !nama) {
    return { error: 'Nama, Email, dan Password wajib diisi.' }
  }

  // 2. Buat akun Auth pengguna di Supabase
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  })

  if (authError) {
    return { error: `Gagal membuat akun: ${authError.message}` }
  }

  const newUserId = authData.user?.id
  if (!newUserId) {
    return { error: 'Gagal mendapatkan User ID Supabase Auth.' }
  }

  // 3. Masukkan record ke profiles
  const { error: profileError } = await supabase.from('profiles').insert({
    id: newUserId,
    nama,
    role: 'karyawan',
    no_hp,
    alamat,
    jabatan,
    gaji_pokok,
    hari_libur,
    status_aktif: true,
  })

  if (profileError) {
    return { error: `Gagal menyimpan profil karyawan: ${profileError.message}` }
  }

  revalidatePath('/karyawan')
  return { success: true }
}

export async function updateEmployeeAction(id, formData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'owner') {
    return { error: 'Hanya Owner yang dapat mengubah data karyawan.' }
  }

  const nama = formData.get('nama')
  const no_hp = formData.get('no_hp')
  const alamat = formData.get('alamat')
  const jabatan = formData.get('jabatan')
  const gaji_pokok = parseInt(formData.get('gaji_pokok') || '0', 10)
  const hari_libur = parseInt(formData.get('hari_libur') || '0', 10)
  const status_aktif = formData.get('status_aktif') === 'true'

  const { error } = await supabase
    .from('profiles')
    .update({
      nama,
      no_hp,
      alamat,
      jabatan,
      gaji_pokok,
      hari_libur,
      status_aktif,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    return { error: `Gagal memperbarui karyawan: ${error.message}` }
  }

  revalidatePath('/karyawan')
  return { success: true }
}

export async function toggleEmployeeStatusAction(id, currentStatus) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'owner') {
    return { error: 'Hanya Owner yang dapat mengubah status karyawan.' }
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      status_aktif: !currentStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    return { error: `Gagal mengubah status: ${error.message}` }
  }

  revalidatePath('/karyawan')
  return { success: true }
}
