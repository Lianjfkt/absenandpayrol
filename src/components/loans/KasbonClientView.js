'use client'

import { useState } from 'react'
import { createLoanAction, updateLoanStatusAction } from '@/actions/loans'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { formatRupiah, formatTanggal } from '@/lib/constants'

export function KasbonClientView({ loans = [], employees = [] }) {
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handleCreateLoan = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')

    const formData = new FormData(e.target)
    try {
      const res = await createLoanAction(formData)
      if (res?.error) {
        setErrorMsg(res.error)
      } else {
        setShowModal(false)
        window.location.reload()
      }
    } catch (err) {
      setErrorMsg(`Terjadi kesalahan: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSetLunas = async (loanId) => {
    if (!confirm('Tandai kasbon ini sebagai LUNAS?')) return

    try {
      const res = await updateLoanStatusAction(loanId, 'lunas', 0)
      if (res?.error) {
        alert(res.error)
      } else {
        window.location.reload()
      }
    } catch (err) {
      alert(`Gagal: ${err.message}`)
    }
  }

  const totalKasbonAktif = loans
    .filter((l) => l.status === 'aktif')
    .reduce((acc, l) => acc + (l.sisa_pinjaman || 0), 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.02em', margin: 0 }}>
            Manajemen Kasbon Tim
          </h1>
          <p style={{ color: 'var(--ink-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Pencatatan kasbon karyawan dan pemotongan cicilan otomatis per periode penggajian.
          </p>
        </div>

        <Button variant="primary" onClick={() => setShowModal(true)}>
          + Catat Kasbon Baru
        </Button>
      </div>

      {/* Ringkasan Kasbon */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <Card variant="accent-soft">
          <div style={{ fontSize: '0.85rem', color: 'var(--ink-muted)', fontWeight: 600 }}>Total Sisa Kasbon Berjalan</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--accent)', marginTop: '0.25rem' }}>
            {formatRupiah(totalKasbonAktif)}
          </div>
        </Card>
        <Card>
          <div style={{ fontSize: '0.85rem', color: 'var(--ink-muted)', fontWeight: 600 }}>Jumlah Kasbon Aktif</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--ink)', marginTop: '0.25rem' }}>
            {loans.filter((l) => l.status === 'aktif').length} <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--ink-muted)' }}>pengajuan</span>
          </div>
        </Card>
      </div>

      {errorMsg && (
        <div style={{ padding: '0.85rem 1.25rem', borderRadius: 'var(--radius-pill)', background: '#FEE2E2', color: '#B91C1C', fontSize: '0.875rem', fontWeight: 600 }}>
          {errorMsg}
        </div>
      )}

      {/* List Kasbon */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {loans.length === 0 ? (
          <Card style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--ink-muted)' }}>
            Belum ada catatan kasbon karyawan.
          </Card>
        ) : (
          loans.map((item) => (
            <Card key={item.id} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--ink)', margin: 0 }}>{item.profiles?.nama}</h3>
                  <div style={{ fontSize: '0.8rem', color: 'var(--ink-muted)', marginTop: '0.25rem', fontWeight: 500 }}>
                    Pinjam: {formatTanggal(item.tanggal_pinjam)} • {item.keterangan || 'Tanpa keterangan'}
                  </div>
                </div>

                <Badge variant={item.status === 'aktif' ? 'warning' : 'success'} size="md">
                  {item.status === 'aktif' ? 'BERJALAN' : 'LUNAS'}
                </Badge>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '0.75rem',
                  background: 'var(--surface-muted)',
                  padding: '1rem',
                  borderRadius: 'var(--radius-input)',
                  border: '1px solid var(--border)',
                  fontSize: '0.85rem',
                  textAlign: 'center',
                }}
              >
                <div>
                  <div style={{ color: 'var(--ink-muted)', fontSize: '0.75rem', fontWeight: 600 }}>TOTAL PINJAMAN</div>
                  <div style={{ fontWeight: 800, color: 'var(--ink)', marginTop: '0.2rem' }}>{formatRupiah(item.nominal_pinjaman)}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--ink-muted)', fontSize: '0.75rem', fontWeight: 600 }}>CICILAN / BULAN</div>
                  <div style={{ fontWeight: 800, color: 'var(--accent)', marginTop: '0.2rem' }}>{formatRupiah(item.cicilan_per_bulan)}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--ink-muted)', fontSize: '0.75rem', fontWeight: 600 }}>SISA PINJAMAN</div>
                  <div style={{ fontWeight: 800, color: item.sisa_pinjaman > 0 ? '#B91C1C' : '#15803D', marginTop: '0.2rem' }}>
                    {formatRupiah(item.sisa_pinjaman)}
                  </div>
                </div>
              </div>

              {item.status === 'aktif' && (
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button variant="secondary" size="sm" onClick={() => handleSetLunas(item.id)}>
                    Set Lunas Manual
                  </Button>
                </div>
              )}
            </Card>
          ))
        )}
      </div>

      {/* Modal Tambah Kasbon */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(23, 23, 23, 0.4)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '1rem',
          }}
        >
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-card)',
              boxShadow: 'var(--shadow-nav)',
              padding: '1.75rem',
              width: '100%',
              maxWidth: '480px',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--ink)', margin: 0 }}>Catat Kasbon Karyawan</h2>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                style={{ background: 'var(--surface-muted)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', color: 'var(--ink)', cursor: 'pointer', fontWeight: 700 }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateLoan} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--ink)' }}>
                  Pilih Karyawan
                </label>
                <select
                  name="employee_id"
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-input)',
                    background: 'var(--surface-muted)',
                    border: '1px solid var(--border)',
                    color: 'var(--ink)',
                    fontWeight: 500,
                    outline: 'none',
                  }}
                >
                  <option value="">-- Pilih Karyawan --</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.nama} ({emp.jabatan})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--ink)' }}>
                  Nominal Pinjaman (Rp)
                </label>
                <input
                  type="number"
                  name="nominal_pinjaman"
                  min="1000"
                  step="1000"
                  required
                  placeholder="Contoh: 500000"
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-input)',
                    background: 'var(--surface-muted)',
                    border: '1px solid var(--border)',
                    color: 'var(--ink)',
                    fontWeight: 500,
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--ink)' }}>
                  Potongan Cicilan per Bulan (Rp)
                </label>
                <input
                  type="number"
                  name="cicilan_per_bulan"
                  min="1000"
                  step="1000"
                  required
                  placeholder="Contoh: 100000"
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-input)',
                    background: 'var(--surface-muted)',
                    border: '1px solid var(--border)',
                    color: 'var(--ink)',
                    fontWeight: 500,
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--ink)' }}>
                  Keterangan Kasbon
                </label>
                <input
                  type="text"
                  name="keterangan"
                  placeholder="Contoh: Keperluan darurat"
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-input)',
                    background: 'var(--surface-muted)',
                    border: '1px solid var(--border)',
                    color: 'var(--ink)',
                    fontWeight: 500,
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>
                  Batal
                </Button>
                <Button type="submit" variant="primary" loading={loading}>
                  Simpan Kasbon
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
