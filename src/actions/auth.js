'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function loginAction(formData) {
  const email = formData.get('email')
  const password = formData.get('password')

  if (!email || !password) {
    redirect('/login?error=Email%20dan%20password%20wajib%20diisi')
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    redirect(`/login?error=${encodeURIComponent('Gagal masuk: ' + error.message)}`)
  }

  if (data?.user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('status_aktif')
      .eq('id', data.user.id)
      .single()

    if (profile && profile.status_aktif === false) {
      await supabase.auth.signOut()
      redirect('/login?error=Akun%20ini%20telah%20dinonaktifkan')
    }
  }

  redirect('/dashboard')
}

export async function logoutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
