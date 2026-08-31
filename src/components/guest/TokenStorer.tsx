'use client'

import { useEffect } from 'react'
import { GUEST_TOKEN_STORAGE_KEY } from '@/lib/config'

export default function TokenStorer({ token }: { token: string }) {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(GUEST_TOKEN_STORAGE_KEY, token)
    }
  }, [token])
  return null
}
