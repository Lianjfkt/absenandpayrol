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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Pengajuan Izin & Sakit</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {isOwner
              ? 'Kelola dan setujui permohonan izin/sakit karyawan kedai.'
              : 'Formulir izin tidak masuk kerja atau sakit terencana.'}
          </p>
        </div>

        {!isOwner && (
          <Button variant="primary" onClick={() => setShowModal(true)}>
            ➕ Buat Pengajuan Izin
          </Button>
        )}
      </div>

      {successMsg && (
        <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', background: 'var(--success-bg)', color: 'var(--success)', fontSize: '0.875rem' }}>
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', background: 'var(--danger-bg)', color: 'var(--danger)', fontSize: '0.875rem' }}>
          {errorMsg}
        </div>
      )}

      {/* Daftar Pengajuan Izin */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {leaves.length === 0 ? (
          <Card style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
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
              <Card key={item.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>
                        {item.profiles?.nama || 'Karyawan'}
                      </span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        ({item.tipe?.toUpperCase()})
                      </span>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      📅 {formatTanggal(item.tanggal_mulai)} s/d {formatTanggal(item.tanggal_selesai)}
                    </div>
                  </div>

                  <Badge variant={badgeVariant}>
                    {item.status === 'approved' ? 'DISETUJUI' : item.status === 'rejected' ? 'DITOLAK' : 'MENUNGGU APPROVAL'}
                  </Badge>
                </div>

                <div style={{ fontSize: '0.9rem', background: 'var(--bg-main)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Alasan:</div>
                  <div style={{ marginTop: '0.2rem' }}>{item.alasan}</div>
                </div>

                {isOwner && item.status === 'pending' && (
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
                    <Button variant="danger" size="sm" onClick={() => handleStatusUpdate(item.id, 'rejected')}>
                      ❌ Tolak
                    </Button>
                    <Button variant="success" size="sm" onClick={() => handleStatusUpdate(item.id, 'approved')}>
                      ✅ Setujui Izin
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
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Formulir Izin / Sakit</h2>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateLeave} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.3rem', color: 'var(--text-muted)' }}>
                  Jenis Pengajuan
                </label>
                <select
                  name="tipe"
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
                  <option value="sakit">Sakit</option>
                  <option value="izin">Izin Kepentingan Pribadi/Keluarga</option>
                  <option value="cuti">Cuti</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.3rem', color: 'var(--text-muted)' }}>
                    Dari Tanggal
                  </label>
                  <input
                    type="date"
                    name="tanggal_mulai"
                    required
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
                    Sampai Tanggal
                  </label>
                  <input
                    type="date"
                    name="tanggal_selesai"
                    required
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
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.3rem', color: 'var(--text-muted)' }}>
                  Alasan Lengkap
                </label>
                <textarea
                  name="alasan"
                  rows="3"
                  required
                  placeholder="Jelaskan alasan izin / sakit Anda..."
                  style={{
                    width: '100%',
                    padding: '0.6rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-main)',
                    border: '1px solid var(--border)',
                    color: 'inherit',
                    resize: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
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
