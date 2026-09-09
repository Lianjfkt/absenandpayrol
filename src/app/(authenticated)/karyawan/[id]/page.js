import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { updateEmployeeAction, toggleEmployeeStatusAction } from '@/actions/employees'
import { HARI } from '@/lib/constants'

export default async function EditKaryawanPage({ params }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: employee } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single()

  if (!employee) {
    notFound()
  }

  const opsiHariLibur = HARI.map((hari, index) => ({
    value: index.toString(),
    label: `Hari ${hari}`,
  }))

  const updateActionWithId = updateEmployeeAction.bind(null, id)
  const toggleStatusActionWithId = toggleEmployeeStatusAction.bind(null, id, employee.status_aktif)

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Link href="/karyawan" style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            ← Kembali ke Daftar Karyawan
          </Link>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '0.5rem' }}>
            Detail & Edit Karyawan
          </h1>
        </div>

        <form action={toggleStatusActionWithId}>
          <Button
            type="submit"
            variant={employee.status_aktif ? 'danger' : 'primary'}
            size="sm"
          >
            {employee.status_aktif ? 'Nonaktifkan' : 'Aktifkan Kembali'}
          </Button>
        </form>
      </div>

      <Card variant="default">
        <form action={updateActionWithId} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <Input
            label="Nama Lengkap"
            name="nama"
            defaultValue={employee.nama}
            required
          />

          <Input
            label="Jabatan / Posisi"
            name="jabatan"
            defaultValue={employee.jabatan || ''}
          />

          <Input
            label="Nomor WhatsApp / HP"
            name="no_hp"
            defaultValue={employee.no_hp || ''}
          />

          <Input
            label="Gaji Pokok (Rp / Bulan)"
            name="gaji_pokok"
            type="number"
            defaultValue={employee.gaji_pokok || 0}
            required
          />

          <Select
            label="Hari Libur Mingguan Tetap"
            name="hari_libur"
            options={opsiHariLibur}
            defaultValue={employee.hari_libur?.toString() || '0'}
          />

          <Input
            label="Alamat Domisili"
            name="alamat"
            defaultValue={employee.alamat || ''}
          />

          <input type="hidden" name="status_aktif" value={employee.status_aktif ? 'true' : 'false'} />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <Link href="/karyawan">
              <Button variant="outline" type="button">Batal</Button>
            </Link>
            <Button variant="primary" type="submit">
              Simpan Perubahan
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
