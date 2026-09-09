import { DEFAULT_SETTINGS, ATTENDANCE_STATUS } from '@/lib/constants'

/**
 * Menghitung rekap payroll karyawan untuk 1 periode bulan & tahun tertentu.
 * Formula dasar:
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

  // 1. Rekap data kehadiran harian
  attendances.forEach((att) => {
    if (att.status === ATTENDANCE_STATUS.HADIR) {
      totalHariHadir++
    } else if (att.status === ATTENDANCE_STATUS.TELAT) {
      totalHariTelat++
      totalPotonganTelat += Number(att.potongan_telat || 0)
    } else if (att.status === ATTENDANCE_STATUS.OFF) {
      totalHariOff++
    }

    // Cek apakah hari kehadiran adalah hari libur mingguan karyawan
    const tgl = new Date(att.tanggal)
    const dayOfWeek = tgl.getDay()
    if (dayOfWeek === employee.hari_libur && (att.status === ATTENDANCE_STATUS.HADIR || att.status === ATTENDANCE_STATUS.TELAT)) {
      totalHariLiburMasuk++
    }
  })

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
