'use client'

import { useEffect, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

export function TopProgressBar() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [navigatingTo, setNavigatingTo] = useState(null)

  // Current full path
  const currentPath = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '')
  const isLoading = navigatingTo !== null && navigatingTo !== currentPath

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
        const newPath = url.pathname + url.search
        if (newPath !== window.location.pathname + window.location.search) {
          setNavigatingTo(newPath)
        }
      }
    }

    document.addEventListener('click', handleAnchorClick)
    return () => {
      document.removeEventListener('click', handleAnchorClick)
    }
  }, [])

  if (!isLoading) return null

  return <div className="top-loading-indicator" />
}

