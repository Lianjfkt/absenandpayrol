'use client'

import { Button } from '@/components/ui/Button'
import { triggerPrint } from '@/lib/utils/export'
import { generateWhatsAppSlipText } from '@/lib/constants'

export function SlipActions({ slip, namaKaryawan }) {
  const handleShareWA = () => {
    const text = generateWhatsAppSlipText(namaKaryawan, slip)
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }

  return (
    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
      <Button variant="outline" size="sm" onClick={triggerPrint} style={{ flex: 1, minWidth: '130px' }}>
        🖨️ Cetak Slip / PDF
      </Button>
      <Button variant="success" size="sm" onClick={handleShareWA} style={{ flex: 1, minWidth: '130px', background: '#25D366', color: '#fff', border: 'none' }}>
        💬 Share WhatsApp
      </Button>
    </div>
  )
}
