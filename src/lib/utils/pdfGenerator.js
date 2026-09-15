import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatRupiah, formatTanggal } from '@/lib/constants'

/**
 * Generator PDF Resmi untuk Slip Gaji Karyawan (Khusus Akses Owner)
 */
export function generateSlipGajiPDF(payroll, employee, settings = {}) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const namaKedai = settings.nama_kedai || 'TAICHAN & CHICKEN KA'
  const pageWidth = doc.internal.pageSize.getWidth()

  // 1. Header Banner Kop Surat
  doc.setFillColor(11, 15, 25)
  doc.rect(0, 0, pageWidth, 38, 'F')

  // Garis Aksen Hijau Emerald
  doc.setFillColor(16, 185, 129)
  doc.rect(0, 38, pageWidth, 2.5, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text(namaKedai.toUpperCase(), 14, 16)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(203, 213, 225)
  doc.text('SISTEM PENGGAJIAN & PRESENSI KEDAI RESMI', 14, 23)
  doc.text('Dokumen Bukti Pembayaran Upah Karyawan', 14, 29)

  // Label No. Slip & Periode di kanan atas
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(16, 185, 129)
  doc.text(`PERIODE: ${payroll.periode_bulan} / ${payroll.periode_tahun}`, pageWidth - 14, 16, { align: 'right' })
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'normal')
  doc.text(`No. Ref: SLIP-${payroll.periode_tahun}${String(payroll.periode_bulan).padStart(2, '0')}-${payroll.id ? payroll.id.slice(0, 6).toUpperCase() : '001'}`, pageWidth - 14, 23, { align: 'right' })
  doc.text(`Tgl Cetak: ${new Date().toLocaleDateString('id-ID')}`, pageWidth - 14, 29, { align: 'right' })

  // 2. Info Karyawan Box
  doc.setTextColor(15, 23, 42)
  doc.setFillColor(248, 250, 252)
  doc.roundedRect(14, 46, pageWidth - 28, 34, 2, 2, 'FD')

  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('DATA PENERIMA UPAH', 18, 53)

  const empJoinDate = employee.tanggal_mulai || payroll.profiles?.tanggal_mulai
  const tglGajianNum = empJoinDate ? new Date(empJoinDate).getDate() : 1

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(`Nama Lengkap   : ${employee.nama || payroll.profiles?.nama || '-'}`, 18, 60)
  doc.text(`Jabatan Staf       : ${employee.jabatan || payroll.profiles?.jabatan || 'Staf Operasional'}`, 18, 66)
  doc.text(`Tgl Bergabung   : ${empJoinDate ? formatTanggal(empJoinDate) : '-'} (Gajian: Setiap tgl ${tglGajianNum})`, 18, 72)

  const statusBayarText = payroll.status_pembayaran === 'sudah_dibayar' ? 'LUNAS (SUDAH DIBAYAR)' : 'DRAFT (BELUM DIBAYAR)'
  doc.text(`Status Gaji          : ${statusBayarText}`, pageWidth / 2 + 5, 60)
  doc.text(`Tanggal Dibayar : ${payroll.tanggal_dibayar ? formatTanggal(payroll.tanggal_dibayar) : '-'}`, pageWidth / 2 + 5, 66)

  // 3. Rincian Penerimaan & Potongan via Tabel autoTable
  const earnings = [
    ['Gaji Pokok', `Gaji pokok standar kedai`, formatRupiah(payroll.gaji_pokok)],
  ]
  if (payroll.total_bonus_libur > 0) {
    earnings.push([`Bonus Masuk Libur (${payroll.total_hari_libur_masuk || 0} Hari)`, 'Insentif kerja hari libur', `+${formatRupiah(payroll.total_bonus_libur)}`])
  }
  if (payroll.total_bonus_manual > 0) {
    earnings.push(['Bonus Tambahan / Tips', 'Bonus kinerja dari Owner', `+${formatRupiah(payroll.total_bonus_manual)}`])
  }
  if (payroll.adjustment !== 0) {
    earnings.push([`Penyesuaian (${payroll.keterangan_adjustment || 'Khusus'})`, 'Koreksi perhitungan manual', `${payroll.adjustment > 0 ? '+' : ''}${formatRupiah(payroll.adjustment)}`])
  }

  const deductions = []
  if (payroll.total_potongan_telat > 0) {
    deductions.push([`Potongan Terlambat (${payroll.total_hari_telat || 0} Hari)`, 'Denda keterlambatan kedai', `-${formatRupiah(payroll.total_potongan_telat)}`])
  }
  if (payroll.total_potongan_off > 0) {
    deductions.push([`Potongan Off / Alpa (${payroll.total_hari_off || 0} Hari)`, 'Ketidakhadiran tanpa izin', `-${formatRupiah(payroll.total_potongan_off)}`])
  }
  if (payroll.total_potongan_kasbon > 0) {
    deductions.push(['Potongan Cicilan Kasbon', 'Angsuran pinjaman berjalan', `-${formatRupiah(payroll.total_potongan_kasbon)}`])
  }
  if (deductions.length === 0) {
    deductions.push(['Potongan & Denda', 'Tidak ada potongan bulan ini', 'Rp 0'])
  }

  // Gabungkan ke format tabel
  const tableBody = [
    [{ content: 'A. PENERIMAAN / PENDAPATAN', colSpan: 3, styles: { fillColor: [241, 245, 249], fontStyle: 'bold' } }],
    ...earnings,
    [{ content: 'B. POTONGAN GAJI', colSpan: 3, styles: { fillColor: [254, 242, 242], fontStyle: 'bold', textColor: [185, 28, 28] } }],
    ...deductions,
  ]

  autoTable(doc, {
    startY: 80,
    margin: { left: 14, right: 14 },
    head: [['Komponen Upah', 'Keterangan', 'Nominal (IDR)']],
    body: tableBody,
    theme: 'grid',
    headStyles: {
      fillColor: [11, 15, 25],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    styles: {
      fontSize: 8.5,
      cellPadding: 3,
    },
    columnStyles: {
      0: { cellWidth: 70, fontStyle: 'bold' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 45, halign: 'right', fontStyle: 'bold' },
    },
  })

  // 4. Box Total Gaji Bersih (Take Home Pay)
  const finalY = doc.lastAutoTable.finalY + 6
  doc.setFillColor(16, 185, 129)
  doc.roundedRect(14, finalY, pageWidth - 28, 22, 2, 2, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('TOTAL GAJI DITERIMA (TAKE HOME PAY)', 20, finalY + 8)

  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text(formatRupiah(payroll.total_gaji), 20, finalY + 17)

  // 5. Tanda Tangan & Validasi
  const sigY = finalY + 34
  doc.setTextColor(15, 23, 42)
  doc.setFontSize(8.5)
  doc.setFont('helvetica', 'normal')

  // Kiri: Penerima
  doc.text('Penerima Upah,', 24, sigY)
  doc.text(`( ${employee.nama || payroll.profiles?.nama || 'Karyawan'} )`, 24, sigY + 22)

  // Kanan: Owner
  doc.text('Disetujui Oleh (Owner),', pageWidth - 60, sigY)
  doc.text('( Manajemen Kedai )', pageWidth - 60, sigY + 22)

  // Footer Disclaimer
  doc.setFontSize(7.5)
  doc.setTextColor(148, 163, 184)
  doc.text(
    'Dokumen ini dicetak otomatis oleh Sistem Absensi & Payroll Kedai. Sah dan mengikat tanpa stempel fisik.',
    pageWidth / 2,
    doc.internal.pageSize.getHeight() - 10,
    { align: 'center' }
  )

  const fileName = `Slip_Gaji_${(employee.nama || 'Karyawan').replace(/\s+/g, '_')}_${payroll.periode_bulan}_${payroll.periode_tahun}.pdf`
  doc.save(fileName)
}

/**
 * Generator PDF Resmi untuk Laporan Rekapitulasi Keuangan & Payroll Kedai
 */
export function generateLaporanKeuanganPDF(payrolls = [], currentMonth, currentYear, settings = {}) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  })

  const namaKedai = settings.nama_kedai || 'TAICHAN & CHICKEN KA'
  const pageWidth = doc.internal.pageSize.getWidth()

  // 1. Header Laporan Resmi
  doc.setFillColor(11, 15, 25)
  doc.rect(0, 0, pageWidth, 28, 'F')
  doc.setFillColor(16, 185, 129)
  doc.rect(0, 28, pageWidth, 2, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(namaKedai.toUpperCase(), 14, 12)

  doc.setFontSize(8.5)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(203, 213, 225)
  doc.text(`LAPORAN KEUANGAN & REKAPITULASI PENGGAJIAN BULANAN`, 14, 18)
  doc.text(`Periode: Bulan ${currentMonth} / Tahun ${currentYear} | Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}`, 14, 23)

  // 2. Ringkasan Eksekutif Finansial (4 Cards)
  const totalGajiNet = payrolls.reduce((acc, p) => acc + (p.total_gaji || 0), 0)
  const totalPotongan = payrolls.reduce((acc, p) => acc + (p.total_potongan_telat + p.total_potongan_off + (p.total_potongan_kasbon || 0)), 0)
  const totalBonus = payrolls.reduce((acc, p) => acc + (p.total_bonus_libur + p.total_bonus_manual), 0)
  const totalGajiPokok = payrolls.reduce((acc, p) => acc + (p.gaji_pokok || 0), 0)

  const cardY = 34
  const cardW = (pageWidth - 28 - 12) / 4
  const cards = [
    { title: 'Total Gaji Bersih (Net)', val: formatRupiah(totalGajiNet), bg: [236, 253, 245], border: [16, 185, 129], text: [4, 120, 87] },
    { title: 'Total Gaji Pokok', val: formatRupiah(totalGajiPokok), bg: [248, 250, 252], border: [203, 213, 225], text: [15, 23, 42] },
    { title: 'Total Potongan (Denda/Kasbon)', val: `-${formatRupiah(totalPotongan)}`, bg: [254, 242, 242], border: [252, 165, 165], text: [185, 28, 28] },
    { title: 'Total Bonus & Insentif', val: `+${formatRupiah(totalBonus)}`, bg: [239, 246, 255], border: [147, 197, 253], text: [29, 78, 216] },
  ]

  cards.forEach((c, idx) => {
    const x = 14 + idx * (cardW + 4)
    doc.setFillColor(...c.bg)
    doc.setDrawColor(...c.border)
    doc.roundedRect(x, cardY, cardW, 16, 1.5, 1.5, 'FD')

    doc.setTextColor(100, 116, 139)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'bold')
    doc.text(c.title.toUpperCase(), x + 4, cardY + 5.5)

    doc.setTextColor(...c.text)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text(c.val, x + 4, cardY + 12.5)
  })

  // 3. Tabel Detail Penggajian Seluruh Karyawan
  const tableData = payrolls.map((p, idx) => [
    idx + 1,
    p.profiles?.nama || '-',
    p.profiles?.jabatan || 'Staf',
    formatRupiah(p.gaji_pokok),
    p.total_hari_hadir || 0,
    p.total_hari_telat || 0,
    p.total_hari_off || 0,
    p.total_hari_libur_masuk || 0,
    formatRupiah(p.total_potongan_telat),
    formatRupiah(p.total_potongan_off),
    formatRupiah(p.total_potongan_kasbon || 0),
    formatRupiah(p.total_bonus_libur + p.total_bonus_manual),
    formatRupiah(p.total_gaji),
    p.status_pembayaran === 'sudah_dibayar' ? 'Lunas' : 'Belum',
  ])

  autoTable(doc, {
    startY: 54,
    margin: { left: 14, right: 14 },
    head: [[
      'No',
      'Nama Staf',
      'Jabatan',
      'Gaji Pokok',
      'Hdr',
      'Tlt',
      'Off',
      'Lbr',
      'Pot. Telat',
      'Pot. Off',
      'Kasbon',
      'Bonus',
      'Total Net',
      'Status',
    ]],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [11, 15, 25],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 38, fontStyle: 'bold' },
      2: { cellWidth: 26 },
      3: { cellWidth: 22, halign: 'right' },
      4: { cellWidth: 10, halign: 'center' },
      5: { cellWidth: 10, halign: 'center' },
      6: { cellWidth: 10, halign: 'center' },
      7: { cellWidth: 10, halign: 'center' },
      8: { cellWidth: 20, halign: 'right' },
      9: { cellWidth: 20, halign: 'right' },
      10: { cellWidth: 20, halign: 'right' },
      11: { cellWidth: 20, halign: 'right' },
      12: { cellWidth: 24, halign: 'right', fontStyle: 'bold' },
      13: { cellWidth: 16, halign: 'center' },
    },
  })

  // 4. Tanda Tangan Pengesahan
  const finalY = doc.lastAutoTable.finalY + 8
  if (finalY < doc.internal.pageSize.getHeight() - 25) {
    doc.setFontSize(8)
    doc.setTextColor(15, 23, 42)
    doc.text(`Disahkan di: Bandar Lampung, ${new Date().toLocaleDateString('id-ID')}`, pageWidth - 70, finalY)
    doc.text('Owner Kedai,', pageWidth - 70, finalY + 5)
    doc.text('( ______________________ )', pageWidth - 70, finalY + 20)
  }

  const fileName = `Laporan_Keuangan_Kedai_${currentMonth}_${currentYear}.pdf`
  doc.save(fileName)
}

const BULAN_PDF = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

const STATUS_LABEL_PDF = {
  hadir: 'Hadir',
  telat: 'Telat',
  off: 'Off / Alpa',
  libur_mingguan: 'Libur Mingguan',
}

/**
 * Generator PDF Rekap Absensi & Gaji Per Karyawan
 */
export function generateRekapKaryawanPDF(employee, payroll, attendances = [], currentMonth, currentYear, settings = {}) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const namaKedai = settings.nama_kedai || 'TAICHAN & CHICKEN KA'
  const pageWidth = doc.internal.pageSize.getWidth()
  const periodLabel = `${BULAN_PDF[currentMonth - 1]} ${currentYear}`

  // 1. Header
  doc.setFillColor(11, 15, 25)
  doc.rect(0, 0, pageWidth, 34, 'F')
  doc.setFillColor(16, 185, 129)
  doc.rect(0, 34, pageWidth, 2.5, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(namaKedai.toUpperCase(), 14, 13)

  doc.setFontSize(8.5)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(203, 213, 225)
  doc.text('REKAP ABSENSI & GAJI KARYAWAN', 14, 20)
  doc.text(`Periode: ${periodLabel} | Cetak: ${new Date().toLocaleDateString('id-ID')}`, 14, 26)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(16, 185, 129)
  doc.text(`PERIODE: ${periodLabel}`, pageWidth - 14, 13, { align: 'right' })

  // 2. Info Karyawan
  doc.setTextColor(15, 23, 42)
  doc.setFillColor(248, 250, 252)
  doc.roundedRect(14, 42, pageWidth - 28, 24, 2, 2, 'FD')

  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('DATA KARYAWAN', 18, 49)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(`Nama       : ${employee.nama || '-'}`, 18, 56)
  doc.text(`Jabatan   : ${employee.jabatan || 'Staf Kedai'}`, 18, 62)

  const totalHadir = attendances.filter((a) => a.status === 'hadir').length
  const totalTelat = attendances.filter((a) => a.status === 'telat').length
  const totalOff = attendances.filter((a) => a.status === 'off').length
  const totalLibur = attendances.filter((a) => a.status === 'libur_mingguan').length

  doc.text(`Hadir: ${totalHadir} hr   Telat: ${totalTelat} hr   Off: ${totalOff} hr   Libur: ${totalLibur} hr`, pageWidth / 2 + 4, 56)

  // 3. Ringkasan Gaji jika payroll ada
  if (payroll) {
    const gY = 72
    const cardW = (pageWidth - 28 - 9) / 4

    const cards = [
      { label: 'GAJI POKOK', val: formatRupiah(payroll.gaji_pokok), rgb: [241, 245, 249] },
      { label: 'POTONGAN', val: `-${formatRupiah((payroll.total_potongan_telat || 0) + (payroll.total_potongan_off || 0) + (payroll.total_potongan_kasbon || 0))}`, rgb: [254, 242, 242] },
      { label: 'BONUS', val: `+${formatRupiah((payroll.total_bonus_libur || 0) + (payroll.total_bonus_manual || 0))}`, rgb: [240, 253, 244] },
      { label: 'GAJI BERSIH', val: formatRupiah(payroll.total_gaji), rgb: [238, 242, 255] },
    ]

    cards.forEach((c, idx) => {
      const x = 14 + idx * (cardW + 3)
      doc.setFillColor(...c.rgb)
      doc.roundedRect(x, gY, cardW, 14, 1.5, 1.5, 'F')
      doc.setFontSize(6.5)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(100, 116, 139)
      doc.text(c.label, x + 3, gY + 5)
      doc.setFontSize(8.5)
      doc.setTextColor(15, 23, 42)
      doc.text(c.val, x + 3, gY + 11)
    })
  }

  // 4. Tabel log absensi harian
  const tableData = attendances.map((a, i) => {
    const masuk = a.jam_checkin
      ? new Date(a.jam_checkin).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
      : '-'
    const pulang = a.jam_checkout
      ? new Date(a.jam_checkout).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
      : '-'
    return [
      i + 1,
      formatTanggal(a.tanggal),
      STATUS_LABEL_PDF[a.status] || a.status,
      masuk,
      pulang,
      a.menit_telat > 0 ? `${a.menit_telat} mnt` : '-',
      a.potongan_telat > 0 ? formatRupiah(a.potongan_telat) : '-',
      a.is_override ? 'Manual' : 'GPS',
      a.catatan || '-',
    ]
  })

  const startY = payroll ? 92 : 72

  autoTable(doc, {
    startY,
    margin: { left: 14, right: 14 },
    head: [['No', 'Tanggal', 'Status', 'Masuk', 'Pulang', 'Telat', 'Potongan', 'Tipe', 'Catatan']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [11, 15, 25],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    styles: { fontSize: 7.5, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 34 },
      2: { cellWidth: 22, fontStyle: 'bold' },
      3: { cellWidth: 16, halign: 'center' },
      4: { cellWidth: 16, halign: 'center' },
      5: { cellWidth: 14, halign: 'center' },
      6: { cellWidth: 22, halign: 'right' },
      7: { cellWidth: 14, halign: 'center' },
      8: { cellWidth: 'auto' },
    },
    didParseCell(data) {
      if (data.section === 'body' && data.column.index === 2) {
        const status = attendances[data.row.index]?.status
        if (status === 'hadir') data.cell.styles.textColor = [21, 128, 61]
        else if (status === 'telat') data.cell.styles.textColor = [146, 64, 14]
        else if (status === 'off') data.cell.styles.textColor = [185, 28, 28]
        else if (status === 'libur_mingguan') data.cell.styles.textColor = [29, 78, 216]
      }
    },
  })

  // 5. Footer
  doc.setFontSize(7.5)
  doc.setTextColor(148, 163, 184)
  doc.text(
    'Dokumen ini dicetak otomatis oleh Sistem Absensi & Payroll Kedai.',
    pageWidth / 2,
    doc.internal.pageSize.getHeight() - 10,
    { align: 'center' }
  )

  const fileName = `Rekap_${(employee.nama || 'Karyawan').replace(/\s+/g, '_')}_${currentMonth}_${currentYear}.pdf`
  doc.save(fileName)
}
