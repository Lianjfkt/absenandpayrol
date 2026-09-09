'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createEmployeeAction(formData) {
  const supabase = await createClient()

  // 1. Verifikasi role Owner
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user?.id)
    .single()

  if (profile?.role !== 'owner') {
    redirect('/karyawan/tambah?error=Hanya%20Owner%20yang%20dapat%20menambah%20karyawan')
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
    redirect('/karyawan/tambah?error=Nama,%20Email,%20dan%20Password%20wajib%20diisi')
  }

  // 2. Buat akun Auth pengguna di Supabase
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  })

  if (authError) {
    redirect(`/karyawan/tambah?error=${encodeURIComponent('Gagal membuat akun: ' + authError.message)}`)
  }

  const newUserId = authData.user?.id
  if (!newUserId) {
    redirect('/karyawan/tambah?error=Gagal%20mendapatkan%20User%20ID%20Supabase')
  }

  // 3. Masukkan record ke profiles
  const { error: profileError } = await supabase.from('profiles').upsert({
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
    redirect(`/karyawan/tambah?error=${encodeURIComponent('Gagal menyimpan profil: ' + profileError.message)}`)
  }

  revalidatePath('/karyawan')
  revalidatePath('/dashboard')
  redirect('/karyawan')
}

export async function updateEmployeeAction(id, formData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user?.id)
    .single()

  if (profile?.role !== 'owner') {
    redirect('/karyawan?error=Hanya%20Owner%20yang%20dapat%20mengubah%20karyawan')
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
    redirect(`/karyawan/${id}?error=${encodeURIComponent('Gagal memperbarui: ' + error.message)}`)
  }

  revalidatePath('/karyawan')
  revalidatePath('/dashboard')
  redirect('/karyawan')
}

export async function toggleEmployeeStatusAction(id, currentStatus) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user?.id)
    .single()

  if (profile?.role !== 'owner') {
    return
  }

  await supabase
    .from('profiles')
    .update({
      status_aktif: !currentStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  revalidatePath('/karyawan')
  revalidatePath('/dashboard')
}
