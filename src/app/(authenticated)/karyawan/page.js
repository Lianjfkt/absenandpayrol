import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { formatRupiah, formatTanggal, HARI } from '@/lib/constants'

export default async function KaryawanPage() {
  const supabase = await createClient()

  // Guard: hanya owner yang boleh akses halaman ini
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: ownerProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (ownerProfile?.role !== 'owner') redirect('/dashboard')

  const { data: employees } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'karyawan')
    .order('created_at', { ascending: true })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.02em', margin: 0 }}>
            Manajemen Karyawan
          </h1>
          <p style={{ color: 'var(--ink-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Kelola data staf kedai, tanggal bergabung, tanggal gajian, gaji pokok, dan jadwal libur.
          </p>
        </div>

        <Link href="/karyawan/tambah">
          <Button variant="primary">+ Tambah Karyawan</Button>
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
        {employees?.length === 0 ? (
          <Card style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem 1rem' }}>
            <p style={{ color: 'var(--ink-muted)', margin: 0 }}>Belum ada data karyawan.</p>
            <Link href="/karyawan/tambah" style={{ marginTop: '1rem', display: 'inline-block' }}>
              <Button variant="outline" size="sm">Tambah Sekarang</Button>
            </Link>
          </Card>
        ) : (
          employees?.map((emp) => {
            const tglGajianNum = emp.tanggal_mulai ? new Date(emp.tanggal_mulai).getDate() : 1
            return (
              <Card key={emp.id} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--ink)', margin: 0 }}>{emp.nama}</h3>
                    <div style={{ fontSize: '0.85rem', color: 'var(--ink-muted)', marginTop: '0.15rem' }}>{emp.jabatan || 'Staf Operasional'}</div>
                  </div>
                  <Badge variant={emp.status_aktif ? 'success' : 'danger'}>
                    {emp.status_aktif ? 'Aktif' : 'Nonaktif'}
                  </Badge>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--ink-muted)' }}>Tgl Bergabung:</span>
                    <span style={{ fontWeight: 600 }}>{emp.tanggal_mulai ? formatTanggal(emp.tanggal_mulai) : '-'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--ink-muted)' }}>Jadwal Gajian:</span>
                    <Badge variant="accent" size="sm">
                      Setiap tgl {tglGajianNum}
                    </Badge>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--ink-muted)' }}>No. HP:</span>
                    <span style={{ fontWeight: 600 }}>{emp.no_hp || '-'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--ink-muted)' }}>Gaji Pokok:</span>
                    <span style={{ fontWeight: 700, color: 'var(--accent)' }}>{formatRupiah(emp.gaji_pokok || 0)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--ink-muted)' }}>Hari Libur:</span>
                    <span style={{ fontWeight: 600, color: 'var(--ink)' }}>
                      {HARI[emp.hari_libur] || 'Minggu'}
                    </span>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                  <Link href={`/karyawan/${emp.id}`}>
                    <Button variant="secondary" size="sm">Edit & Detail</Button>
                  </Link>
                </div>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
