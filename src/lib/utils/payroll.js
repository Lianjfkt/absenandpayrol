import { DEFAULT_SETTINGS, ATTENDANCE_STATUS } from '../constants.js'

/**
 * Menghitung rekap payroll karyawan untuk 1 periode bulan & tahun tertentu.
 * Termasuk deteksi otomatis hari kerja yang bolos (Alpa / Off tanpa izin).
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

  // Tentukan jumlah hari dalam bulan periode
  const daysInMonth = new Date(periodeTahun, periodeBulan, 0).getDate()
  
  // Tentukan batas hari evaluasi (jika bulan berjalan, evaluasi sampai hari ini; jika bulan lalu, evaluasi full sebulan)
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1
  const todayDate = now.getDate()

  let maxEvalDay = daysInMonth
  if (periodeTahun === currentYear && periodeBulan === currentMonth) {
    maxEvalDay = Math.min(daysInMonth, todayDate)
  } else if (periodeTahun > currentYear || (periodeTahun === currentYear && periodeBulan > currentMonth)) {
    // Periode masa depan
    maxEvalDay = 0
  }

  // Map attendance berdasarkan tanggal untuk akses O(1)
  const attendanceMap = new Map()
  attendances.forEach((att) => {
    attendanceMap.set(att.tanggal, att)
  })

  // 1. Evaluasi hari demi hari dalam periode
  for (let day = 1; day <= maxEvalDay; day++) {
    const dayStr = String(day).padStart(2, '0')
    const monthStr = String(periodeBulan).padStart(2, '0')
    const dateStr = `${periodeTahun}-${monthStr}-${dayStr}`

    // Jika tanggal evaluasi sebelum tanggal karyawan resmi bergabung, lewati (bukan alpa/off)
    if (employee.tanggal_mulai && dateStr < employee.tanggal_mulai) {
      continue
    }
    
    const tgl = new Date(periodeTahun, periodeBulan - 1, day)
    const dayOfWeek = tgl.getDay() // 0 = Minggu, 1 = Senin, ...
    const isWeeklyOff = dayOfWeek === employee.hari_libur

    const att = attendanceMap.get(dateStr)

    if (isWeeklyOff) {
      // Hari Libur Mingguan Karyawan
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
      // Hari Kerja Normal Karyawan: jika tidak hadir/masuk -> potong Rp 50.000 (totalHariOff)
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
        // Tidak ada record absensi pada hari kerja -> Otomatis Off/Alpa
        totalHariOff++
      }
    }
  }

  // 2. Hitung komponen potongan & bonus
  const totalPotonganOff = totalHariOff * potonganOffRate
  const totalBonusLibur = totalHariLiburMasuk * bonusMasukLiburRate
  const totalBonusManual = bonuses.reduce((acc, b) => acc + Number(b.nominal || 0), 0)

  // Hitung cicilan kasbon aktif
  const totalPotonganKasbon = loans.reduce((acc, l) => {
    const cicilan = Math.min(Number(l.sisa_pinjaman || 0), Number(l.cicilan_per_bulan || 0))
    return acc + cicilan
  }, 0)

  const totalPotongan = totalPotonganTelat + totalPotonganOff + totalPotonganKasbon
  const totalBonus = totalBonusLibur + totalBonusManual

  // 3. Formula final
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
  }
}

