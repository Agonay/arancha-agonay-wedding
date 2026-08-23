'use client'

import { useState } from 'react'
import { Plus, QrCode, Copy, RefreshCw, CheckCircle, Trash2, ExternalLink } from 'lucide-react'
import { createInvitation } from '@/features/invitations/actions'

interface Guest {
  id: string
  first_name: string
  last_name: string
  display_name: string | null
  invitation_guests?: unknown[]
}

interface CreateInvitationProps {
  guests: Guest[]
}

export default function CreateInvitation({ guests }: CreateInvitationProps) {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ id: string; token: string; url: string } | null>(null)

  const uninvitedGuests = guests.filter(
    (g) => !g.invitation_guests || g.invitation_guests.length === 0
  )

  const handleCreate = async () => {
    setLoading(true)
    try {
      const inv = await createInvitation(selected)
      const url = `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/i/${inv.token}`
      setResult({ id: inv.id, token: inv.token, url })
    } catch {
      alert('Error al crear la invitación')
    } finally {
      setLoading(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
      >
        <Plus className="h-4 w-4" />
        Nueva invitación
      </button>
    )
  }

  if (result) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-md text-center p-6">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
              <QrCode className="h-6 w-6 text-emerald-600" />
            </div>
          </div>
          <h2 className="text-lg font-semibold mb-2">¡Invitación creada!</h2>
          <p className="text-sm text-gray-500 mb-4">
            {selected.length} invitado{selected.length !== 1 ? 's' : ''} asignado{selected.length !== 1 ? 's' : ''}
          </p>

          <div className="bg-gray-50 rounded-lg p-3 mb-4 text-left">
            <p className="text-xs text-gray-500 mb-1">URL de la invitación</p>
            <div className="flex items-center gap-2">
              <code className="text-xs bg-white px-2 py-1 rounded border flex-1 truncate">
                {result.url}
              </code>
              <button
                onClick={() => navigator.clipboard.writeText(result.url)}
                className="p-1.5 hover:bg-gray-200 rounded"
                title="Copiar URL"
              >
                <Copy className="h-4 w-4" />
              </button>
              <a
                href={result.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 hover:bg-gray-200 rounded"
                title="Abrir invitación"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <p className="text-xs text-gray-500 mb-2">QR Code</p>
            <div className="flex justify-center">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(result.url)}&color=2D2D2D&bgcolor=FAF8F5`}
                alt="QR Code"
                className="w-40 h-40 rounded-lg"
              />
            </div>
          </div>

          <div className="flex gap-3 justify-center">
            <button
              onClick={() => { setResult(null); setOpen(false); setSelected([]) }}
              className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50"
            >
              Cerrar
            </button>
            <button
              onClick={() => { setResult(null); setSelected([]) }}
              className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
            >
              Crear otra
            </button>
          </div>
        </div>
      </div>
    )
  }

  const toggleGuest = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Nueva invitación</h2>
          <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 p-1">
            ✕
          </button>
        </div>

        <div className="p-4 flex-1 overflow-y-auto">
          <p className="text-sm text-gray-500 mb-3">
            Selecciona los invitados para esta invitación ({selected.length} seleccionado{selected.length !== 1 ? 's' : ''})
          </p>

          {uninvitedGuests.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">
              Todos los invitados ya tienen invitación
            </p>
          ) : (
            <div className="space-y-1">
              {uninvitedGuests.map((g) => {
                const checked = selected.includes(g.id)
                return (
                  <button
                    key={g.id}
                    onClick={() => toggleGuest(g.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors text-left ${
                      checked ? 'bg-emerald-50 text-emerald-700' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                      checked ? 'bg-emerald-600 border-emerald-600' : 'border-gray-300'
                    }`}>
                      {checked && <CheckCircle className="h-3 w-3 text-white" />}
                    </div>
                    <span className="font-medium">{g.display_name || `${g.first_name} ${g.last_name}`}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <div className="flex gap-3 justify-end p-4 border-t">
          <button
            onClick={() => setOpen(false)}
            className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleCreate}
            disabled={selected.length === 0 || loading}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
          >
            <QrCode className="h-4 w-4" />
            {loading ? 'Creando...' : 'Crear invitación'}
          </button>
        </div>
      </div>
    </div>
  )
}
