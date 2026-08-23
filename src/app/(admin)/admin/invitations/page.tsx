import { getInvitations, deleteInvitation, regenerateToken, markDelivered } from '@/features/invitations/actions'
import { getGuests } from '@/features/guests/actions'
import CreateInvitation from '@/components/admin/invitations/CreateInvitation'
import InvitationList from '@/components/admin/invitations/InvitationList'

export const dynamic = 'force-dynamic'

export default async function InvitationsPage() {
  const [invitations, guests] = await Promise.all([
    getInvitations(),
    getGuests(),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Invitaciones</h1>
          <p className="text-gray-500 mt-1">{invitations.length} invitaciones</p>
        </div>
        <CreateInvitation guests={guests} />
      </div>

      <InvitationList
        invitations={invitations}
        onDelete={deleteInvitation}
        onRegenerate={regenerateToken}
        onMarkDelivered={markDelivered}
      />
    </div>
  )
}
