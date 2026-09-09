'use client'

import { useState } from 'react'
import { checkInAction, checkOutAction } from '@/actions/attendance'
import { Button } from '@/components/ui/Button'
import { formatJam } from '@/lib/constants'

export function CheckInButton({ todayAttendance, isHariLibur }) {
  const [loading, setLoading] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const isCheckedIn = !!todayAttendance?.jam_checkin
  const isCheckedOut = !!todayAttendance?.jam_checkout

  const handleAction = (isCheckOut = false) => {
    setStatusMessage('')
    setErrorMessage('')
    setLoading(true)

    if (!navigator.geolocation) {
      setErrorMessage('Browser Anda tidak mendukung fitur Geolocation/GPS.')
      setLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords

        let res
        if (isCheckOut) {
          res = await checkOutAction(latitude, longitude)
        } else {
          res = await checkInAction(latitude, longitude)
        }

        if (res?.error) {
          setErrorMessage(res.error)
        } else {
          setStatusMessage(
            isCheckOut
              ? 'Check-Out Berhasil! Selamat beristirahat.'
              : `Check-In Berhasil! Status: ${res.status.toUpperCase()} ${
                  res.menitTelat > 0 ? `(Telat ${res.menitTelat} mnt)` : ''
                }`
          )
        }
        setLoading(false)
      },
      (err) => {
        let msg = 'Gagal mengambil koordinat GPS.'
        if (err.code === err.PERMISSION_DENIED) {
          msg = 'Izin lokasi (GPS) ditolak. Harap izinkan akses lokasi pada browser HP Anda.'
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          msg = 'Informasi lokasi tidak tersedia. Pastikan GPS HP aktif.'
        } else if (err.code === err.TIMEOUT) {
          msg = 'Waktu permintaan GPS habis. Coba lagi.'
        }
        setErrorMessage(msg)
        setLoading(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem', width: '100%' }}>
      {isHariLibur && (
        <div
          style={{
            padding: '0.6rem 1rem',
            borderRadius: 'var(--radius-md)',
            background: 'var(--info-bg)',
            color: 'var(--info)',
            fontSize: '0.85rem',
            textAlign: 'center',
            border: '1px solid rgba(59, 130, 246, 0.3)',
          }}
        >
          🎉 Hari ini adalah Hari Libur Mingguan Anda. Jika Anda masuk kerja hari ini, Anda akan mendapatkan bonus Rp 50.000!
        </div>
      )}

      {errorMessage && (
        <div
          style={{
            padding: '0.75rem',
            borderRadius: 'var(--radius-md)',
            background: 'var(--danger-bg)',
            color: 'var(--danger)',
            fontSize: '0.875rem',
            textAlign: 'center',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            width: '100%',
          }}
        >
          {errorMessage}
        </div>
      )}

      {statusMessage && (
        <div
          style={{
            padding: '0.75rem',
            borderRadius: 'var(--radius-md)',
            background: 'var(--success-bg)',
            color: 'var(--success)',
            fontSize: '0.875rem',
            textAlign: 'center',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            width: '100%',
          }}
        >
          {statusMessage}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
        {!isCheckedIn ? (
          <button
            onClick={() => handleAction(false)}
            disabled={loading}
            className="pulse-animation"
            style={{
              width: '160px',
              height: '160px',
              borderRadius: '50%',
              background: 'var(--primary-gradient)',
              color: '#ffffff',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              fontWeight: 700,
              fontSize: '1.2rem',
              boxShadow: '0 10px 25px rgba(16, 185, 129, 0.4)',
              transition: 'transform 0.2s ease',
            }}
          >
            <span style={{ fontSize: '2rem' }}>📍</span>
            <span>{loading ? 'Mengecek...' : 'CHECK IN'}</span>
          </button>
        ) : !isCheckedOut ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Sudah Check-In pada:</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--success)' }}>
                {formatJam(todayAttendance.jam_checkin)}
              </div>
            </div>

            <Button
              variant="danger"
              size="lg"
              loading={loading}
              onClick={() => handleAction(true)}
              style={{ width: '200px' }}
            >
              🛑 CHECK OUT
            </Button>
          </div>
        ) : (
          <div
            style={{
              textAlign: 'center',
              padding: '1.5rem',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border)',
            }}
          >
            <span style={{ fontSize: '2rem' }}>✅</span>
            <div style={{ fontWeight: 600, fontSize: '1.1rem', marginTop: '0.5rem' }}>
              Absensi Hari Ini Lengkap
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              In: {formatJam(todayAttendance.jam_checkin)} | Out: {formatJam(todayAttendance.jam_checkout)}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
