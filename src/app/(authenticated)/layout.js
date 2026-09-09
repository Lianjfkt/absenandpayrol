import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { MobileNav } from '@/components/layout/MobileNav'
import { Header } from '@/components/layout/Header'

export default async function AuthenticatedLayout({ children }) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const userRole = profile?.role || 'karyawan'

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-main)' }}>
      {/* Sidebar untuk Desktop */}
      <Sidebar userRole={userRole} />

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Header user={user} profile={profile} />

        <main
          style={{
            flex: 1,
            padding: '1.5rem',
            paddingBottom: 'calc(var(--bottom-nav-height) + 1.5rem)', // Tambahan ruang untuk Mobile Bottom Nav
            maxWidth: '1200px',
            width: '100%',
            margin: '0 auto',
          }}
        >
          {children}
        </main>
      </div>

      {/* Navigation Bar untuk Mobile */}
      <MobileNav userRole={userRole} />
    </div>
  )
}
