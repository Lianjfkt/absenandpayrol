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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Manajemen Kasbon & Pinjaman</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Pencatatan kasbon karyawan dan pemotongan otomatis per periode gaji.
          </p>
        </div>

        <Button variant="primary" onClick={() => setShowModal(true)}>
          ➕ Catat Kasbon Baru
        </Button>
      </div>

      {/* Ringkasan Kasbon */}
      <div className="grid grid-cols-1 grid-cols-2" style={{ gap: '1rem' }}>
        <Card>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Total Sisa Kasbon Berjalan</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--danger)', marginTop: '0.25rem' }}>
            {formatRupiah(totalKasbonAktif)}
          </div>
        </Card>
        <Card>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Jumlah Kasbon Aktif</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary-light)', marginTop: '0.25rem' }}>
            {loans.filter((l) => l.status === 'aktif').length} Data
          </div>
        </Card>
      </div>

      {errorMsg && (
        <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', background: 'var(--danger-bg)', color: 'var(--danger)', fontSize: '0.875rem' }}>
          {errorMsg}
        </div>
      )}

      {/* List Kasbon */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {loans.length === 0 ? (
          <Card style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
            Belum ada catatan kasbon karyawan.
          </Card>
        ) : (
          loans.map((item) => (
            <Card key={item.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{item.profiles?.nama}</h3>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Pinjam: {formatTanggal(item.tanggal_pinjam)} | {item.keterangan || 'Tanpa keterangan'}
                  </div>
                </div>

                <Badge variant={item.status === 'aktif' ? 'warning' : 'success'}>
                  {item.status === 'aktif' ? 'BERJALAN' : 'LUNAS'}
                </Badge>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '0.5rem',
                  background: 'var(--bg-main)',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.85rem',
                  textAlign: 'center',
                }}
              >
                <div>
                  <div style={{ color: 'var(--text-muted)' }}>Total Pinjaman</div>
                  <div style={{ fontWeight: 600 }}>{formatRupiah(item.nominal_pinjaman)}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)' }}>Cicilan / Bulan</div>
                  <div style={{ fontWeight: 600, color: 'var(--warning)' }}>{formatRupiah(item.cicilan_per_bulan)}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)' }}>Sisa Pinjaman</div>
                  <div style={{ fontWeight: 700, color: item.sisa_pinjaman > 0 ? 'var(--danger)' : 'var(--success)' }}>
                    {formatRupiah(item.sisa_pinjaman)}
                  </div>
                </div>
              </div>

              {item.status === 'aktif' && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
                  <Button variant="outline" size="sm" onClick={() => handleSetLunas(item.id)}>
                    ✅ Set Lunas Manual
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
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '1rem',
          }}
        >
          <div
            style={{
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-xl)',
              padding: '1.5rem',
              width: '100%',
              maxWidth: '480px',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Catat Kasbon Karyawan</h2>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateLoan} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.3rem', color: 'var(--text-muted)' }}>
                  Pilih Karyawan
                </label>
                <select
                  name="employee_id"
                  required
                  style={{
                    width: '100%',
                    padding: '0.6rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-main)',
                    border: '1px solid var(--border)',
                    color: 'inherit',
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
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.3rem', color: 'var(--text-muted)' }}>
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
                    padding: '0.6rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-main)',
                    border: '1px solid var(--border)',
                    color: 'inherit',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.3rem', color: 'var(--text-muted)' }}>
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
                    padding: '0.6rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-main)',
                    border: '1px solid var(--border)',
                    color: 'inherit',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.3rem', color: 'var(--text-muted)' }}>
                  Keterangan Kasbon
                </label>
                <input
                  type="text"
                  name="keterangan"
                  placeholder="Contoh: Keperluan perbaikan motor"
                  style={{
                    width: '100%',
                    padding: '0.6rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-main)',
                    border: '1px solid var(--border)',
                    color: 'inherit',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
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
