'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function loginAction(formData) {
  const email = formData.get('email')
  const password = formData.get('password')

  if (!email || !password) {
    return { error: 'Email dan password harus diisi.' }
  }

  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: 'Gagal masuk: Email atau kata sandi salah.' }
  }

  // Cek profil pengguna untuk role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, status_aktif')
    .eq('id', data.user.id)
    .single()

  if (profile && profile.status_aktif === false) {
    await supabase.auth.signOut()
    return { error: 'Akun ini telah dinonaktifkan oleh Owner.' }
  }

  redirect('/dashboard')
}

export async function logoutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
