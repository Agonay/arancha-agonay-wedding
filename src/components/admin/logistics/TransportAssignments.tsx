'use client'

import { useState, useTransition } from 'react'
import { Bus, UserX } from 'lucide-react'
import { assignTransport } from '@/features/logistics/actions'

interface GuestNeedingTransport {
  guest_id: string
  name: string
  group_name: string | null
  phone: string | null
  plus_one_name: string | null
  transport_option_id: string | null
}

interface OptionLite {
  id: string
  name: string
}

export default function TransportAssignments({
  guests,
  options,
}: {
  guests: GuestNeedingTransport[]
  options: OptionLite[]
}) {
  const [isPending, startTransition] = useTransition()
  const [assignments, setAssignments] = useState<Record<string, string>>(
    Object.fromEntries(guests.map((g) => [g.guest_id, g.transport_option_id || '']))
  )

  const handleChange = (guestId: string, value: string) => {
    setAssignments((prev) => ({ ...prev, [guestId]: value }))
    startTransition(async () => {
      try {
        await assignTransport(guestId, value || null)
      } catch {
        alert('Error al asignar el transporte')
      }
    })
  }

  const assignedCount = guests.filter((g) => assignments[g.guest_id]).length

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-medium text-gray-900">Invitados que necesitan transporte</h2>
        <p className="text-sm text-gray-500">
          {guests.length} confirmado{guests.length === 1 ? '' : 's'} con transporte solicitado ·{' '}
          {assignedCount} asignado{assignedCount === 1 ? '' : 's'}
          {isPending && <span className="ml-2 text-blue-600">Guardando...</span>}
        </p>
      </div>

      {guests.length === 0 ? (
        <div className="bg-white rounded-xl border p-8 text-center text-gray-400">
          <UserX className="h-8 w-8 mx-auto mb-2 text-gray-300" />
          Ningún invitado confirmado ha solicitado transporte todavía.
        </div>
      ) : (
        <div className="bg-white rounded-xl border divide-y">
          {guests.map((guest) => (
            <div key={guest.guest_id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1 min-w-0">
                <span className="font-medium text-gray-900">{guest.name}</span>
                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-0.5 text-xs text-gray-400">
                  {guest.group_name && <span>{guest.group_name}</span>}
                  {guest.phone && <span>{guest.phone}</span>}
                  {guest.plus_one_name && <span>+1: {guest.plus_one_name}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Bus className="h-4 w-4 text-gray-400" />
                <select
                  value={assignments[guest.guest_id] || ''}
                  onChange={(e) => handleChange(guest.guest_id, e.target.value)}
                  className="px-3 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 min-w-[180px]"
                >
                  <option value="">Sin asignar</option>
                  {options.map((option) => (
                    <option key={option.id} value={option.id}>{option.name}</option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
