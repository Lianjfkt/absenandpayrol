'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createEmployeeAction } from '@/actions/employees'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { HARI } from '@/lib/constants'

export default function TambahKaryawanPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const opsiHariLibur = HARI.map((hari, index) => ({
    value: index.toString(),
    label: `Hari ${hari}`,
  }))

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const res = await createEmployeeAction(formData)

    if (res?.error) {
      setError(res.error)
      setLoading(false)
    } else {
      router.push('/karyawan')
    }
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <Link href="/karyawan" style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          ← Kembali ke Daftar Karyawan
        </Link>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '0.5rem' }}>Tambah Karyawan Baru</h1>
      </div>

      <Card variant="default">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {error && (
            <div
              style={{
                padding: '0.75rem',
                borderRadius: 'var(--radius-md)',
                background: 'var(--danger-bg)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: 'var(--danger)',
                fontSize: '0.875rem',
              }}
            >
              {error}
            </div>
          )}

          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--primary)' }}>Akun Login Karyawan</h3>
          
          <Input
            label="Email Karyawan"
            name="email"
            type="email"
            placeholder="contoh: budi@kedai.com"
            required
          />

          <Input
            label="Kata Sandi Awal"
            name="password"
            type="password"
            placeholder="Minimal 6 karakter"
            required
          />

          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--primary)', marginTop: '0.5rem' }}>
            Data Diri & Penempatan
          </h3>

          <Input
            label="Nama Lengkap"
            name="nama"
            placeholder="Nama lengkap staf"
            required
          />

          <Input
            label="Jabatan / Posisi"
            name="jabatan"
            placeholder="contoh: Cook, Barista, Kasir"
          />

          <Input
            label="Nomor WhatsApp / HP"
            name="no_hp"
            placeholder="08123456789"
          />

          <Input
            label="Gaji Pokok (Rp / Bulan)"
            name="gaji_pokok"
            type="number"
            placeholder="contoh: 2500000"
            required
          />

          <Select
            label="Hari Libur Mingguan Tetap"
            name="hari_libur"
            options={opsiHariLibur}
            defaultValue="0"
          />

          <Input
            label="Alamat Domisili"
            name="alamat"
            placeholder="Alamat tempat tinggal"
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <Link href="/karyawan">
              <Button variant="outline" type="button">Batal</Button>
            </Link>
            <Button variant="primary" type="submit" loading={loading}>
              Simpan Data Karyawan
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
