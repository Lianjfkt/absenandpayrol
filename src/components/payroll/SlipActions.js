'use client'

import { Button } from '@/components/ui/Button'
import { generateWhatsAppSlipText } from '@/lib/constants'
import { generateSlipGajiPDF } from '@/lib/utils/pdfGenerator'

export function SlipActions({ slip, namaKaryawan, isOwner = false, settings = {}, employee = {} }) {
  const handleShareWA = () => {
    const text = generateWhatsAppSlipText(namaKaryawan, slip)
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }

  const handleDownloadPDF = () => {
    generateSlipGajiPDF(slip, { nama: namaKaryawan, ...employee }, settings)
  }

  return (
    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
      {isOwner && (
        <Button variant="primary" size="sm" onClick={handleDownloadPDF} style={{ flex: 1, minWidth: '140px' }}>
          📄 Unduh Slip PDF
        </Button>
      )}
      <Button variant="success" size="sm" onClick={handleShareWA} style={{ flex: 1, minWidth: '140px', background: '#25D366', color: '#fff', border: 'none' }}>
        💬 Share WhatsApp
      </Button>
    </div>
  )
}

