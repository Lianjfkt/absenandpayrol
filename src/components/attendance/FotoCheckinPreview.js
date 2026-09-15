'use client'

import { useState } from 'react'
import { formatTanggal, formatJam } from '@/lib/constants'

/**
 * Komponen preview foto check-in karyawan.
 * Tampilkan sebagai thumbnail kecil; klik untuk buka modal full-size.
 */
export function FotoCheckinPreview({ fotoCheckin, namaKaryawan, tanggal, jamCheckin, accuracy }) {
  const [showModal, setShowModal] = useState(false)

  if (!fotoCheckin) {
    return (
      <div
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '8px',
          background: 'var(--surface-muted)',
          border: '1px dashed var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.25rem',
          color: 'var(--ink-muted)',
          flexShrink: 0,
        }}
        title="Tidak ada foto check-in"
      >
        📷
      </div>
    )
  }

  return (
    <>
      {/* Thumbnail klik */}
      <button
        type="button"
        onClick={() => setShowModal(true)}
        title="Lihat foto check-in"
        style={{
          padding: 0,
          border: '2px solid var(--accent)',
          borderRadius: '8px',
          cursor: 'pointer',
          background: 'none',
          flexShrink: 0,
          overflow: 'hidden',
          width: '48px',
          height: '48px',
          transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.08)'
          e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.18)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)'
          e.currentTarget.style.boxShadow = 'none'
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={fotoCheckin}
          alt={`Foto check-in ${namaKaryawan || ''}`}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      </button>

      {/* Modal full-size */}
      {showModal && (
        <div
          onClick={() => setShowModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.72)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 200,
            padding: '1rem',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--surface)',
              borderRadius: 'var(--radius-card)',
              border: '1px solid var(--border)',
              boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
              overflow: 'hidden',
              maxWidth: '480px',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Header modal */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.85rem 1.25rem',
                borderBottom: '1px solid var(--border)',
                background: 'var(--surface-muted)',
              }}
            >
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--ink)' }}>
                  📷 Foto Check-In {namaKaryawan ? `— ${namaKaryawan}` : ''}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--ink-muted)', marginTop: '0.1rem' }}>
                  {tanggal && formatTanggal(tanggal)}
                  {jamCheckin && ` · ${formatJam(jamCheckin)}`}
                  {accuracy && ` · GPS ±${accuracy}m`}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  color: 'var(--ink)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ✕
              </button>
            </div>

            {/* Foto */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={fotoCheckin}
              alt={`Foto check-in ${namaKaryawan || ''}`}
              style={{ width: '100%', display: 'block', maxHeight: '520px', objectFit: 'contain', background: '#000' }}
            />

            {/* Footer */}
            <div
              style={{
                padding: '0.65rem 1.25rem',
                fontSize: '0.75rem',
                color: 'var(--ink-muted)',
                background: 'var(--surface-muted)',
                borderTop: '1px solid var(--border)',
                textAlign: 'center',
              }}
            >
              Foto dengan watermark keamanan GPS otomatis · Klik di luar untuk tutup
            </div>
          </div>
        </div>
      )}
    </>
  )
}
