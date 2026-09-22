'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { manualAttendanceOverrideAction, deleteAttendanceAction } from '@/actions/attendance'
import { CheckInButton } from '@/components/attendance/CheckInButton'
import { FotoCheckinPreview } from '@/components/attendance/FotoCheckinPreview'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { formatTanggal, formatJam, formatRupiah, ATTENDANCE_STATUS } from '@/lib/constants'
import { hitungMenitTelat, hitungPotonganTelat } from '@/lib/utils/attendance'

export function AbsensiClientView({
  isOwner,
  todayAttendance,
  isHariLibur,
  history = [],
  employees = [],
  settings = {},
  userProfile = null,
}) {
  const router = useRouter()

  // Real-time subscription untuk tabel attendance
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('realtime_attendance_feed')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'attendance' },
        () => {
          router.refresh()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [router])
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [filterEmployee, setFilterEmployee] = useState('')

  // Form states for manual attendance
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('')
  const [selectedTanggal, setSelectedTanggal] = useState(new Date().toISOString().split('T')[0])
  const [selectedStatus, setSelectedStatus] = useState(ATTENDANCE_STATUS.HADIR)
  const [jamMasuk, setJamMasuk] = useState(settings?.jam_masuk ? settings.jam_masuk.slice(0, 5) : '07:00')
  const [jamPulang, setJamPulang] = useState(settings?.jam_pulang ? settings.jam_pulang.slice(0, 5) : '18:00')
  const [potonganTelat, setPotonganTelat] = useState(0)
  const [menitTelat, setMenitTelat] = useState(0)
  const [catatan, setCatatan] = useState('Lupa absen masuk')

  const openManualModal = (existingData = null) => {
    setErrorMsg('')
    setSuccessMsg('')
    if (existingData) {
      setSelectedEmployeeId(existingData.employee_id || '')
      setSelectedTanggal(existingData.tanggal || new Date().toISOString().split('T')[0])
      setSelectedStatus(existingData.status || ATTENDANCE_STATUS.HADIR)
      
      let inTime = settings?.jam_masuk ? settings.jam_masuk.slice(0, 5) : '07:00'
      if (existingData.jam_checkin) {
        const d = new Date(existingData.jam_checkin)
        const hh = String(d.getHours()).padStart(2, '0')
        const mm = String(d.getMinutes()).padStart(2, '0')
        inTime = `${hh}:${mm}`
      }
      setJamMasuk(inTime)

      let outTime = settings?.jam_pulang ? settings.jam_pulang.slice(0, 5) : '18:00'
      if (existingData.jam_checkout) {
        const d = new Date(existingData.jam_checkout)
        const hh = String(d.getHours()).padStart(2, '0')
        const mm = String(d.getMinutes()).padStart(2, '0')
        outTime = `${hh}:${mm}`
      }
      setJamPulang(outTime)

      setPotonganTelat(existingData.potongan_telat || 0)
      setMenitTelat(existingData.menit_telat || 0)
      setCatatan(existingData.catatan || 'Koreksi manual oleh owner')
    } else {
      setSelectedEmployeeId(employees[0]?.id || '')
      setSelectedTanggal(new Date().toISOString().split('T')[0])
      setSelectedStatus(ATTENDANCE_STATUS.HADIR)
      setJamMasuk(settings?.jam_masuk ? settings.jam_masuk.slice(0, 5) : '07:00')
      setJamPulang(settings?.jam_pulang ? settings.jam_pulang.slice(0, 5) : '18:00')
      setPotonganTelat(0)
      setMenitTelat(0)
      setCatatan('Lupa absen masuk')
    }
    setShowModal(true)
  }

  // Auto calculate late minutes and late deduction when jamMasuk or status changes
  const handleJamMasukChange = (val) => {
    setJamMasuk(val)
    if (selectedStatus === ATTENDANCE_STATUS.TELAT && val && selectedTanggal) {
      try {
        const checkInDate = new Date(`${selectedTanggal}T${val}:00+07:00`)
        const mTelat = hitungMenitTelat(checkInDate, settings?.jam_masuk || '07:00')
        const pTelat = hitungPotonganTelat(mTelat, settings)
        setMenitTelat(mTelat)
        setPotonganTelat(pTelat)
      } catch (err) {
        console.error('Hitung telat error:', err)
      }
    }
  }

  const handleStatusChange = (val) => {
    setSelectedStatus(val)
    if (val === ATTENDANCE_STATUS.TELAT) {
      const checkInDate = new Date(`${selectedTanggal}T${jamMasuk}:00+07:00`)
      const mTelat = hitungMenitTelat(checkInDate, settings?.jam_masuk || '07:00')
      const pTelat = hitungPotonganTelat(mTelat, settings)
      setMenitTelat(mTelat)
      setPotonganTelat(pTelat > 0 ? pTelat : (settings?.potongan_telat_default || 5000))
    } else if (val === ATTENDANCE_STATUS.HADIR) {
      setPotonganTelat(0)
      setMenitTelat(0)
    } else {
      setPotonganTelat(0)
      setMenitTelat(0)
    }
  }

  const handleSubmitManual = async (e) => {
    e.preventDefault()
    if (!selectedEmployeeId) {
      setErrorMsg('Pilih karyawan terlebih dahulu.')
      return
    }

    setLoading(true)
    setErrorMsg('')
    setSuccessMsg('')

    const formData = new FormData()
    formData.append('employee_id', selectedEmployeeId)
    formData.append('tanggal', selectedTanggal)
    formData.append('status', selectedStatus)
    formData.append('jam_masuk', selectedStatus === 'off' || selectedStatus === 'libur_mingguan' ? '' : jamMasuk)
    formData.append('jam_pulang', selectedStatus === 'off' || selectedStatus === 'libur_mingguan' ? '' : jamPulang)
    formData.append('menit_telat', menitTelat.toString())
    formData.append('potongan_telat', potonganTelat.toString())
    formData.append('catatan', catatan)

    try {
      const res = await manualAttendanceOverrideAction(formData)
      if (res?.error) {
        setErrorMsg(res.error)
      } else {
        setShowModal(false)
        setSuccessMsg('Absensi manual berhasil disimpan!')
        router.refresh()
      }
    } catch (err) {
      setErrorMsg(`Gagal menyimpan absensi: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAttendance = async (id, nama, tgl) => {
    if (!confirm(`Hapus data absensi ${nama} pada tanggal ${formatTanggal(tgl)}?`)) {
      return
    }

    try {
      const res = await deleteAttendanceAction(id)
      if (res?.error) {
        alert(res.error)
      } else {
        router.refresh()
      }
    } catch (err) {
      alert(`Gagal menghapus: ${err.message}`)
    }
  }

  const filteredHistory = useMemo(() => {
    if (!filterEmployee) return history
    return history.filter((h) => h.employee_id === filterEmployee)
  }, [history, filterEmployee])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.02em', margin: 0 }}>
            {isOwner ? 'Presensi & Monitoring Staf' : 'Absensi GPS Kedai'}
          </h1>
          <p style={{ color: 'var(--ink-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            {isOwner
              ? 'Pantau log lokasi & waktu masuk seluruh staf kedai, atau input manual jika staf lupa absen.'
              : 'Lakukan check-in & check-out saat Anda tiba di lokasi kedai.'}
          </p>
        </div>

        {isOwner && (
          <Button variant="primary" onClick={() => openManualModal()}>
            + Input Absensi Manual
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

      {/* Area Check-In untuk Karyawan atau Owner */}
      <Card style={{ padding: '2rem 1.25rem', display: 'flex', justifyContent: 'center' }}>
        <CheckInButton todayAttendance={todayAttendance} isHariLibur={isHariLibur} />
      </Card>

      {/* Riwayat Absensi */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--ink)', margin: 0 }}>
            {isOwner ? 'Riwayat Absensi Seluruh Tim' : 'Riwayat Absensi Saya'}
          </h2>

          {isOwner && employees.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--ink-muted)', fontWeight: 600 }}>Filter Staf:</span>
              <select
                value={filterEmployee}
                onChange={(e) => setFilterEmployee(e.target.value)}
                style={{
                  padding: '0.4rem 0.75rem',
                  fontSize: '0.85rem',
                  borderRadius: 'var(--radius-input)',
                  border: '1px solid var(--border)',
                  background: 'var(--surface-muted)',
                  color: 'var(--ink)',
                  fontWeight: 600,
                  outline: 'none',
                }}
              >
                <option value="">Semua Staf ({history.length})</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.nama}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filteredHistory.length === 0 ? (
            <Card style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--ink-muted)' }}>
              Belum ada data riwayat absensi.
            </Card>
          ) : (
            filteredHistory.map((att) => {
              let badgeVariant = 'default'
              if (att.status === 'hadir') badgeVariant = 'success'
              if (att.status === 'telat') badgeVariant = 'warning'
              if (att.status === 'off') badgeVariant = 'danger'
              if (att.status === 'libur_mingguan') badgeVariant = 'info'

              return (
                <Card
                  key={att.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                    padding: '1.1rem 1.25rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                    {/* Foto Check-In Thumbnail */}
                    <FotoCheckinPreview
                      fotoCheckin={att.foto_checkin}
                      namaKaryawan={att.profiles?.nama || ''}
                      tanggal={att.tanggal}
                      jamCheckin={att.jam_checkin}
                      accuracy={att.accuracy_meter}
                    />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {isOwner && att.profiles && (
                          <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--ink)' }}>
                            {att.profiles.nama}
                          </span>
                        )}
                        {att.is_override && (
                          <span
                            style={{
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              background: '#FEF3C7',
                              color: '#92400E',
                              border: '1px solid #FCD34D',
                              padding: '0.15rem 0.5rem',
                              borderRadius: 'var(--radius-pill)',
                              letterSpacing: '0.02em',
                            }}
                          >
                            ✎ MANUAL OWNER
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--ink-muted)', marginTop: '0.2rem' }}>
                        📅 {formatTanggal(att.tanggal)}
                      </div>
                    </div>
                  </div>

                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.35rem' }}>
                      <Badge variant={badgeVariant}>{att.status?.toUpperCase()}</Badge>
                      {att.potongan_telat > 0 && (
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#B91C1C' }}>
                          Potongan: {formatRupiah(att.potongan_telat)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Info Jam Checkin / Checkout */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'var(--surface-muted)',
                      padding: '0.65rem 0.85rem',
                      borderRadius: 'var(--radius-input)',
                      fontSize: '0.825rem',
                      border: '1px solid var(--border)',
                      flexWrap: 'wrap',
                      gap: '0.5rem',
                    }}
                  >
                    <div style={{ display: 'flex', gap: '1.25rem', color: 'var(--ink)' }}>
                      <div>
                        <span style={{ color: 'var(--ink-muted)', fontWeight: 500 }}>Masuk: </span>
                        <strong style={{ fontWeight: 700 }}>
                          {att.jam_checkin ? formatJam(att.jam_checkin) : '-'}
                        </strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--ink-muted)', fontWeight: 500 }}>Pulang: </span>
                        <strong style={{ fontWeight: 700 }}>
                          {att.jam_checkout ? formatJam(att.jam_checkout) : '-'}
                        </strong>
                      </div>
                      {att.menit_telat > 0 && (
                        <div>
                          <span style={{ color: 'var(--warning)', fontWeight: 600 }}>
                            Telat {att.menit_telat} mnt
                          </span>
                        </div>
                      )}
                    </div>

                    {isOwner && (
                      <div style={{ display: 'flex', gap: '0.35rem' }}>
                        <button
                          type="button"
                          onClick={() => openManualModal(att)}
                          style={{
                            background: 'transparent',
                            border: '1px solid var(--border)',
                            borderRadius: '4px',
                            padding: '0.2rem 0.5rem',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            color: 'var(--accent)',
                            cursor: 'pointer',
                          }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteAttendance(att.id, att.profiles?.nama || 'Karyawan', att.tanggal)}
                          style={{
                            background: 'transparent',
                            border: '1px solid #FECACA',
                            borderRadius: '4px',
                            padding: '0.2rem 0.5rem',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            color: '#DC2626',
                            cursor: 'pointer',
                          }}
                        >
                          Hapus
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Catatan jika ada */}
                  {att.catatan && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--ink-muted)', fontStyle: 'italic', paddingLeft: '0.25rem' }}>
                      💬 {att.catatan}
                    </div>
                  )}
                </Card>
              )
            })
          )}
        </div>
      </div>

      {/* Modal Form Input Manual Absensi */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(23, 23, 23, 0.45)',
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
              maxWidth: '520px',
              maxHeight: '90vh',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--ink)', margin: 0 }}>
                  Input Absensi Manual
                </h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--ink-muted)', margin: '0.2rem 0 0 0' }}>
                  Catat atau koreksi absensi untuk staf yang lupa absen.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                style={{
                  background: 'var(--surface-muted)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  color: 'var(--ink)',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitManual} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Pilih Karyawan */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--ink)' }}>
                  Pilih Karyawan <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <select
                  value={selectedEmployeeId}
                  onChange={(e) => setSelectedEmployeeId(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-input)',
                    background: 'var(--surface-muted)',
                    border: '1px solid var(--border)',
                    color: 'var(--ink)',
                    fontWeight: 600,
                    outline: 'none',
                  }}
                >
                  <option value="">-- Pilih Staf Karyawan --</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.nama} ({emp.jabatan || 'Staf'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Tanggal & Status */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--ink)' }}>
                    Tanggal Absensi <span style={{ color: 'var(--danger)' }}>*</span>
                  </label>
                  <input
                    type="date"
                    value={selectedTanggal}
                    onChange={(e) => setSelectedTanggal(e.target.value)}
                    min={employees.find((e) => e.id === selectedEmployeeId)?.tanggal_mulai || undefined}
                    max={new Date(new Date().getTime() + 7 * 60 * 60 * 1000).toISOString().split('T')[0]}
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-input)',
                      background: 'var(--surface-muted)',
                      border: '1px solid var(--border)',
                      color: 'var(--ink)',
                      fontWeight: 600,
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--ink)' }}>
                    Status Kehadiran <span style={{ color: 'var(--danger)' }}>*</span>
                  </label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-input)',
                      background: 'var(--surface-muted)',
                      border: '1px solid var(--border)',
                      color: 'var(--ink)',
                      fontWeight: 600,
                      outline: 'none',
                    }}
                  >
                    <option value={ATTENDANCE_STATUS.HADIR}>Hadir (Tepat Waktu)</option>
                    <option value={ATTENDANCE_STATUS.TELAT}>Telat (Terlambat)</option>
                    <option value={ATTENDANCE_STATUS.OFF}>Off (Tidak Masuk / Alpa)</option>
                    <option value={ATTENDANCE_STATUS.LIBUR_MINGGUAN}>Libur Mingguan</option>
                  </select>
                </div>
              </div>

              {/* Jam Masuk & Jam Pulang (hanya jika Hadir / Telat) */}
              {(selectedStatus === ATTENDANCE_STATUS.HADIR || selectedStatus === ATTENDANCE_STATUS.TELAT) && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--ink)' }}>
                      Jam Masuk (Check-In)
                    </label>
                    <input
                      type="time"
                      value={jamMasuk}
                      onChange={(e) => handleJamMasukChange(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        borderRadius: 'var(--radius-input)',
                        background: 'var(--surface-muted)',
                        border: '1px solid var(--border)',
                        color: 'var(--ink)',
                        fontWeight: 600,
                        outline: 'none',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--ink)' }}>
                      Jam Pulang (Check-Out)
                    </label>
                    <input
                      type="time"
                      value={jamPulang}
                      onChange={(e) => setJamPulang(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        borderRadius: 'var(--radius-input)',
                        background: 'var(--surface-muted)',
                        border: '1px solid var(--border)',
                        color: 'var(--ink)',
                        fontWeight: 600,
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Potongan Telat (jika status Telat) */}
              {selectedStatus === ATTENDANCE_STATUS.TELAT && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--ink)' }}>
                      Keterlambatan (Menit)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={menitTelat}
                      onChange={(e) => setMenitTelat(parseInt(e.target.value || '0', 10))}
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        borderRadius: 'var(--radius-input)',
                        background: 'var(--surface-muted)',
                        border: '1px solid var(--border)',
                        color: 'var(--ink)',
                        fontWeight: 600,
                        outline: 'none',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--ink)' }}>
                      Potongan Telat (Rp)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={potonganTelat}
                      onChange={(e) => setPotonganTelat(parseInt(e.target.value || '0', 10))}
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        borderRadius: 'var(--radius-input)',
                        background: 'var(--surface-muted)',
                        border: '1px solid var(--border)',
                        color: 'var(--ink)',
                        fontWeight: 600,
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Catatan / Keterangan */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--ink)' }}>
                  Catatan / Keterangan
                </label>
                <input
                  type="text"
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  placeholder="Contoh: Lupa bawa HP / Dispensasi Owner"
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
                <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
                  {['Lupa absen masuk', 'Lupa absen pulang', 'Kendala GPS / HP', 'Izin via WA disetujui'].map((hint) => (
                    <button
                      key={hint}
                      type="button"
                      onClick={() => setCatatan(hint)}
                      style={{
                        fontSize: '0.72rem',
                        background: 'var(--surface-muted)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-pill)',
                        padding: '0.15rem 0.5rem',
                        color: 'var(--ink-muted)',
                        cursor: 'pointer',
                      }}
                    >
                      + {hint}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tombol Aksi */}
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.75rem' }}>
                <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>
                  Batal
                </Button>
                <Button type="submit" variant="primary" loading={loading}>
                  Simpan Absensi
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
