import { createClient } from '@/lib/supabase/server'
import { getDbClient } from '@/lib/supabase/admin'
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

  const db = getDbClient(supabase)

  // Ambil data kasbon dan semua profil karyawan secara paralel
  const [{ data: loans }, { data: allProfiles }] = await Promise.all([
    db
      .from('loans')
      .select('*, profiles:employee_id(nama, jabatan)')
      .order('created_at', { ascending: false }),
    db
      .from('profiles')
      .select('id, nama, jabatan, status_aktif, role')
      .order('nama', { ascending: true }),
  ])

  // Filter karyawan yang bukan owner dan status_aktif bukan false
  const employees = (allProfiles || []).filter(
    (p) => p.role !== 'owner' && p.status_aktif !== false
  )

  return (
    <KasbonClientView
      loans={loans || []}
      employees={employees}
    />
  )
}
