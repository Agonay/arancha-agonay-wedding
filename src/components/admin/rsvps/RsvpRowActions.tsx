'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import ConfirmModal from '@/components/ui/ConfirmModal'
import { deleteRsvp } from '@/features/rsvp/actions'

interface RsvpRowActionsProps {
  guestId: string
  guestName: string
}

export default function RsvpRowActions({ guestId, guestName }: RsvpRowActionsProps) {
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deleteRsvp(guestId)
      setShowModal(false)
      router.refresh()
    } catch {
      alert('Error al eliminar el RSVP.')
      setShowModal(false)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="p-1.5 text-gray-400 hover:text-amber-600 rounded hover:bg-gray-100"
        title="Limpiar RSVP"
      >
        <Trash2 className="h-4 w-4" />
      </button>

      {showModal && (
        <ConfirmModal
          title="Limpiar RSVP"
          message={`¿Eliminar la respuesta de ${guestName}? El invitado volverá a aparecer como pendiente y podrá responder de nuevo. Esta acción no se puede deshacer.`}
          confirmLabel="Eliminar respuesta"
          loading={deleting}
          onConfirm={handleDelete}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  )
}
