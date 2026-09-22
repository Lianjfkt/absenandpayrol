import { DEFAULT_SETTINGS, ATTENDANCE_STATUS } from '../constants.js'
import { hitungPotonganTelat } from './attendance.js'

/**
 * Menghitung start date dan end date periode payroll untuk satu karyawan.
 *
 * `periodeBulan` adalah bulan di mana GAJIAN jatuh (bulan berakhirnya periode).
 *
 * Contoh: karyawan bergabung tgl 18, periodeBulan=9 (September), periodeTahun=2026
 *   -> startDate: 2026-08-18  (tgl bergabung di bulan sebelumnya)
 *   -> endDate:   2026-09-17  (sehari sebelum tgl bergabung di bulan gajian)
 *
 * Karyawan bergabung tgl 1 (atau tanpa tanggal_mulai):
 *   -> periode tetap = 1 s/d akhir bulan (kalender normal)
 *
 * @param {object} employee  - profil karyawan (butuh: tanggal_mulai)
 * @param {number} periodeBulan - bulan GAJIAN / bulan berakhir periode (1-12)
 * @param {number} periodeTahun - tahun gajian
 * @returns {{ startDate: string, endDate: string, tglGajian: number }}
 */
export function getPayrollPeriod(employee, periodeBulan, periodeTahun) {
  // Parse hari dari string "YYYY-MM-DD" langsung — aman dari timezone shift
  const tanggalMulai = employee?.tanggal_mulai || null
  let tglGajian = 1
  if (tanggalMulai) {
    tglGajian = parseInt(tanggalMulai.split('-')[2], 10) || 1
  }

  const mm = String(periodeBulan).padStart(2, '0')

  if (tglGajian === 1) {
    // Periode kalender normal: 1 s/d akhir bulan
    const lastDay = new Date(Date.UTC(periodeTahun, periodeBulan, 0)).getUTCDate()
    return {
      startDate: `${periodeTahun}-${mm}-01`,
      endDate: `${periodeTahun}-${mm}-${String(lastDay).padStart(2, '0')}`,
      tglGajian,
    }
  }

  // Periode bulan gajian M: dari tglGajian bulan M-1 s/d (tglGajian - 1) di bulan M
  const prevMonth = periodeBulan === 1 ? 12 : periodeBulan - 1
  const prevYear = periodeBulan === 1 ? periodeTahun - 1 : periodeTahun
  const lastDayPrev = new Date(Date.UTC(prevYear, prevMonth, 0)).getUTCDate()
  const startDayNum = Math.min(tglGajian, lastDayPrev)

  const lastDayCur = new Date(Date.UTC(periodeTahun, periodeBulan, 0)).getUTCDate()
  const endDayNum = Math.min(tglGajian - 1, lastDayCur)

  const startDate = `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(startDayNum).padStart(2, '0')}`
  const endDate = `${periodeTahun}-${mm}-${String(endDayNum).padStart(2, '0')}`

  return { startDate, endDate, tglGajian }
}

/**
 * Menentukan periode payroll (bulan dan tahun gajian) untuk tanggal absensi tertentu.
 * Konsisten 100% dengan getPayrollPeriod.
 * @param {object} employee - profil karyawan (tanggal_mulai)
 * @param {string} dateStr - tanggal format "YYYY-MM-DD"
 * @returns {{ periodeBulan: number, periodeTahun: number }}
 */
export function getPayrollPeriodForDate(employee, dateStr) {
  const tanggalMulai = employee?.tanggal_mulai || null
  let tglGajian = 1
  if (tanggalMulai) {
    tglGajian = parseInt(tanggalMulai.split('-')[2], 10) || 1
  }

  const [yStr, mStr, dStr] = dateStr.split('-')
  const year = parseInt(yStr, 10)
  const month = parseInt(mStr, 10)
  const day = parseInt(dStr, 10)

  if (tglGajian === 1) {
    return { periodeBulan: month, periodeTahun: year }
  }

  // Jika tanggal absensi < tglGajian, masuk periode gajian bulan ini (month, year).
  // Jika tanggal absensi >= tglGajian, masuk periode gajian bulan depan.
  if (day < tglGajian) {
    return { periodeBulan: month, periodeTahun: year }
  } else {
    const nextMonth = month === 12 ? 1 : month + 1
    const nextYear = month === 12 ? year + 1 : year
    return { periodeBulan: nextMonth, periodeTahun: nextYear }
  }
}

/**
 * Menghitung rekap payroll karyawan untuk 1 periode berdasarkan tanggal bergabung.
 * Periode = startDate s/d endDate.
 *
 * Formula:
 * Total Gaji = Gaji Pokok + Total Bonus - Total Potongan + Adjustment
 */
export function kalkulasiPayrollKaryawan({
  employee,
  attendances = [],
  bonuses = [],
  loans = [],
  settings = DEFAULT_SETTINGS,
  adjustment = 0,
  periodeBulan,
  periodeTahun,
}) {
  let totalHariHadir = 0
  let totalHariTelat = 0
  let totalHariOff = 0
  let totalHariLiburMasuk = 0
  let totalPotonganTelat = 0

  const bonusMasukLiburRate = settings.bonus_masuk_libur ?? 50000
  const potonganOffRate = settings.potongan_off ?? 50000

  const { startDate, endDate } = getPayrollPeriod(employee, periodeBulan, periodeTahun)

  // Tanggal hari ini dalam WIB (UTC+7) secara eksplisit
  const now = new Date()
  const wibTime = new Date(now.getTime() + 7 * 60 * 60 * 1000)
  const todayStr = wibTime.toISOString().split('T')[0]

  // Map attendance berdasarkan tanggal untuk akses O(1)
  const attendanceMap = new Map()
  attendances.forEach((att) => {
    attendanceMap.set(att.tanggal, att)
  })

  // Iterasi setiap hari dalam range startDate – endDate
  const cursor = new Date(startDate + 'T00:00:00Z')
  const endCursor = new Date(endDate + 'T00:00:00Z')

  while (cursor <= endCursor) {
    const dateStr = cursor.toISOString().split('T')[0]

    // Lewati hari sebelum karyawan resmi bergabung
    if (employee.tanggal_mulai && dateStr < employee.tanggal_mulai) {
      cursor.setUTCDate(cursor.getUTCDate() + 1)
      continue
    }

    const dayOfWeek = cursor.getUTCDay()
    const isWeeklyOff = dayOfWeek === employee.hari_libur

    const att = attendanceMap.get(dateStr)

    if (att) {
      if (isWeeklyOff) {
        if (att.status === ATTENDANCE_STATUS.HADIR || att.status === ATTENDANCE_STATUS.TELAT) {
          totalHariLiburMasuk++
          if (att.status === ATTENDANCE_STATUS.TELAT) {
            totalHariTelat++
            let pTelat = Number(att.potongan_telat)
            if (isNaN(pTelat) || (pTelat === 0 && (att.menit_telat || 0) > (settings.toleransi_telat_menit ?? 5))) {
              pTelat = hitungPotonganTelat(att.menit_telat || 0, settings)
            }
            totalPotonganTelat += (pTelat || 0)
          } else {
            totalHariHadir++
          }
        }
      } else {
        if (att.status === ATTENDANCE_STATUS.HADIR) {
          totalHariHadir++
        } else if (att.status === ATTENDANCE_STATUS.TELAT) {
          totalHariTelat++
          let pTelat = Number(att.potongan_telat)
          if (isNaN(pTelat) || (pTelat === 0 && (att.menit_telat || 0) > (settings.toleransi_telat_menit ?? 5))) {
            pTelat = hitungPotonganTelat(att.menit_telat || 0, settings)
          }
          totalPotonganTelat += (pTelat || 0)
        } else if (att.status === ATTENDANCE_STATUS.OFF) {
          totalHariOff++
        }
      }
    } else {
      // Tidak ada data absensi: hanya hitung off/alpa jika tanggal sudah lewat atau hari ini (<= todayStr) dan bukan libur mingguan
      if (dateStr <= todayStr && !isWeeklyOff) {
        totalHariOff++
      }
    }

    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }

  const totalPotonganOff = totalHariOff * potonganOffRate
  const totalBonusLibur = totalHariLiburMasuk * bonusMasukLiburRate

  // Bonus manual pada periode ini
  const totalBonusManual = bonuses
    .reduce((acc, b) => acc + Number(b.nominal || 0), 0)

  const totalPotonganKasbon = loans.reduce((acc, l) => {
    const cicilan = Math.min(Number(l.sisa_pinjaman || 0), Number(l.cicilan_per_bulan || 0))
    return acc + cicilan
  }, 0)

  const totalPotongan = totalPotonganTelat + totalPotonganOff + totalPotonganKasbon
  const totalBonus = totalBonusLibur + totalBonusManual

  const gajiPokok = Number(employee.gaji_pokok || 0)
  const totalGaji = Math.max(0, gajiPokok + totalBonus - totalPotongan + Number(adjustment || 0))

  return {
    employee_id: employee.id,
    periode_bulan: periodeBulan,
    periode_tahun: periodeTahun,
    gaji_pokok: gajiPokok,
    total_hari_hadir: totalHariHadir,
    total_hari_telat: totalHariTelat,
    total_hari_off: totalHariOff,
    total_hari_libur_masuk: totalHariLiburMasuk,
    total_potongan_telat: totalPotonganTelat,
    total_potongan_off: totalPotonganOff,
    total_potongan_kasbon: totalPotonganKasbon,
    total_bonus_libur: totalBonusLibur,
    total_bonus_manual: totalBonusManual,
    adjustment: Number(adjustment || 0),
    total_gaji: totalGaji,
    periode_start: startDate,
    periode_end: endDate,
  }
}

/**
 * Helper untuk memastikan payload yang dikirim ke Supabase hanya berisi field
 * yang valid di tabel `public.payroll` (menghindari error column not found).
 */
export function sanitizePayrollPayload(calcResult = {}) {
  const {
    employee_id,
    periode_bulan,
    periode_tahun,
    gaji_pokok,
    total_hari_hadir,
    total_hari_telat,
    total_hari_off,
    total_hari_libur_masuk,
    total_potongan_telat,
    total_potongan_off,
    total_potongan_kasbon,
    total_bonus_libur,
    total_bonus_manual,
    adjustment,
    keterangan_adjustment,
    total_gaji,
    status,
    status_pembayaran,
    tanggal_dibayar,
    updated_at,
  } = calcResult

  const payload = {}

  if (employee_id !== undefined) payload.employee_id = employee_id
  if (periode_bulan !== undefined) payload.periode_bulan = Number(periode_bulan)
  if (periode_tahun !== undefined) payload.periode_tahun = Number(periode_tahun)
  if (gaji_pokok !== undefined) payload.gaji_pokok = Number(gaji_pokok)
  if (total_hari_hadir !== undefined) payload.total_hari_hadir = Number(total_hari_hadir)
  if (total_hari_telat !== undefined) payload.total_hari_telat = Number(total_hari_telat)
  if (total_hari_off !== undefined) payload.total_hari_off = Number(total_hari_off)
  if (total_hari_libur_masuk !== undefined) payload.total_hari_libur_masuk = Number(total_hari_libur_masuk)
  if (total_potongan_telat !== undefined) payload.total_potongan_telat = Number(total_potongan_telat)
  if (total_potongan_off !== undefined) payload.total_potongan_off = Number(total_potongan_off)
  if (total_potongan_kasbon !== undefined) payload.total_potongan_kasbon = Number(total_potongan_kasbon)
  if (total_bonus_libur !== undefined) payload.total_bonus_libur = Number(total_bonus_libur)
  if (total_bonus_manual !== undefined) payload.total_bonus_manual = Number(total_bonus_manual)
  if (adjustment !== undefined) payload.adjustment = Number(adjustment)
  if (keterangan_adjustment !== undefined) payload.keterangan_adjustment = keterangan_adjustment
  if (total_gaji !== undefined) payload.total_gaji = Number(total_gaji)
  if (status !== undefined) payload.status = status
  if (status_pembayaran !== undefined) payload.status_pembayaran = status_pembayaran
  if (tanggal_dibayar !== undefined) payload.tanggal_dibayar = tanggal_dibayar
  if (updated_at !== undefined) payload.updated_at = updated_at

  return payload
}
