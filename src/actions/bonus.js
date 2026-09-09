'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addBonusAction(formData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'owner') {
    return { error: 'Hanya Owner yang dapat menambah bonus.' }
  }

  const employee_id = formData.get('employee_id')
  const periode_bulan = parseInt(formData.get('periode_bulan'), 10)
  const periode_tahun = parseInt(formData.get('periode_tahun'), 10)
  const nominal = parseInt(formData.get('nominal') || '0', 10)
  const keterangan = formData.get('keterangan')

  if (!employee_id || !nominal || !keterangan) {
    return { error: 'Semua kolom bonus wajib diisi.' }
  }

  const { error } = await supabase.from('bonus').insert({
    employee_id,
    periode_bulan,
    periode_tahun,
    nominal,
    keterangan,
  })

  if (error) {
    return { error: `Gagal menambah bonus: ${error.message}` }
  }

  revalidatePath('/payroll')
  return { success: true }
}

export async function deleteBonusAction(bonusId) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'owner') {
    return { error: 'Hanya Owner yang dapat menghapus bonus.' }
  }

  const { error } = await supabase.from('bonus').delete().eq('id', bonusId)

  if (error) {
    return { error: `Gagal menghapus bonus: ${error.message}` }
  }

  revalidatePath('/payroll')
  return { success: true }
}
