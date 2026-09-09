'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Server Action: Owner mencatat kasbon baru karyawan
 */
export async function createLoanAction(formData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'owner') {
    return { error: 'Hanya Owner yang dapat mencatat kasbon.' }
  }

  const employee_id = formData.get('employee_id')
  const nominal_pinjaman = parseInt(formData.get('nominal_pinjaman') || '0', 10)
  const cicilan_per_bulan = parseInt(formData.get('cicilan_per_bulan') || '0', 10)
  const keterangan = formData.get('keterangan') || ''
  const tanggal_pinjam = formData.get('tanggal_pinjam') || new Date().toISOString().split('T')[0]

  if (!employee_id || nominal_pinjaman <= 0 || cicilan_per_bulan <= 0) {
    return { error: 'Karyawan, nominal pinjaman, dan cicilan bulanan wajib diisi dengan benar.' }
  }

  const { error } = await supabase.from('loans').insert({
    employee_id,
    nominal_pinjaman,
    cicilan_per_bulan,
    sisa_pinjaman: nominal_pinjaman,
    keterangan,
    tanggal_pinjam,
    status: 'aktif',
  })

  if (error) {
    return { error: `Gagal mencatat kasbon: ${error.message}` }
  }

  revalidatePath('/kasbon')
  revalidatePath('/payroll')
  return { success: true }
}

/**
 * Server Action: Update Status atau Bayar Manual Kasbon
 */
export async function updateLoanStatusAction(loanId, status, sisaPinjamanBaru = 0) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'owner') {
    return { error: 'Hanya Owner yang dapat mengubah status kasbon.' }
  }

  const { error } = await supabase
    .from('loans')
    .update({
      status,
      sisa_pinjaman: sisaPinjamanBaru,
      updated_at: new Date().toISOString(),
    })
    .eq('id', loanId)

  if (error) {
    return { error: `Gagal memperbarui status kasbon: ${error.message}` }
  }

  revalidatePath('/kasbon')
  return { success: true }
}
