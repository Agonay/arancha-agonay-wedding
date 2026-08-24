'use client'

import { useMemo, useState } from 'react'
import {
  Copy,
  Check,
  CheckCircle,
  MessageCircle,
  RotateCcw,
} from 'lucide-react'
import type { MessageTemplate } from '@/lib/messages'
import { TEMPLATE_LABELS, defaultMessage, waMeHref } from '@/lib/messages'

export interface CommRecipient {
  id: string
  names: string
  url: string
  phone: string | null
  delivered: boolean
  rsvpState: 'pendiente' | 'confirmada' | 'rechazada' | 'mixta'
}

type Filter = 'todas' | 'sin_entregar' | 'sin_responder'

const RSVP_CHIP: Record<CommRecipient['rsvpState'], { label: string; cls: string }> = {
  pendiente: { label: 'Sin responder', cls: 'bg-amber-50 text-amber-700 border border-dashed border-amber-300' },
  confirmada: { label: 'Confirmada', cls: 'bg-emerald-50 text-emerald-700' },
  rechazada: { label: 'No asistirá', cls: 'bg-red-50 text-red-600' },
  mixta: { label: 'Parcial', cls: 'bg-blue-50 text-blue-700' },
}

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'todas', label: 'Todas' },
  { key: 'sin_entregar', label: 'Sin entregar' },
  { key: 'sin_responder', label: 'Pendientes de respuesta' },
]

export default function CommsBoard({
  recipients,
  venue,
  onToggleDelivered,
}: {
  recipients: CommRecipient[]
  venue: string | null
  onToggleDelivered: (id: string, delivered: boolean) => Promise<unknown>
}) {
  const [template, setTemplate] = useState<MessageTemplate>('invitacion')
  const [filter, setFilter] = useState<Filter>('todas')
  const [overrides, setOverrides] = useState<Map<string, string>>(new Map())
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const counts = useMemo(
    () => ({
      todas: recipients.length,
      sin_entregar: recipients.filter((r) => !r.delivered).length,
      sin_responder: recipients.filter((r) => r.rsvpState === 'pendiente').length,
    }),
    [recipients]
  )

  const filtered = useMemo(() => {
    if (filter === 'sin_entregar') return recipients.filter((r) => !r.delivered)
    if (filter === 'sin_responder') return recipients.filter((r) => r.rsvpState === 'pendiente')
    return recipients
  }, [recipients, filter])

  const textFor = (r: CommRecipient) =>
    overrides.get(`${r.id}:${template}`) ?? defaultMessage(template, r.names, r.url, venue)

  const setOverride = (key: string, value: string) =>
    setOverrides((prev) => new Map(prev).set(key, value))

  const resetOverride = (key: string) =>
    setOverrides((prev) => {
      const next = new Map(prev)
      next.delete(key)
      return next
    })

  const copyText = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(id)
      window.setTimeout(() => setCopiedId(null), 2000)
    } catch {
      alert('No se pudo copiar al portapapeles')
    }
  }

  const toggleDelivered = async (r: CommRecipient) => {
    setBusyId(r.id)
    try {
      await onToggleDelivered(r.id, !r.delivered)
    } catch {
      alert('Error al actualizar el estado')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Template tabs */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-gray-500 mr-1">Mensaje:</span>
        {(Object.keys(TEMPLATE_LABELS) as MessageTemplate[]).map((t) => (
          <button
            key={t}
            onClick={() => setTemplate(t)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              template === t
                ? 'bg-charcoal text-white'
                : 'bg-white border text-gray-600 hover:bg-gray-50'
            }`}
          >
            {TEMPLATE_LABELS[t]}
          </button>
        ))}
        <span className="ml-auto text-xs text-gray-400">
          {venue ? `Lugar en la invitación: ${venue}` : null}
        </span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === key
                ? 'bg-sage-dark text-white'
                : 'bg-white border text-gray-600 hover:bg-gray-50'
            }`}
          >
            {label} ({counts[key]})
          </button>
        ))}
      </div>

      {/* Recipient cards */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border p-8 text-center text-gray-400">
          No hay invitaciones que coincidan con este filtro.
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((r) => {
            const key = `${r.id}:${template}`
            const text = textFor(r)
            const isEdited = overrides.has(key)
            const chip = RSVP_CHIP[r.rsvpState]
            return (
              <li key={r.id} className="bg-white rounded-xl border p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-gray-900">{r.names}</span>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium ${chip.cls}`}>
                        {chip.label}
                      </span>
                      <button
                        onClick={() => toggleDelivered(r)}
                        disabled={busyId === r.id}
                        title={r.delivered ? 'Entregada — pulsar para deshacer' : 'Marcar como entregada'}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium transition-opacity ${
                          r.delivered
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-gray-400 hover:text-gray-600 border border-dashed border-gray-300'
                        }`}
                      >
                        <CheckCircle className={`h-3 w-3 ${r.delivered ? '' : 'opacity-40'}`} />
                        {r.delivered ? 'Entregada' : 'Marcar entregada'}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => copyText(r.id + template, text)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        copiedId === r.id + template
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-charcoal text-white hover:bg-warm-gray'
                      }`}
                    >
                      {copiedId === r.id + template ? (
                        <>
                          <Check className="h-3.5 w-3.5" /> ¡Copiado!
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" /> Copiar mensaje
                        </>
                      )}
                    </button>
                    {r.phone && (
                      <a
                        href={waMeHref(r.phone, text)}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={`Abrir WhatsApp (${r.phone})`}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-700"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        WhatsApp
                      </a>
                    )}
                    <button
                      onClick={() => copyText(r.id + ':url', r.url)}
                      title="Copiar solo el enlace"
                      className={`p-2 rounded-lg text-xs transition-colors ${
                        copiedId === r.id + ':url'
                          ? 'text-emerald-600 bg-emerald-50'
                          : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {copiedId === r.id + ':url' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <textarea
                    value={text}
                    onChange={(e) => setOverride(key, e.target.value)}
                    rows={template === 'invitacion' ? 9 : 8}
                    className="w-full px-3 py-2 pr-9 border rounded-lg text-sm text-gray-700 bg-cream/60 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-y font-mono leading-relaxed"
                  />
                  {isEdited && (
                    <button
                      onClick={() => resetOverride(key)}
                      title="Restaurar texto original"
                      className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-sage-dark bg-white/80 rounded-md hover:bg-white"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
