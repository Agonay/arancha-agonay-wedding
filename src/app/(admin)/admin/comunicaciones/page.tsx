import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getWeddingId, toggleDelivered } from '@/features/invitations/actions'
import CommsBoard, {
  type CommRecipient,
} from '@/components/admin/comunicaciones/CommsBoard'
import { buildInviteUrl } from '@/lib/messages'

export const dynamic = 'force-dynamic'

type RsvpState = 'pendiente' | 'confirmada' | 'rechazada' | 'mixta'

export default async function ComunicacionesPage() {
  const supabase = createSupabaseServerClient()
  const weddingId = await getWeddingId()

  const [invitationsRes, linksRes, guestsRes, rsvpsRes, venuesRes] = await Promise.all([
    supabase.from('invitations').select('id, token, status'),
    supabase.from('invitation_guests').select('invitation_id, guest_id, is_primary'),
    supabase.from('guests').select('id, first_name, last_name, display_name, phone').eq('wedding_id', weddingId),
    supabase.from('rsvps').select('guest_id, attendance'),
    supabase.from('venues').select('name').eq('wedding_id', weddingId).limit(1),
  ])

  for (const r of [invitationsRes, linksRes, guestsRes, rsvpsRes, venuesRes]) {
    if (r.error) throw r.error
  }

  type GuestRow = { id: string; first_name: string; last_name: string; display_name: string | null; phone: string | null }
  type LinkRow = { invitation_id: string; guest_id: string; is_primary: boolean | null }

  const guestsById = new Map<string, GuestRow>((guestsRes.data as GuestRow[]).map((g) => [g.id, g]))
  const attendanceByGuest = new Map<string, string | null>(
    (rsvpsRes.data as { guest_id: string; attendance: string | null }[]).map((r) => [r.guest_id, r.attendance])
  )
  const venueName = (venuesRes.data as { name: string }[])[0]?.name ?? null

  const guestsByInvitation = new Map<string, { guest: GuestRow; isPrimary: boolean }[]>()
  for (const l of linksRes.data as LinkRow[]) {
    const guest = guestsById.get(l.guest_id)
    if (!guest) continue
    const list = guestsByInvitation.get(l.invitation_id) || []
    list.push({ guest, isPrimary: !!l.is_primary })
    guestsByInvitation.set(l.invitation_id, list)
  }

  function rsvpStateFor(invitationId: string): RsvpState {
    const list = guestsByInvitation.get(invitationId) || []
    const states = list.map(({ guest }) => attendanceByGuest.get(guest.id) ?? null)
    if (states.some((s) => s === null)) return 'pendiente'
    const allYes = states.every((s) => s === 'attending')
    const allNo = states.every((s) => s === 'not_attending')
    if (allYes) return 'confirmada'
    if (allNo) return 'rechazada'
    return 'mixta'
  }

  const recipients: CommRecipient[] = (invitationsRes.data as { id: string; token: string; status: string }[]).map(
    (inv) => {
      const list = (guestsByInvitation.get(inv.id) || []).sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary))
      const names = list
        .map(({ guest }) => guest.display_name || `${guest.first_name} ${guest.last_name}`)
        .join(' & ')
      const primaryWithPhone = list.find(({ guest }) => guest.phone)?.guest || null
      return {
        id: inv.id,
        names,
        url: buildInviteUrl(inv.token),
        phone: primaryWithPhone?.phone ?? null,
        delivered: inv.status === 'delivered',
        rsvpState: rsvpStateFor(inv.id),
      }
    }
  )

  return <CommsBoard recipients={recipients} venue={venueName} onToggleDelivered={toggleDelivered} />
}
