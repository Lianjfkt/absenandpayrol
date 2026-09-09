'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Server Action: Karyawan mengajukan izin / sakit / cuti
 */
export async function createLeaveRequestAction(formData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Sesi login telah berakhir.' }
  }

  const tipe = formData.get('tipe')
  const tanggal_mulai = formData.get('tanggal_mulai')
  const tanggal_selesai = formData.get('tanggal_selesai')
  const alasan = formData.get('alasan')
  const foto_surat = formData.get('foto_surat') || null

  if (!tipe || !tanggal_mulai || !tanggal_selesai || !alasan) {
    return { error: 'Semua kolom wajib diisi.' }
  }

  const { error } = await supabase.from('leaves').insert({
    employee_id: user.id,
    tipe,
    tanggal_mulai,
    tanggal_selesai,
    alasan,
    foto_surat,
    status: 'pending',
  })

  if (error) {
    return { error: `Gagal mengajukan izin: ${error.message}` }
  }

  revalidatePath('/izin')
  return { success: true }
}

/**
 * Server Action: Owner menyetujui / menolak pengajuan izin
 */
export async function updateLeaveStatusAction(leaveId, status, catatanOwner = '') {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'owner') {
    return { error: 'Hanya Owner yang dapat merespons pengajuan izin.' }
  }

  const { error } = await supabase
    .from('leaves')
    .update({
      status,
      catatan_owner: catatanOwner,
      updated_at: new Date().toISOString(),
    })
    .eq('id', leaveId)

  if (error) {
    return { error: `Gagal memperbarui status permohonan: ${error.message}` }
  }

  revalidatePath('/izin')
  return { success: true }
}
