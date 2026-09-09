import { DEFAULT_SETTINGS, ATTENDANCE_STATUS } from '@/lib/constants'

/**
 * Menghitung selisih menit antara jam check-in aktual dengan jam masuk standar.
 * @param {Date|string} checkInTime - Waktu check in aktual
 * @param {string} jamMasukStr - Format "HH:mm" atau "HH:mm:ss" (default: "07:00")
 * @returns {number} Menit keterlambatan (>= 0)
 */
export function hitungMenitTelat(checkInTime, jamMasukStr = '07:00') {
  const checkIn = new Date(checkInTime)
  const [jam, menit] = jamMasukStr.split(':').map(Number)

  // Tanggal yang sama dengan check-in tapi jam target masuk
  const targetMasuk = new Date(checkIn)
  targetMasuk.setHours(jam, menit, 0, 0)

  const diffMs = checkIn.getTime() - targetMasuk.getTime()
  if (diffMs <= 0) return 0

  return Math.floor(diffMs / (1000 * 60))
}

/**
 * Menghitung potongan keterlambatan bertingkat sesuai PRD Bagian 6:
 * - 0 - 5 menit: toleransi (Rp 0)
 * - 10 menit pertama setelah toleransi: Rp 1.000 / menit
 * - 10 menit kedua setelah itu: Rp 2.000 / menit
 * - Lebih dari itu (>20 menit setelah toleransi / >25 menit dari jam masuk): flat Rp 50.000
 */
export function hitungPotonganTelat(menitTelat, settings = DEFAULT_SETTINGS) {
  const toleransi = settings.toleransi_telat_menit ?? 5
  const menitSetelahToleransi = menitTelat - toleransi

  if (menitSetelahToleransi <= 0) {
    return 0
  }

  const t1Durasi = settings.tier1_durasi ?? 10
  const t2Durasi = settings.tier2_durasi ?? 10
  const t1Rate = settings.tier1_rate ?? 1000
  const t2Rate = settings.tier2_rate ?? 2000
  const flatMax = settings.tier3_flat ?? 50000

  // Jika lewat dari tier 1 + tier 2 (> 20 menit setelah toleransi)
  if (menitSetelahToleransi > t1Durasi + t2Durasi) {
    return flatMax
  }

  let totalPotongan = 0

  // Tier 1
  const t1Menit = Math.min(menitSetelahToleransi, t1Durasi)
  totalPotongan += t1Menit * t1Rate

  // Tier 2
  const sisaMenit = menitSetelahToleransi - t1Durasi
  if (sisaMenit > 0) {
    const t2Menit = Math.min(sisaMenit, t2Durasi)
    totalPotongan += t2Menit * t2Rate
  }

  return totalPotongan
}

/**
 * Menentukan status absensi berdasarkan waktu check in dan hari libur
 */
export function tentukanStatusAbsensi(checkInTime, employeeHariLibur, settings = DEFAULT_SETTINGS) {
  const checkIn = new Date(checkInTime)
  const dayOfWeek = checkIn.getDay() // 0 = Minggu, 1 = Senin, ...
  const isHariLibur = dayOfWeek === employeeHariLibur

  const menitTelat = hitungMenitTelat(checkIn, settings.jam_masuk || '07:00')
  const toleransi = settings.toleransi_telat_menit ?? 5

  if (menitTelat > toleransi) {
    return {
      status: ATTENDANCE_STATUS.TELAT,
      menitTelat,
      potonganTelat: hitungPotonganTelat(menitTelat, settings),
      isHariLibur,
    }
  }

  return {
    status: ATTENDANCE_STATUS.HADIR,
    menitTelat: 0,
    potonganTelat: 0,
    isHariLibur,
  }
}
