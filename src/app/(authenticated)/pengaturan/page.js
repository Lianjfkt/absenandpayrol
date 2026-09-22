import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { updateSettingsAction } from '@/actions/settings'
import { DEFAULT_SETTINGS } from '@/lib/constants'

export default async function PengaturanPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'owner') {
    redirect('/dashboard')
  }

  const { data: settings } = await supabase
    .from('settings')
    .select('*')
    .eq('id', 1)
    .single()

  const s = settings || DEFAULT_SETTINGS

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.75rem', width: '100%' }}>
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.02em', margin: 0 }}>
          Pengaturan Kedai & Bisnis
        </h1>
        <p style={{ color: 'var(--ink-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
          Konfigurasi radius GPS, jam operasional, skema toleransi, dan denda keterlambatan.
        </p>
      </div>

      <Card variant="default">
        <form action={updateSettingsAction} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--accent)', margin: 0 }}>
            1. Profil & Titik Lokasi GPS Kedai
          </h3>

          <Input
            label="Nama Kedai"
            name="nama_kedai"
            defaultValue={s.nama_kedai || 'Kedai Taichan & Chicken KA'}
            required
          />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
            <Input
              label="Latitude Kedai"
              name="lokasi_lat"
              type="number"
              step="any"
              defaultValue={s.lokasi_lat || -6.2}
              required
            />
            <Input
              label="Longitude Kedai"
              name="lokasi_lng"
              type="number"
              step="any"
              defaultValue={s.lokasi_lng || 106.816666}
              required
            />
          </div>

          <Input
            label="Radius Geofence Toleransi (Meter)"
            name="radius_meter"
            type="number"
            defaultValue={s.radius_meter || 10}
            required
          />

          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--accent)', marginTop: '0.5rem', margin: 0 }}>
            2. Jam Kerja & Toleransi
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
            <Input
              label="Jam Masuk Standar"
              name="jam_masuk"
              type="time"
              defaultValue={s.jam_masuk || '07:00'}
              required
            />
            <Input
              label="Jam Pulang Standar"
              name="jam_pulang"
              type="time"
              defaultValue={s.jam_pulang || '18:00'}
              required
            />
          </div>

          <Input
            label="Batas Toleransi Keterlambatan (Menit)"
            name="toleransi_telat_menit"
            type="number"
            defaultValue={s.toleransi_telat_menit ?? 5}
            required
          />

          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--accent)', marginTop: '0.5rem', margin: 0 }}>
            3. Skema Denda Telat Bertingkat
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.65rem' }}>
            <Input
              label="Tier 1 (Rp/Mnt)"
              name="tier1_rate"
              type="number"
              defaultValue={s.tier1_rate ?? 1000}
              required
            />
            <Input
              label="Tier 2 (Rp/Mnt)"
              name="tier2_rate"
              type="number"
              defaultValue={s.tier2_rate ?? 2000}
              required
            />
            <Input
              label="Tier 3 (>20m Rp)"
              name="tier3_flat"
              type="number"
              defaultValue={s.tier3_flat ?? 50000}
              required
            />
          </div>

          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--accent)', marginTop: '0.5rem', margin: 0 }}>
            4. Potongan Off & Bonus Masuk Libur
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
            <Input
              label="Potongan Off (Rp/Hari)"
              name="potongan_off"
              type="number"
              defaultValue={s.potongan_off ?? 50000}
              required
            />
            <Input
              label="Bonus Libur (Rp/Hari)"
              name="bonus_masuk_libur"
              type="number"
              defaultValue={s.bonus_masuk_libur ?? 50000}
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.75rem' }}>
            <Button variant="primary" size="lg" type="submit" style={{ width: '100%', maxWidth: '220px' }}>
              Simpan Pengaturan
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
