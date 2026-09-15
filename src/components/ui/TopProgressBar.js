'use client'

import { useEffect, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

export function TopProgressBar() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Sembunyikan progress bar saat rute selesai dimuat
    setLoading(false)
  }, [pathname, searchParams])

  useEffect(() => {
    const handleAnchorClick = (e) => {
      const target = e.target.closest('a')
      if (
        target &&
        target.href &&
        target.href.startsWith(window.location.origin) &&
        !target.href.includes('#') &&
        target.target !== '_blank'
      ) {
        const url = new URL(target.href)
        if (url.pathname !== window.location.pathname || url.search !== window.location.search) {
          setLoading(true)
        }
      }
    }

    document.addEventListener('click', handleAnchorClick)
    return () => {
      document.removeEventListener('click', handleAnchorClick)
    }
  }, [])

  if (!loading) return null

  return <div className="top-loading-indicator" />
}
