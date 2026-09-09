import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { generatePayrollPeriodAction, updatePaymentStatusAction } from '@/actions/payroll'
import { formatRupiah } from '@/lib/constants'

export default async function PayrollPage({ searchParams }) {
  const params = await searchParams
  const now = new Date()
  const currentMonth = parseInt(params?.bulan || (now.getMonth() + 1).toString(), 10)
  const currentYear = parseInt(params?.tahun || now.getFullYear().toString(), 10)

  const supabase = await createClient()

  // Ambil data payroll periode terpilih
  const { data: payrollList } = await supabase
    .from('payroll')
    .select('*, profiles(nama, jabatan)')
    .eq('periode_bulan', currentMonth)
    .eq('periode_tahun', currentYear)
    .order('created_at', { ascending: true })

  const totalPayrollSemua = payrollList?.reduce((acc, p) => acc + p.total_gaji, 0) || 0

  const generateActionWithPeriod = generatePayrollPeriodAction.bind(null, currentMonth, currentYear)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Penggajian (Payroll)</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Periode: Bulan {currentMonth}, Tahun {currentYear}
          </p>
        </div>

        <form action={generateActionWithPeriod}>
          <Button variant="primary" type="submit">
            ⚡ Hitung / Generate Ulang Payroll
          </Button>
        </form>
      </div>

      {/* Ringkasan Total */}
      <Card variant="glass" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Total Pengeluaran Gaji Bulan Ini:</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary-light)' }}>
            {formatRupiah(totalPayrollSemua)}
          </div>
        </div>
        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Total Karyawan Terhitung: <strong>{payrollList?.length || 0} Orang</strong>
        </div>
      </Card>

      {/* Tabel / Card List Payroll */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {payrollList?.length === 0 ? (
          <Card style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <p style={{ color: 'var(--text-muted)' }}>
              Belum ada kalkulasi payroll untuk periode Bulan {currentMonth}/{currentYear}.
            </p>
            <form action={generateActionWithPeriod} style={{ marginTop: '1rem' }}>
              <Button variant="primary" size="sm" type="submit">
                Generate Payroll Sekarang
              </Button>
            </form>
          </Card>
        ) : (
          payrollList?.map((item) => {
            const togglePaymentAction = updatePaymentStatusAction.bind(
              null,
              item.id,
              item.status_pembayaran === 'sudah_dibayar' ? 'belum_dibayar' : 'sudah_dibayar'
            )

            return (
              <Card key={item.id} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>{item.profiles?.nama}</h3>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {item.profiles?.jabatan || 'Staf Operasional'}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Badge variant={item.status_pembayaran === 'sudah_dibayar' ? 'success' : 'warning'}>
                      {item.status_pembayaran === 'sudah_dibayar' ? 'Sudah Dibayar' : 'Belum Dibayar'}
                    </Badge>
                  </div>
                </div>

                {/* Rincian Komponen Gaji */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                    gap: '0.75rem',
                    background: 'var(--bg-main)',
                    padding: '0.9rem',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.85rem',
                  }}
                >
                  <div>
                    <div style={{ color: 'var(--text-muted)' }}>Gaji Pokok:</div>
                    <div style={{ fontWeight: 600 }}>{formatRupiah(item.gaji_pokok)}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)' }}>Potongan Telat:</div>
                    <div style={{ fontWeight: 600, color: item.total_potongan_telat > 0 ? 'var(--danger)' : 'inherit' }}>
                      -{formatRupiah(item.total_potongan_telat)}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)' }}>Potongan Off:</div>
                    <div style={{ fontWeight: 600, color: item.total_potongan_off > 0 ? 'var(--danger)' : 'inherit' }}>
                      -{formatRupiah(item.total_potongan_off)}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)' }}>Bonus Masuk Libur:</div>
                    <div style={{ fontWeight: 600, color: item.total_bonus_libur > 0 ? 'var(--success)' : 'inherit' }}>
                      +{formatRupiah(item.total_bonus_libur)}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)' }}>Bonus Manual:</div>
                    <div style={{ fontWeight: 600, color: item.total_bonus_manual > 0 ? 'var(--success)' : 'inherit' }}>
                      +{formatRupiah(item.total_bonus_manual)}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
                  <div>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Total Diterima: </span>
                    <strong style={{ fontSize: '1.2rem', color: 'var(--primary-light)' }}>
                      {formatRupiah(item.total_gaji)}
                    </strong>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <form action={togglePaymentAction}>
                      <Button variant="outline" size="sm" type="submit">
                        {item.status_pembayaran === 'sudah_dibayar' ? 'Tandai Belum' : 'Tandai Sudah Dibayar'}
                      </Button>
                    </form>
                    <Link href={`/payroll/${item.id}`}>
                      <Button variant="secondary" size="sm">
                        Rincian & Slip
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
