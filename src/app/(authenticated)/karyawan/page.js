import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { formatRupiah, HARI } from '@/lib/constants'

export default async function KaryawanPage() {
  const supabase = await createClient()

  const { data: employees } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'karyawan')
    .order('created_at', { ascending: true })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Manajemen Karyawan</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Kelola data staf kedai, gaji pokok, dan jadwal libur mingguan.
          </p>
        </div>

        <Link href="/karyawan/tambah">
          <Button variant="primary">+ Tambah Karyawan</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 grid-cols-2" style={{ gap: '1rem' }}>
        {employees?.length === 0 ? (
          <Card style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem 1rem' }}>
            <p style={{ color: 'var(--text-muted)' }}>Belum ada data karyawan.</p>
            <Link href="/karyawan/tambah" style={{ marginTop: '1rem', display: 'inline-block' }}>
              <Button variant="outline" size="sm">Tambah Sekarang</Button>
            </Link>
          </Card>
        ) : (
          employees?.map((emp) => (
            <Card key={emp.id} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>{emp.nama}</h3>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{emp.jabatan || 'Staf Operasional'}</div>
                </div>
                <Badge variant={emp.status_aktif ? 'success' : 'danger'}>
                  {emp.status_aktif ? 'Aktif' : 'Nonaktif'}
                </Badge>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.875rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>No. HP:</span>
                  <span>{emp.no_hp || '-'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Gaji Pokok:</span>
                  <span style={{ fontWeight: 600 }}>{formatRupiah(emp.gaji_pokok || 0)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Hari Libur:</span>
                  <span style={{ fontWeight: 500, color: 'var(--accent-light)' }}>
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
          ))
        )}
      </div>
    </div>
  )
}
