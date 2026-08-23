import { notFound } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { isValidTokenFormat } from '@/lib/tokens'
import InvitationContent from '@/components/guest/InvitationContent'

export const dynamic = 'force-dynamic'

interface InvitationPageProps {
  params: Promise<{ token: string }>
}

export default async function InvitationPage({ params }: InvitationPageProps) {
  const { token } = await params

  if (!isValidTokenFormat(token)) {
    notFound()
  }

  const supabase = createSupabaseServerClient()

  const { data: invitation } = await supabase
    .from('invitations')
    .select('*, invitation_guests!inner(guests(first_name, last_name, display_name))')
    .eq('token', token)
    .single()

  if (!invitation || !('invitation_guests' in invitation)) {
    notFound()
  }

  const typedInvitation = invitation as {
    invitation_guests: { guests: { first_name: string; last_name: string; display_name: string | null } }[]
  }

  const guests = typedInvitation.invitation_guests.map((ig) => ig.guests)

  const cookieStore = await cookies()
  cookieStore.set('invitation_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 90, // 90 days
    path: '/',
  })

  const guestNames = guests.map((g) => g.display_name || `${g.first_name} ${g.last_name}`)
  const greeting = guestNames.join(' & ')

  return <InvitationContent greeting={greeting} guests={guestNames} />
}
