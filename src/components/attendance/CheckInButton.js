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

    // Cek ketersediaan Geolocation API
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setErrorMessage(
        'Fitur GPS tidak dapat diakses. Browser memerlukan koneksi aman (HTTPS atau localhost) untuk menggunakan GPS.'
      )
      setLoading(false)
      return
    }

    // Set timeout manual agar UI tidak menggantung jika izin ditahan browser
    const timer = setTimeout(() => {
      if (loading) {
        setErrorMessage('Menunggu izin lokasi GPS dari browser... Pastikan Anda mengizinkan akses lokasi pada popup browser.')
      }
    }, 2500)

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        clearTimeout(timer)
        const { latitude, longitude } = pos.coords

        try {
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
                : `Check-In Berhasil! Status: ${res.status?.toUpperCase()} ${
                    res.menitTelat > 0 ? `(Telat ${res.menitTelat} mnt)` : ''
                  }`
            )
            // Refresh halaman agar status terupdate
            window.location.reload()
          }
        } catch (e) {
          setErrorMessage(`Terjadi kesalahan server: ${e.message}`)
        } finally {
          setLoading(false)
        }
      },
      (err) => {
        clearTimeout(timer)
        let msg = 'Gagal mengambil koordinat GPS.'
        if (err.code === 1) {
          // PERMISSION_DENIED
          msg =
            'Izin lokasi (GPS) ditolak. Harap klik ikon gembok / info di samping URL browser dan izinkan "Location / Lokasi".'
        } else if (err.code === 2) {
          // POSITION_UNAVAILABLE
          msg = 'Informasi lokasi tidak tersedia. Pastikan fitur GPS di HP/perangkat Anda aktif.'
        } else if (err.code === 3) {
          // TIMEOUT
          msg = 'Waktu permintaan lokasi GPS habis. Silakan coba klik kembali.'
        } else {
          msg = `Error GPS: ${err.message}`
        }
        setErrorMessage(msg)
        setLoading(false)
      },
      {
        enableHighAccuracy: false, // Gunakan false terlebih dahulu agar instan (Wifi/Cellular/GPS)
        timeout: 15000,
        maximumAge: 10000,
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
            type="button"
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
            <span>{loading ? 'Mengecek GPS...' : 'CHECK IN'}</span>
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
