'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Guest {
  id: string
  first_name: string
  last_name: string
  display_name: string | null
  group_id: string | null
  phone: string | null
  email: string | null
  notes: string | null
  guest_groups: { id: string; name: string; color: string | null } | null
  rsvps: Record<string, unknown>[] | null
}

interface GuestEditFormProps {
  guest: Guest
  groups: { id: string; name: string; color: string | null }[]
  onUpdate: (id: string, data: Record<string, unknown>) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

export default function GuestEditForm({ guest, groups, onUpdate, onDelete }: GuestEditFormProps) {
  const router = useRouter()
  const [form, setForm] = useState({
    first_name: guest.first_name,
    last_name: guest.last_name,
    display_name: guest.display_name || '',
    group_id: guest.group_id || '',
    phone: guest.phone || '',
    email: guest.email || '',
    notes: guest.notes || '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      await onUpdate(guest.id, {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        display_name: form.display_name.trim() || null,
        group_id: form.group_id || null,
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        notes: form.notes.trim() || null,
      })
      router.push('/admin/guests')
      router.refresh()
    } catch {
      setError('Error al guardar los cambios.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (confirm(`¿Eliminar a ${form.first_name} ${form.last_name} de forma permanente?`)) {
      try {
        await onDelete(guest.id)
        router.push('/admin/guests')
        router.refresh()
      } catch {
        setError('Error al eliminar el invitado.')
      }
    }
  }

  return (
    <div className="bg-white rounded-xl border p-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
          <input
            type="text"
            value={form.first_name}
            onChange={(e) => setForm({ ...form, first_name: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Apellido</label>
          <input
            type="text"
            value={form.last_name}
            onChange={(e) => setForm({ ...form, last_name: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre para mostrar</label>
          <input
            type="text"
            value={form.display_name}
            onChange={(e) => setForm({ ...form, display_name: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="Ej: Familia García, Laura + Carlos..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Grupo</label>
          <select
            value={form.group_id}
            onChange={(e) => setForm({ ...form, group_id: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">Sin grupo</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
          />
        </div>
      </div>

      {guest.rsvps?.length ? (
        <div className="mt-6 pt-6 border-t">
          <h3 className="text-sm font-medium text-gray-700 mb-2">RSVP</h3>
          <div className="text-sm text-gray-500">
            {guest.rsvps[0] && (
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                (guest.rsvps[0] as any).attendance === 'attending'
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-red-50 text-red-700'
              }`}>
                {(guest.rsvps[0] as any).attendance === 'attending' ? 'Asiste' : 'No asiste'}
              </span>
            )}
          </div>
        </div>
      ) : null}

      {error && (
        <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between mt-6 pt-4 border-t">
        <button
          onClick={handleDelete}
          className="text-sm text-red-600 hover:text-red-700"
        >
          Eliminar invitado
        </button>
        <div className="flex gap-3">
          <button
            onClick={() => router.back()}
            className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  )
}
