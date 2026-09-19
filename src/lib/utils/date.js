/**
 * Helper utilitas penanggalan & zona waktu WIB (UTC+7)
 * Menjamin konsistensi tanggal & jam di seluruh komponen Server dan Client
 */

/**
 * Mendapatkan objek Date saat ini dalam representasi waktu WIB (UTC+7)
 */
export function getNowWIB() {
  const now = new Date()
  return new Date(now.getTime() + 7 * 60 * 60 * 1000)
}

/**
 * Mendapatkan string tanggal hari ini dalam format YYYY-MM-DD (WIB)
 */
export function getTodayStrWIB() {
  return getNowWIB().toISOString().split('T')[0]
}

/**
 * Format tanggal ke bahasa Indonesia
 * Contoh: "2026-09-19" -> "19 September 2026"
 */
export function formatDateID(dateStr, options = {}) {
  if (!dateStr) return '-'
  try {
    const d = new Date(dateStr.includes('T') ? dateStr : `${dateStr}T00:00:00Z`)
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: options.month || 'long',
      year: 'numeric',
      timeZone: 'UTC',
      ...options,
    })
  } catch {
    return dateStr
  }
}

/**
 * Format jam menit WIB
 * Contoh: "2026-09-19T08:15:00Z" -> "15:15"
 */
export function formatTimeID(timeStr) {
  if (!timeStr) return '-'
  try {
    const d = new Date(timeStr)
    return d.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Jakarta',
    })
  } catch {
    return timeStr
  }
}
