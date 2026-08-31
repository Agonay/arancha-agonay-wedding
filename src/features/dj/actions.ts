'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { DJ_AUTH_COOKIE, djCookieValue } from '@/lib/dj-auth'

export type DjLoginState = { error?: string } | null

export async function djLogin(
  _prev: DjLoginState,
  formData: FormData
): Promise<DjLoginState> {
  const password = formData.get('password') as string
  const expected = djCookieValue()
  if (!expected || !password || password !== process.env.DJ_PASSWORD) {
    return { error: 'Contraseña incorrecta' }
  }
  const store = await cookies()
  store.set(DJ_AUTH_COOKIE, expected, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })
  redirect('/dj')
}

export async function djLogout() {
  const store = await cookies()
  store.delete(DJ_AUTH_COOKIE)
  redirect('/dj/login')
}
