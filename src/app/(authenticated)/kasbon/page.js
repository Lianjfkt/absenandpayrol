import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { KasbonClientView } from '@/components/loans/KasbonClientView'

export default async function KasbonPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  // Hanya owner yang boleh akses manajemen kasbon
  if (profile?.role !== 'owner') {
    redirect('/dashboard')
  }

  // Ambil data semua kasbon
  const { data: loans } = await supabase
    .from('loans')
    .select('*, profiles:employee_id(nama, jabatan)')
    .order('created_at', { ascending: false })

  // Ambil data karyawan aktif untuk dropdown
  const { data: employees } = await supabase
    .from('profiles')
    .select('id, nama, jabatan')
    .eq('role', 'karyawan')
    .eq('status_aktif', true)

  return (
    <KasbonClientView
      loans={loans || []}
      employees={employees || []}
    />
  )
}
