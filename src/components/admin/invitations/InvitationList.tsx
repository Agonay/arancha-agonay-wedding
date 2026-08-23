'use client'

import { Copy, QrCode, RefreshCw, CheckCircle, Trash2, ExternalLink } from 'lucide-react'

interface Invitation {
  id: string
  token: string
  status: string
  delivered_at: string | null
  invitation_guests: {
    guests: { id: string; first_name: string; last_name: string; display_name: string | null }
  }[]
}

interface InvitationListProps {
  invitations: Invitation[]
  onDelete: (id: string) => Promise<void>
  onRegenerate: (id: string) => Promise<{ token: string }>
  onMarkDelivered: (id: string) => Promise<void>
}

export default function InvitationList({
  invitations,
  onDelete,
  onRegenerate,
  onMarkDelivered,
}: InvitationListProps) {
  const getGuestNames = (inv: Invitation) =>
    inv.invitation_guests.map((ig) => ig.guests.display_name || `${ig.guests.first_name} ${ig.guests.last_name}`).join(' & ')

  const getInvitationUrl = (token: string) =>
    `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/i/${token}`

  return (
    <div className="bg-white rounded-xl border">
      {invitations.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          No hay invitaciones creadas
        </div>
      ) : (
        <div className="divide-y">
          {invitations.map((inv) => (
            <div key={inv.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-gray-900">{getGuestNames(inv)}</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    inv.status === 'delivered' ? 'bg-blue-50 text-blue-700' :
                    inv.status === 'sent' ? 'bg-amber-50 text-amber-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {inv.status === 'delivered' ? 'Entregada' : inv.status === 'sent' ? 'Enviada' : 'Pendiente'}
                  </span>
                </div>
                <p className="text-xs text-gray-400 truncate">
                  {getInvitationUrl(inv.token)}
                </p>
                {inv.delivered_at && (
                  <p className="text-xs text-gray-400 mt-1">
                    Entregada: {new Date(inv.delivered_at).toLocaleDateString('es-ES')}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <a
                  href={getInvitationUrl(inv.token)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                  title="Ver invitación"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
                <button
                  onClick={() => {
                    const url = getInvitationUrl(inv.token)
                    navigator.clipboard.writeText(url)
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                  title="Copiar URL"
                >
                  <Copy className="h-4 w-4" />
                </button>
                <button
                  onClick={() => {
                    if (confirm('¿Regenerar el token? El enlace anterior dejará de funcionar.')) {
                      onRegenerate(inv.id)
                    }
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                  title="Regenerar token"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
                {inv.status !== 'delivered' && (
                  <button
                    onClick={() => onMarkDelivered(inv.id)}
                    className="p-2 text-gray-400 hover:text-emerald-600 rounded-lg hover:bg-gray-100"
                    title="Marcar como entregada"
                  >
                    <CheckCircle className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={() => {
                    if (confirm('¿Eliminar esta invitación?')) {
                      onDelete(inv.id)
                    }
                  }}
                  className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-100"
                  title="Eliminar invitación"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
