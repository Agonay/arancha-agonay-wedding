import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getGuest, updateGuest, updateGuestRsvp, deleteGuest } from '@/features/guests/actions'
import { getGuestGroups } from '@/features/guests/group-actions'
import GuestEditForm from '@/components/admin/guests/GuestEditForm'

export const dynamic = 'force-dynamic'

interface GuestDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function GuestDetailPage({ params }: GuestDetailPageProps) {
  const { id } = await params
  const [guest, groups] = await Promise.all([
    getGuest(id),
    getGuestGroups(),
  ])

  if (!guest) notFound()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/guests" className="text-sm text-gray-500 hover:text-gray-700">
          ← Volver a invitados
        </Link>
        <h1 className="text-2xl font-semibold text-gray-900">
          {guest.display_name || `${guest.first_name} ${guest.last_name}`}
        </h1>
      </div>

      <GuestEditForm
        guest={guest}
        groups={groups}
        onUpdate={updateGuest}
        onUpdateRsvp={updateGuestRsvp}
        onDelete={deleteGuest}
      />
    </div>
  )
}
