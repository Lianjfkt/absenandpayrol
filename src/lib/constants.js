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

// === Leave Types & Status ===
export const LEAVE_TYPES = {
  SAKIT: 'sakit',
  IZIN: 'izin',
  CUTI: 'cuti',
}

export const LEAVE_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
}

// === Loan Status ===
export const LOAN_STATUS = {
  AKTIF: 'aktif',
  LUNAS: 'lunas',
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
  { label: 'Izin & Sakit', href: '/izin', icon: 'event_busy' },
  { label: 'Kasbon', href: '/kasbon', icon: 'account_balance_wallet' },
  { label: 'Payroll', href: '/payroll', icon: 'payments' },
  { label: 'Rekap', href: '/rekap', icon: 'assessment' },
  { label: 'Pengaturan', href: '/pengaturan', icon: 'settings' },
]

export const KARYAWAN_MENU = [
  { label: 'Dashboard', href: '/dashboard', icon: 'dashboard' },
  { label: 'Absensi', href: '/absensi', icon: 'checklist' },
  { label: 'Izin & Sakit', href: '/izin', icon: 'event_busy' },
  { label: 'Slip Gaji', href: '/slip-gaji', icon: 'receipt' },
]

// === Format currency ===
export function formatRupiah(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0)
}

// === Format date ===
export function formatTanggal(dateStr) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

// === Format time ===
export function formatJam(dateStr) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

// === WhatsApp Slip Text Generator ===
export function generateWhatsAppSlipText(namaKaryawan, slip) {
  const lines = [
    `*SLIP GAJI KARYAWAN - TAICHAN & CHICKEN KA*`,
    `Periode: Bulan ${slip.periode_bulan}/${slip.periode_tahun}`,
    `Nama: ${namaKaryawan}`,
    `----------------------------------------`,
    `• Gaji Pokok: ${formatRupiah(slip.gaji_pokok)}`,
  ]

  if (slip.total_potongan_telat > 0) {
    lines.push(`• Potongan Telat (${slip.total_hari_telat} hr): -${formatRupiah(slip.total_potongan_telat)}`)
  }
  if (slip.total_potongan_off > 0) {
    lines.push(`• Potongan Off/Alpa (${slip.total_hari_off} hr): -${formatRupiah(slip.total_potongan_off)}`)
  }
  if (slip.total_potongan_kasbon > 0) {
    lines.push(`• Potongan Kasbon: -${formatRupiah(slip.total_potongan_kasbon)}`)
  }
  if (slip.total_bonus_libur > 0) {
    lines.push(`• Bonus Masuk Libur (${slip.total_hari_libur_masuk} hr): +${formatRupiah(slip.total_bonus_libur)}`)
  }
  if (slip.total_bonus_manual > 0) {
    lines.push(`• Bonus Tambahan: +${formatRupiah(slip.total_bonus_manual)}`)
  }
  if (slip.adjustment !== 0) {
    lines.push(`• Penyesuaian (${slip.keterangan_adjustment || '-'}): ${slip.adjustment > 0 ? '+' : ''}${formatRupiah(slip.adjustment)}`)
  }

  lines.push(`----------------------------------------`)
  lines.push(`*TOTAL GAJI DITERIMA: ${formatRupiah(slip.total_gaji)}*`)
  lines.push(`Status: ${slip.status_pembayaran === 'sudah_dibayar' ? 'LUNAS / SUDAH DIBAYAR' : 'DRAFT / BELUM DIBAYAR'}`)
  if (slip.tanggal_dibayar) {
    lines.push(`Tanggal Dibayar: ${formatTanggal(slip.tanggal_dibayar)}`)
  }
  lines.push(`\n_Terima kasih atas kerja keras dan dedikasinya!_`)

  return encodeURIComponent(lines.join('\n'))
}
