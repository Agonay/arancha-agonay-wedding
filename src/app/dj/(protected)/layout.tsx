import { isDjAuthenticated } from '@/lib/dj-auth'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function DjProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const authed = await isDjAuthenticated()
  if (!authed) redirect('/dj/login')
  return <>{children}</>
}
