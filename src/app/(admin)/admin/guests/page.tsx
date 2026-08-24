import { getGuests, deleteGuest, togglePlusOneAllowed } from '@/features/guests/actions'
import { getGuestGroups, createGroup } from '@/features/guests/group-actions'
import GuestTable from '@/components/admin/guests/GuestTable'
import GuestForm from '@/components/admin/guests/GuestForm'

export const dynamic = 'force-dynamic'

export default async function GuestsPage() {
  const [guests, groups] = await Promise.all([
    getGuests(),
    getGuestGroups(),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Invitados</h1>
          <p className="text-gray-500 mt-1">{guests.length} invitados</p>
        </div>
        <GuestForm groups={groups} />
      </div>

      <GuestTable guests={guests} groups={groups} onDelete={deleteGuest} onTogglePlusOne={togglePlusOneAllowed} />
    </div>
  )
}
