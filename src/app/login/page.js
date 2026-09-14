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
        background: 'radial-gradient(ellipse at top, #FBF9F5 0%, #F0EDE7 100%)',
      }}
    >
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              margin: '0 auto 1rem auto',
              background: 'var(--accent-gradient)',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
              boxShadow: '0 10px 25px rgba(249, 115, 22, 0.35)',
            }}
          >
            🍗
          </div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.02em', margin: 0 }}>
            Kedai Taichan & Chicken
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--ink-muted)', marginTop: '0.35rem', fontWeight: 500 }}>
            Portal Presensi GPS & Penggajian Karyawan
          </p>
        </div>

        <Card variant="default" style={{ padding: '1.75rem', boxShadow: 'var(--shadow-nav)' }}>
          <form action={loginAction} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--ink)', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem', margin: 0 }}>
              Masuk ke Akun
            </h2>

            {errorMsg && (
              <div
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--danger-bg)',
                  border: '1px solid rgba(220, 38, 38, 0.25)',
                  color: 'var(--danger)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                }}
              >
                {decodeURIComponent(errorMsg)}
              </div>
            )}

            <Input
              label="Email Akun"
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
              style={{ width: '100%', marginTop: '0.5rem', borderRadius: 'var(--radius-pill)', fontWeight: 700 }}
            >
              Masuk Sekarang →
            </Button>
          </form>
        </Card>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.8rem', color: 'var(--ink-muted)', fontWeight: 500 }}>
          Akun dibuat dan dikelola oleh Owner Kedai.
        </div>
      </div>
    </div>
  )
}
