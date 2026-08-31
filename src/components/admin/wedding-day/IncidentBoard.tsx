'use client'

import { useState } from 'react'
import { createIncident, resolveIncident, deleteIncident, type IncidentInput } from '@/features/wedding-day/actions'
import { Plus, AlertTriangle, AlertCircle, XCircle, Info, CheckCircle, Trash2 } from 'lucide-react'

interface Incident {
  id: string
  title: string
  severity: string
  description: string | null
  resolved_at: string | null
  created_at: string
}

const SEVERITY_CONFIG: Record<string, { icon: typeof Info; color: string; bg: string; label: string }> = {
  low: { icon: Info, color: 'text-blue-600', bg: 'bg-blue-100', label: 'Baja' },
  medium: { icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-100', label: 'Media' },
  high: { icon: AlertCircle, color: 'text-orange-600', bg: 'bg-orange-100', label: 'Alta' },
  critical: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100', label: 'Crítica' },
}

const BORDER_COLORS: Record<string, string> = {
  low: 'border-l-blue-400',
  medium: 'border-l-amber-400',
  high: 'border-l-orange-400',
  critical: 'border-l-red-400',
}

export default function IncidentBoard({ initial }: { initial: Incident[] }) {
  const [incidents, setIncidents] = useState(initial)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<IncidentInput>({ title: '', severity: 'low', description: '' })
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) return
    setSubmitting(true)
    try {
      const newIncident = await createIncident(form)
      setIncidents((prev) => [newIncident, ...prev])
      setForm({ title: '', severity: 'low', description: '' })
      setShowForm(false)
    } catch {
      // handled by error boundary
    } finally {
      setSubmitting(false)
    }
  }

  const handleResolve = async (id: string) => {
    await resolveIncident(id)
    setIncidents((prev) =>
      prev.map((i) => (i.id === id ? { ...i, resolved_at: new Date().toISOString() } : i))
    )
  }

  const handleDelete = async (id: string) => {
    await deleteIncident(id)
    setIncidents((prev) => prev.filter((i) => i.id !== id))
  }

  const activeCount = incidents.filter((i) => !i.resolved_at).length

  return (
    <div className="bg-white rounded-xl border p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-serif text-charcoal">Incidencias</h2>
          {activeCount > 0 && (
            <p className="text-sm text-warm-gray">{activeCount} activa{activeCount !== 1 ? 's' : ''}</p>
          )}
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-3 py-2 bg-sage text-white text-sm font-medium rounded-lg hover:bg-sage-dark transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nueva
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 bg-cream rounded-lg space-y-3">
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">Título</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sage"
              placeholder="Ej: Falta silla en mesa 5"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">Severidad</label>
            <select
              value={form.severity}
              onChange={(e) => setForm({ ...form, severity: e.target.value as IncidentInput['severity'] })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sage"
            >
              <option value="low">Baja</option>
              <option value="medium">Media</option>
              <option value="high">Alta</option>
              <option value="critical">Crítica</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">Descripción (opcional)</label>
            <textarea
              value={form.description || ''}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sage resize-none"
              rows={2}
              placeholder="Detalles adicionales..."
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-charcoal text-white text-sm font-medium rounded-lg hover:bg-warm-gray transition-colors disabled:opacity-50"
            >
              {submitting ? 'Guardando...' : 'Crear'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false)
                setForm({ title: '', severity: 'low', description: '' })
              }}
              className="px-4 py-2 text-sm text-warm-gray hover:text-charcoal transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {incidents.length === 0 && (
          <p className="text-sm text-warm-gray-light py-4 text-center">Sin incidencias</p>
        )}
        {incidents.map((incident) => {
          const config = SEVERITY_CONFIG[incident.severity] || SEVERITY_CONFIG.low
          const Icon = incident.resolved_at ? CheckCircle : config.icon
          const borderColor = BORDER_COLORS[incident.severity] || BORDER_COLORS.low
          return (
            <div
              key={incident.id}
              className={`border-l-4 ${borderColor} rounded-r-lg p-3 ${
                incident.resolved_at ? 'opacity-50' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 min-w-0">
                  <Icon className={`h-4 w-4 mt-0.5 flex-shrink-0 ${incident.resolved_at ? 'text-emerald-500' : config.color}`} />
                  <div className="min-w-0">
                    <p className={`text-sm font-medium ${incident.resolved_at ? 'line-through text-warm-gray' : 'text-charcoal'}`}>
                      {incident.title}
                    </p>
                    {incident.description && (
                      <p className="text-xs text-warm-gray mt-0.5">{incident.description}</p>
                    )}
                    <p className="text-xs text-warm-gray-light mt-1">
                      {new Date(incident.created_at).toLocaleString('es-ES', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                      {' · '}
                      <span className="inline-flex px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                        {config.label}
                      </span>
                    </p>
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  {!incident.resolved_at && (
                    <button
                      onClick={() => handleResolve(incident.id)}
                      className="p-1 text-gray-400 hover:text-emerald-600 transition-colors"
                      title="Resolver"
                    >
                      <CheckCircle className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(incident.id)}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
