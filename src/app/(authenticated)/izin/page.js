import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { IzinClientView } from '@/components/leaves/IzinClientView'

export default async function IzinPage() {
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

  const userRole = profile?.role || 'karyawan'

  // Query permohonan izin
  let query = supabase
    .from('leaves')
    .select('*, profiles:employee_id(nama, jabatan)')
    .order('created_at', { ascending: false })

  if (userRole !== 'owner') {
    query = query.eq('employee_id', user.id)
  }

  const { data: leaves } = await query

  return (
    <IzinClientView
      leaves={leaves || []}
      userRole={userRole}
      currentUserId={user.id}
    />
  )
}
