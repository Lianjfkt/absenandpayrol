'use client'

import { useState } from 'react'
import { createLeaveRequestAction, updateLeaveStatusAction } from '@/actions/leaves'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { formatTanggal, ROLES } from '@/lib/constants'

export function IzinClientView({ leaves = [], userRole, currentUserId }) {
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const isOwner = userRole === ROLES.OWNER

  const handleCreateLeave = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')
    setSuccessMsg('')

    const formData = new FormData(e.target)
    try {
      const res = await createLeaveRequestAction(formData)
      if (res?.error) {
        setErrorMsg(res.error)
      } else {
        setSuccessMsg('Pengajuan izin berhasil dikirim ke Owner!')
        setShowModal(false)
        window.location.reload()
      }
    } catch (err) {
      setErrorMsg(`Terjadi kesalahan: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (leaveId, newStatus) => {
    if (!confirm(`Konfirmasi untuk ${newStatus === 'approved' ? 'MENYETUJUI' : 'MENOLAK'} pengajuan ini?`)) {
      return
    }

    try {
      const res = await updateLeaveStatusAction(leaveId, newStatus)
      if (res?.error) {
        alert(res.error)
      } else {
        window.location.reload()
      }
    } catch (err) {
      alert(`Gagal memproses: ${err.message}`)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.02em', margin: 0 }}>
            Pengajuan Izin & Cuti
          </h1>
          <p style={{ color: 'var(--ink-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            {isOwner
              ? 'Persetujuan dan kelola permohonan izin/sakit karyawan kedai.'
              : 'Formulir izin tidak masuk kerja atau sakit terencana.'}
          </p>
        </div>

        {!isOwner && (
          <Button variant="primary" onClick={() => setShowModal(true)}>
            + Buat Pengajuan
          </Button>
        )}
      </div>

      {successMsg && (
        <div style={{ padding: '0.85rem 1.25rem', borderRadius: 'var(--radius-pill)', background: '#DCFCE7', color: '#15803D', fontSize: '0.875rem', fontWeight: 600 }}>
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div style={{ padding: '0.85rem 1.25rem', borderRadius: 'var(--radius-pill)', background: '#FEE2E2', color: '#B91C1C', fontSize: '0.875rem', fontWeight: 600 }}>
          {errorMsg}
        </div>
      )}

      {/* Daftar Pengajuan Izin */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {leaves.length === 0 ? (
          <Card style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--ink-muted)' }}>
            Belum ada riwayat pengajuan izin/sakit.
          </Card>
        ) : (
          leaves.map((item) => {
            const badgeVariant =
              item.status === 'approved'
                ? 'success'
                : item.status === 'rejected'
                ? 'danger'
                : 'warning'

            return (
              <Card key={item.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--ink)' }}>
                        {item.profiles?.nama || 'Karyawan'}
                      </span>
                      <Badge variant="accent" size="sm">
                        {item.tipe?.toUpperCase()}
                      </Badge>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--ink-muted)', marginTop: '0.3rem', fontWeight: 500 }}>
                      📅 {formatTanggal(item.tanggal_mulai)} s/d {formatTanggal(item.tanggal_selesai)}
                    </div>
                  </div>

                  <Badge variant={badgeVariant} size="md">
                    {item.status === 'approved' ? 'DISETUJUI' : item.status === 'rejected' ? 'DITOLAK' : 'MENUNGGU'}
                  </Badge>
                </div>

                <div style={{ fontSize: '0.9rem', background: 'var(--surface-muted)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-input)', border: '1px solid var(--border)' }}>
                  <div style={{ color: 'var(--ink-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Alasan:</div>
                  <div style={{ marginTop: '0.25rem', color: 'var(--ink)', fontWeight: 500 }}>{item.alasan}</div>
                </div>

                {isOwner && item.status === 'pending' && (
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
                    <Button variant="danger" size="sm" onClick={() => handleStatusUpdate(item.id, 'rejected')}>
                      Tolak
                    </Button>
                    <Button variant="primary" size="sm" onClick={() => handleStatusUpdate(item.id, 'approved')}>
                      Setujui
                    </Button>
                  </div>
                )}
              </Card>
            )
          })
        )}
      </div>

      {/* Modal Form Pengajuan Karyawan */}
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
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--ink)', margin: 0 }}>Formulir Izin / Sakit</h2>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                style={{ background: 'var(--surface-muted)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', color: 'var(--ink)', cursor: 'pointer', fontWeight: 700 }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateLeave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--ink)' }}>
                  Jenis Pengajuan
                </label>
                <select
                  name="tipe"
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
                  <option value="sakit">Sakit</option>
                  <option value="izin">Izin Kepentingan Pribadi/Keluarga</option>
                  <option value="cuti">Cuti</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--ink)' }}>
                    Mulai Tanggal
                  </label>
                  <input
                    type="date"
                    name="tanggal_mulai"
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
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--ink)' }}>
                    Sampai Tanggal
                  </label>
                  <input
                    type="date"
                    name="tanggal_selesai"
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
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--ink)' }}>
                  Alasan Keterangan
                </label>
                <textarea
                  name="alasan"
                  rows="3"
                  required
                  placeholder="Tuliskan keterangan detail pengajuan izin..."
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-input)',
                    background: 'var(--surface-muted)',
                    border: '1px solid var(--border)',
                    color: 'var(--ink)',
                    fontWeight: 500,
                    outline: 'none',
                    resize: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>
                  Batal
                </Button>
                <Button type="submit" variant="primary" loading={loading}>
                  Kirim Pengajuan
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
