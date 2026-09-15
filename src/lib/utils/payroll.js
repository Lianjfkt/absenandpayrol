import { DEFAULT_SETTINGS, ATTENDANCE_STATUS } from '../constants.js'

/**
 * Menghitung start date dan end date periode payroll untuk satu karyawan.
 * Periode dihitung selama 1 bulan penuh mulai dari tanggal bergabung (tanggal_mulai).
 *
 * Contoh: karyawan bergabung tgl 15, periode Oktober 2025
 *   → startDate: 2025-10-15
 *   → endDate:   2025-11-14
 *
 * Fallback ke tgl 1 jika tanggal_mulai tidak ada.
 *
 * @param {object} employee - object profil karyawan (butuh: tanggal_mulai)
 * @param {number} periodeBulan - bulan di mana periode MULAI (1-12)
 * @param {number} periodeTahun - tahun di mana periode mulai
 * @returns {{ startDate: string, endDate: string, tglGajian: number }}
 */
export function getPayrollPeriod(employee, periodeBulan, periodeTahun) {
  const joinDate = employee?.tanggal_mulai ? new Date(employee.tanggal_mulai) : null
  const tglGajian = joinDate ? joinDate.getDate() : 1

  const startDate = `${periodeTahun}-${String(periodeBulan).padStart(2, '0')}-${String(tglGajian).padStart(2, '0')}`

  // End date = 1 hari sebelum tanggal gajian di bulan berikutnya
  const nextMonthYear = periodeBulan === 12 ? periodeTahun + 1 : periodeTahun
  const nextMonth = periodeBulan === 12 ? 1 : periodeBulan + 1
  const endDateObj = new Date(nextMonthYear, nextMonth - 1, tglGajian - 1)
  const endDate = endDateObj.toISOString().split('T')[0]

  return { startDate, endDate, tglGajian }
}

/**
 * Menghitung rekap payroll karyawan untuk 1 periode berdasarkan tanggal bergabung.
 * Periode = startDate s/d endDate (bukan 1 – akhir bulan kalender).
 *
 * Formula dasar:
 * Total Gaji = Gaji Pokok + Total Bonus - Total Potongan + Adjustment
 */
export function kalkulasiPayrollKaryawan({
  employee,
  attendances = [],
  bonuses = [],
  loans = [],
  leaves = [],
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

  // Batas evaluasi: jika periode masih berjalan, evaluasi sampai hari ini
  const todayStr = new Date().toISOString().split('T')[0]
  const maxEvalDate = endDate < todayStr ? endDate : todayStr

  // Map attendance berdasarkan tanggal untuk akses O(1)
  const attendanceMap = new Map()
  attendances.forEach((att) => {
    attendanceMap.set(att.tanggal, att)
  })

  // Iterasi setiap hari dalam range startDate – maxEvalDate
  const cursor = new Date(startDate + 'T00:00:00')
  const maxDate = new Date(maxEvalDate + 'T00:00:00')

  while (cursor <= maxDate) {
    const dateStr = cursor.toISOString().split('T')[0]

    if (employee.tanggal_mulai && dateStr < employee.tanggal_mulai) {
      cursor.setDate(cursor.getDate() + 1)
      continue
    }

    const dayOfWeek = cursor.getDay()
    const isWeeklyOff = dayOfWeek === employee.hari_libur

    const att = attendanceMap.get(dateStr)

    if (isWeeklyOff) {
      if (att && (att.status === ATTENDANCE_STATUS.HADIR || att.status === ATTENDANCE_STATUS.TELAT)) {
        totalHariLiburMasuk++
        if (att.status === ATTENDANCE_STATUS.TELAT) {
          totalHariTelat++
          totalPotonganTelat += Number(att.potongan_telat || 0)
        } else {
          totalHariHadir++
        }
      }
    } else {
      if (att) {
        if (att.status === ATTENDANCE_STATUS.HADIR) {
          totalHariHadir++
        } else if (att.status === ATTENDANCE_STATUS.TELAT) {
          totalHariTelat++
          totalPotonganTelat += Number(att.potongan_telat || 0)
        } else if (att.status === ATTENDANCE_STATUS.OFF) {
          totalHariOff++
        }
      } else {
        totalHariOff++
      }
    }

    cursor.setDate(cursor.getDate() + 1)
  }

  const totalPotonganOff = totalHariOff * potonganOffRate
  const totalBonusLibur = totalHariLiburMasuk * bonusMasukLiburRate

  // Bonus difilter berdasarkan range tanggal periode (bukan bulan kalender)
  const totalBonusManual = bonuses
    .filter((b) => {
      if (!b.tanggal) return true // backward compat
      return b.tanggal >= startDate && b.tanggal <= endDate
    })
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
