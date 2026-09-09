import { loginAction } from '@/actions/auth'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export default async function LoginPage({ searchParams }) {
  const params = await searchParams
  const errorMsg = params?.error

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem',
        background: 'radial-gradient(circle at top, #1e293b 0%, #0f172a 100%)',
      }}
    >
      <div style={{ width: '100%', maxWidth: '420px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              margin: '0 auto 1rem auto',
              background: 'var(--primary-gradient)',
              borderRadius: 'var(--radius-lg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
              boxShadow: '0 8px 24px rgba(16, 185, 129, 0.35)',
            }}
          >
            🍗
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)' }}>
            Kedai Taichan & Chicken KA
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
            Portal Absensi GPS & Penggajian Karyawan
          </p>
        </div>

        <Card variant="glass">
          <form action={loginAction} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-main)', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
              Masuk ke Sistem
            </h2>

            {errorMsg && (
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
                {decodeURIComponent(errorMsg)}
              </div>
            )}

            <Input
              label="Email"
              name="email"
              type="email"
              placeholder="nama@kedai.com"
              required
              autoComplete="email"
            />

            <Input
              label="Kata Sandi"
              name="password"
              type="password"
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              style={{ width: '100%', marginTop: '0.5rem' }}
            >
              Masuk Sekarang
            </Button>
          </form>
        </Card>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
          Akun dibuat dan dikelola oleh Owner Kedai.
        </div>
      </div>
    </div>
  )
}
