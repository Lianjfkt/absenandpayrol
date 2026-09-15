'use client'

import { useState, useRef } from 'react'
import { checkInAction, checkOutAction } from '@/actions/attendance'
import { Button } from '@/components/ui/Button'
import { formatJam } from '@/lib/constants'

export function CheckInButton({ todayAttendance, isHariLibur }) {
  const [loading, setLoading] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [gpsAccuracy, setGpsAccuracy] = useState(null)
  
  // State Kamera Selfie
  const [showCamera, setShowCamera] = useState(false)
  const [capturedPhoto, setCapturedPhoto] = useState(null)
  const videoRef = useRef(null)
  const streamRef = useRef(null)

  const isCheckedIn = !!todayAttendance?.jam_checkin
  const isCheckedOut = !!todayAttendance?.jam_checkout

  // Buka Kamera Depan
  const startCamera = async () => {
    try {
      setShowCamera(true)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 480 }, height: { ideal: 480 } },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (err) {
      console.warn('Gagal akses kamera:', err)
      setShowCamera(false)
      // Tetap lanjutkan tanpa kamera jika device tidak ada / izin ditolak
      handleLocationAndSubmit(false, null)
    }
  }

  // Ambil Foto dari Video Canvas dengan Watermark Real-time Keamanan
  const takeSnapshot = (lat = null, lng = null, acc = null) => {
    if (!videoRef.current) return
    const video = videoRef.current
    const canvas = document.createElement('canvas')
    const width = video.videoWidth || 480
    const height = video.videoHeight || 480
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')

    // 1. Gambar video frame
    ctx.drawImage(video, 0, 0, width, height)

    // 2. Gambar Watermark Banner Keamanan Anti-Fraud di bagian bawah
    const bannerHeight = Math.max(70, Math.floor(height * 0.22))
    ctx.fillStyle = 'rgba(11, 15, 25, 0.78)'
    ctx.fillRect(0, height - bannerHeight, width, bannerHeight)

    // Aksen garis oranye di atas banner
    ctx.fillStyle = '#10B981'
    ctx.fillRect(0, height - bannerHeight, width, 3)

    // 3. Tulis Informasi Stamp
    ctx.fillStyle = '#FFFFFF'
    ctx.font = `bold ${Math.max(12, Math.floor(width * 0.035))}px monospace`
    
    const nowWIB = new Date().toLocaleString('id-ID', {
      timeZone: 'Asia/Jakarta',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })

    const marginX = 14
    const startY = height - bannerHeight + 18
    const lineHeight = Math.max(14, Math.floor(bannerHeight / 4.2))

    ctx.fillText(`🏢 TAICHAN & CHICKEN KA - VALIDASI`, marginX, startY)
    ctx.font = `${Math.max(10, Math.floor(width * 0.028))}px monospace`
    ctx.fillStyle = '#E2E8F0'
    ctx.fillText(`🕒 ${nowWIB} WIB`, marginX, startY + lineHeight)
    
    if (lat && lng) {
      ctx.fillText(`📍 Lat: ${Number(lat).toFixed(6)}, Lng: ${Number(lng).toFixed(6)}`, marginX, startY + lineHeight * 2)
      ctx.fillStyle = acc <= 20 ? '#86EFAC' : '#FCD34D'
      ctx.fillText(`🛡️ Akurasi GPS: ±${acc}m (Verified Real-time)`, marginX, startY + lineHeight * 3)
    } else {
      ctx.fillText(`🛡️ Security Stamp: Verified Geo-Camera`, marginX, startY + lineHeight * 2)
    }

    const base64 = canvas.toDataURL('image/jpeg', 0.65) // Kompresi foto
    setCapturedPhoto(base64)
    stopCamera()
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    setShowCamera(false)
  }

  const handleStartCheckIn = () => {
    setStatusMessage('')
    setErrorMessage('')
    startCamera()
  }

  const handleLocationAndSubmit = (isCheckOut = false, photoData = null) => {
    setStatusMessage('')
    setErrorMessage('')
    setLoading(true)

    if (typeof window === 'undefined' || !navigator.geolocation) {
      setErrorMessage(
        'Fitur GPS tidak dapat diakses. Browser memerlukan koneksi aman (HTTPS atau localhost) untuk menggunakan GPS.'
      )
      setLoading(false)
      return
    }

    const timer = setTimeout(() => {
      if (loading) {
        setErrorMessage('Menunggu izin lokasi GPS dari browser... Pastikan Anda mengizinkan akses lokasi pada popup browser.')
      }
    }, 2500)

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        clearTimeout(timer)
        const { latitude, longitude, accuracy } = pos.coords
        const roundedAcc = Math.round(accuracy)
        setGpsAccuracy(roundedAcc)

        // Deteksi Keamanan Anti-Fake GPS & Emulator
        if (roundedAcc === 0) {
          setErrorMessage('Peringatan Keamanan: Terdeteksi akurasi GPS tidak wajar (0m). Mohon matikan aplikasi Fake GPS / Mock Location pada perangkat Anda.')
          setLoading(false)
          return
        }

        if (roundedAcc > 75) {
          setErrorMessage(`Akurasi GPS terlalu lemah (±${roundedAcc} meter). Mohon aktifkan mode "Akurasi Tinggi" pada GPS HP Anda dan tunggu sinyal satelit stabil.`)
          setLoading(false)
          return
        }

        try {
          let res
          if (isCheckOut) {
            res = await checkOutAction(latitude, longitude)
          } else {
            res = await checkInAction(latitude, longitude, photoData, roundedAcc)
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
          msg = 'Izin lokasi (GPS) ditolak. Harap klik ikon gembok / info di samping URL browser dan izinkan "Location / Lokasi".'
        } else if (err.code === 2) {
          msg = 'Informasi lokasi tidak tersedia. Pastikan fitur GPS di HP/perangkat Anda aktif.'
        } else if (err.code === 3) {
          msg = 'Waktu permintaan lokasi GPS habis. Silakan coba klik kembali.'
        } else {
          msg = `Error GPS: ${err.message}`
        }
        setErrorMessage(msg)
        setLoading(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 5000,
      }
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem', width: '100%', maxWidth: '380px', margin: '0 auto' }}>
      {isHariLibur && (
        <div
          style={{
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            background: 'var(--accent-soft)',
            color: 'var(--accent)',
            fontSize: '0.85rem',
            fontWeight: 600,
            textAlign: 'center',
            border: '1px solid rgba(249, 115, 22, 0.25)',
            width: '100%',
          }}
        >
          🎉 Hari ini Jadwal Libur Mingguan Anda. Jika Anda masuk hari ini, Anda berhak mendapat bonus Rp 50.000!
        </div>
      )}

      {/* Indikator Akurasi GPS */}
      {gpsAccuracy !== null && (
        <div style={{ fontSize: '0.8rem', color: gpsAccuracy <= 20 ? 'var(--success)' : 'var(--warning)', display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600 }}>
          <span>🛰️ Akurasi GPS: ±{gpsAccuracy}m</span>
          <span>{gpsAccuracy <= 20 ? '(Sinyal Akurat)' : '(Sinyal Sedang)'}</span>
        </div>
      )}

      {errorMessage && (
        <div
          style={{
            padding: '0.85rem 1rem',
            borderRadius: 'var(--radius-md)',
            background: 'var(--danger-bg)',
            color: 'var(--danger)',
            fontSize: '0.85rem',
            fontWeight: 600,
            textAlign: 'center',
            border: '1px solid rgba(220, 38, 38, 0.25)',
            width: '100%',
          }}
        >
          {errorMessage}
        </div>
      )}

      {statusMessage && (
        <div
          style={{
            padding: '0.85rem 1rem',
            borderRadius: 'var(--radius-md)',
            background: 'var(--success-bg)',
            color: 'var(--success)',
            fontSize: '0.85rem',
            fontWeight: 600,
            textAlign: 'center',
            border: '1px solid rgba(22, 163, 74, 0.25)',
            width: '100%',
          }}
        >
          {statusMessage}
        </div>
      )}

      {/* Modal/Preview Kamera Selfie */}
      {showCamera && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '1.25rem',
            background: 'var(--bg-surface)',
            borderRadius: 'var(--radius-card)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-card)',
            width: '100%',
          }}
        >
          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--ink)' }}>📸 Foto Selfie Kehadiran</div>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{
              width: '100%',
              maxHeight: '220px',
              objectFit: 'cover',
              borderRadius: 'var(--radius-md)',
              background: '#000',
            }}
          />
          <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
            <Button
              variant="outline"
              size="sm"
              style={{ flex: 1 }}
              onClick={() => {
                stopCamera()
                handleLocationAndSubmit(false, null)
              }}
            >
              Lewati Foto
            </Button>
            <Button
              variant="primary"
              size="sm"
              style={{ flex: 1 }}
              onClick={takeSnapshot}
            >
              Ambil Foto
            </Button>
          </div>
        </div>
      )}

      {/* Preview Foto yang sudah diambil sebelum submit */}
      {capturedPhoto && !showCamera && !isCheckedIn && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.85rem',
            padding: '1.25rem',
            background: 'var(--bg-surface)',
            borderRadius: 'var(--radius-card)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-card)',
            width: '100%',
          }}
        >
          <div style={{ fontSize: '0.85rem', color: 'var(--ink-muted)', fontWeight: 600 }}>Foto Siap Dikirim:</div>
          <img
            src={capturedPhoto}
            alt="Selfie Checkin"
            style={{ width: '130px', height: '130px', objectFit: 'cover', borderRadius: '50%', border: '3px solid var(--accent)' }}
          />
          <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
            <Button
              variant="outline"
              size="sm"
              style={{ flex: 1 }}
              onClick={() => {
                setCapturedPhoto(null)
                startCamera()
              }}
            >
              Ulang Foto
            </Button>
            <Button
              variant="primary"
              size="sm"
              style={{ flex: 1 }}
              loading={loading}
              onClick={() => handleLocationAndSubmit(false, capturedPhoto)}
            >
              Kirim Presensi
            </Button>
          </div>
        </div>
      )}

      {/* Tombol Check In / Check Out Utama */}
      {!showCamera && !capturedPhoto && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', width: '100%' }}>
          {loading && (
            <div
              className="fade-up"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                padding: '0.6rem 1.25rem',
                borderRadius: 'var(--radius-pill)',
                background: 'var(--accent-soft)',
                color: 'var(--accent)',
                fontWeight: 700,
                fontSize: '0.85rem',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <span
                style={{
                  width: '14px',
                  height: '14px',
                  border: '2px solid currentColor',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  animation: 'spin 0.65s linear infinite',
                }}
              />
              <span>🛰️ Mengunci Lokasi GPS & Menyimpan Presensi...</span>
            </div>
          )}

          {!isCheckedIn ? (
            <button
              type="button"
              onClick={handleStartCheckIn}
              disabled={loading}
              className={loading ? 'radar-processing' : 'pulse-animation'}
              style={{
                width: '150px',
                height: '150px',
                borderRadius: '50%',
                background: 'var(--accent-gradient)',
                color: '#ffffff',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.35rem',
                fontWeight: 800,
                fontSize: '1.15rem',
                boxShadow: '0 10px 28px rgba(249, 115, 22, 0.45)',
                transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              <span style={{ fontSize: '1.8rem' }}>📍</span>
              <span>{loading ? 'MEMPROSES...' : 'CHECK IN'}</span>
            </button>
          ) : !isCheckedOut ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', width: '100%' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--ink-muted)', fontWeight: 500 }}>Sudah Check-In pada:</div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--success)' }}>
                  {formatJam(todayAttendance.jam_checkin)}
                </div>
              </div>

              <Button
                variant="danger"
                size="lg"
                loading={loading}
                loadingText="Memproses Check-Out..."
                onClick={() => handleLocationAndSubmit(true, null)}
                style={{ width: '100%', maxWidth: '240px', borderRadius: 'var(--radius-pill)' }}
              >
                🛑 CHECK OUT
              </Button>
            </div>
          ) : (
            <div
              style={{
                textAlign: 'center',
                padding: '1.25rem 1.5rem',
                borderRadius: 'var(--radius-card)',
                background: 'var(--bg-surface-muted)',
                border: '1px solid var(--border)',
                width: '100%',
              }}
            >
              <span style={{ fontSize: '1.75rem' }}>✅</span>
              <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--ink)', marginTop: '0.35rem' }}>
                Absensi Hari Ini Lengkap
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--ink-muted)', marginTop: '0.25rem', fontWeight: 500 }}>
                In: {formatJam(todayAttendance.jam_checkin)} • Out: {formatJam(todayAttendance.jam_checkout)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
