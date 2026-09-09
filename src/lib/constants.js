// === Role Constants ===
export const ROLES = {
  OWNER: 'owner',
  KARYAWAN: 'karyawan',
}

// === Attendance Status ===
export const ATTENDANCE_STATUS = {
  HADIR: 'hadir',
  TELAT: 'telat',
  LIBUR_MINGGUAN: 'libur_mingguan',
  OFF: 'off',
}

// === Payroll Status ===
export const PAYROLL_STATUS = {
  DRAFT: 'draft',
  FINAL: 'final',
}

export const PAYMENT_STATUS = {
  BELUM_DIBAYAR: 'belum_dibayar',
  SUDAH_DIBAYAR: 'sudah_dibayar',
}

// === Days of week (0=Minggu, 1=Senin, ... 6=Sabtu) ===
export const HARI = [
  'Minggu',
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu',
]

// === Default settings ===
export const DEFAULT_SETTINGS = {
  radius_meter: 10,
  jam_masuk: '07:00',
  jam_pulang: '18:00',
  toleransi_telat_menit: 5,
  potongan_off: 50000,
  bonus_masuk_libur: 50000,
  tier1_rate: 1000,
  tier2_rate: 2000,
  tier3_flat: 50000,
  tier1_durasi: 10,
  tier2_durasi: 10,
}

// === Navigation menus ===
export const OWNER_MENU = [
  { label: 'Dashboard', href: '/dashboard', icon: 'dashboard' },
  { label: 'Karyawan', href: '/karyawan', icon: 'people' },
  { label: 'Absensi', href: '/absensi', icon: 'checklist' },
  { label: 'Payroll', href: '/payroll', icon: 'payments' },
  { label: 'Rekap', href: '/rekap', icon: 'assessment' },
  { label: 'Pengaturan', href: '/pengaturan', icon: 'settings' },
]

export const KARYAWAN_MENU = [
  { label: 'Dashboard', href: '/dashboard', icon: 'dashboard' },
  { label: 'Absensi', href: '/absensi', icon: 'checklist' },
  { label: 'Slip Gaji', href: '/slip-gaji', icon: 'receipt' },
]

// === Format currency ===
export function formatRupiah(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

// === Format date ===
export function formatTanggal(dateStr) {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

// === Format time ===
export function formatJam(dateStr) {
  return new Date(dateStr).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  })
}
