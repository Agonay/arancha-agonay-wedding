'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { firstOf } from '@/lib/embed'
import ConfirmModal from '@/components/ui/ConfirmModal'

interface Guest {
  id: string
  first_name: string
  last_name: string
  display_name: string | null
  group_id: string | null
  phone: string | null
  email: string | null
  notes: string | null
  plus_one_allowed: boolean
  guest_groups: { id: string; name: string; color: string | null } | null
  rsvps: unknown
}

interface GuestEditFormProps {
  guest: Guest
  groups: { id: string; name: string; color: string | null }[]
  onUpdate: (id: string, data: Record<string, unknown>) => Promise<void>
  onUpdateRsvp: (guestId: string, data: Record<string, unknown>) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onDeleteRsvp: (guestId: string) => Promise<void>
}

export default function GuestEditForm({ guest, groups, onUpdate, onUpdateRsvp, onDelete, onDeleteRsvp }: GuestEditFormProps) {
  const router = useRouter()
  const existingRsvp = firstOf<{
    attendance: string | null
    plus_one_name: string | null
    plus_one_dietary_notes: string | null
    dietary_notes: string | null
    transport_required: boolean | null
    accommodation_notes: string | null
    notes: string | null
    admin_notified: boolean | null
  }>(guest.rsvps)
  const [form, setForm] = useState({
    first_name: guest.first_name,
    last_name: guest.last_name,
    display_name: guest.display_name || '',
    group_id: guest.group_id || '',
    phone: guest.phone || '',
    email: guest.email || '',
    notes: guest.notes || '',
    plus_one_allowed: guest.plus_one_allowed,
  })
  const [rsvpForm, setRsvpForm] = useState({
    attendance: existingRsvp?.attendance || '',
    plus_one: !!(existingRsvp?.plus_one_name || existingRsvp?.plus_one_dietary_notes),
    plus_one_name: existingRsvp?.plus_one_name || '',
    plus_one_dietary_notes: existingRsvp?.plus_one_dietary_notes || '',
    dietary_notes: existingRsvp?.dietary_notes || '',
    transport_required: existingRsvp?.transport_required || false,
    accommodation_notes: existingRsvp?.accommodation_notes || '',
    notes: existingRsvp?.notes || '',
  })
  const [saving, setSaving] = useState(false)
  const [savingRsvp, setSavingRsvp] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rsvpSuccess, setRsvpSuccess] = useState(false)
  const [showDeleteRsvpModal, setShowDeleteRsvpModal] = useState(false)
  const [deletingRsvp, setDeletingRsvp] = useState(false)

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
        plus_one_allowed: form.plus_one_allowed,
      })
      router.push('/admin/guests')
      router.refresh()
    } catch {
      setError('Error al guardar los cambios.')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveRsvp = async () => {
    setSavingRsvp(true)
    setRsvpSuccess(false)
    try {
      const attending = rsvpForm.attendance === 'attending'
      const withPlusOne = attending && rsvpForm.plus_one && guest.plus_one_allowed
      await onUpdateRsvp(guest.id, {
        attendance: rsvpForm.attendance || null,
        plus_one_name: withPlusOne ? rsvpForm.plus_one_name.trim() || null : null,
        plus_one_dietary_notes: withPlusOne ? rsvpForm.plus_one_dietary_notes.trim() || null : null,
        dietary_notes: rsvpForm.dietary_notes || null,
        transport_required: rsvpForm.transport_required || null,
        accommodation_notes: rsvpForm.accommodation_notes || null,
        notes: rsvpForm.notes || null,
        admin_notified: false,
      })
      setRsvpSuccess(true)
      setTimeout(() => setRsvpSuccess(false), 3000)
      router.refresh()
    } catch {
      setError('Error al guardar el RSVP.')
    } finally {
      setSavingRsvp(false)
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

  const handleDeleteRsvp = async () => {
    setDeletingRsvp(true)
    try {
      await onDeleteRsvp(guest.id)
      setShowDeleteRsvpModal(false)
      setRsvpForm({
        attendance: '',
        plus_one: false,
        plus_one_name: '',
        plus_one_dietary_notes: '',
        dietary_notes: '',
        transport_required: false,
        accommodation_notes: '',
        notes: '',
      })
      setRsvpSuccess(false)
      router.refresh()
    } catch {
      setError('Error al eliminar el RSVP.')
      setShowDeleteRsvpModal(false)
    } finally {
      setDeletingRsvp(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Guest info */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Información del invitado</h2>
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
              rows={2}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
          </div>
          <div className="sm:col-span-2">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="plusone-allowed"
                checked={form.plus_one_allowed}
                onChange={(e) => setForm({ ...form, plus_one_allowed: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              <label htmlFor="plusone-allowed" className="text-sm text-gray-600">
                Puede traer acompañante (+1)
              </label>
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
        )}

        <div className="flex items-center justify-between mt-6 pt-4 border-t">
          <button onClick={handleDelete} className="text-sm text-red-600 hover:text-red-700">
            Eliminar invitado
          </button>
          <div className="flex gap-3">
            <button onClick={() => router.back()} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">
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

      {/* RSVP section */}
      <div className="bg-white rounded-xl border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900">RSVP</h2>
          {existingRsvp && (
            <button
              onClick={() => setShowDeleteRsvpModal(true)}
              className="flex items-center gap-1.5 text-sm text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
              Limpiar RSVP
            </button>
          )}
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Asistencia</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setRsvpForm({ ...rsvpForm, attendance: 'attending' })}
                className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors ${
                  rsvpForm.attendance === 'attending'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-50 border text-gray-700 hover:bg-gray-100'
                }`}
              >
                Asiste
              </button>
              <button
                type="button"
                onClick={() => setRsvpForm({ ...rsvpForm, attendance: 'not_attending' })}
                className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors ${
                  rsvpForm.attendance === 'not_attending'
                    ? 'bg-gray-700 text-white'
                    : 'bg-gray-50 border text-gray-700 hover:bg-gray-100'
                }`}
              >
                No asiste
              </button>
            </div>
          </div>

          {rsvpForm.attendance === 'attending' && (
            <>
              {guest.plus_one_allowed && (
              <div className="sm:col-span-2">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="plusone-edit"
                    checked={rsvpForm.plus_one}
                    onChange={(e) => setRsvpForm({ ...rsvpForm, plus_one: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <label htmlFor="plusone-edit" className="text-sm text-gray-600">Va acompañado/a</label>
                </div>
              </div>
              )}

              {rsvpForm.plus_one && guest.plus_one_allowed && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del acompañante *</label>
                    <input
                      type="text"
                      value={rsvpForm.plus_one_name}
                      onChange={(e) => setRsvpForm({ ...rsvpForm, plus_one_name: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="Nombre y apellidos"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Alergias del acompañante *</label>
                    <input
                      type="text"
                      value={rsvpForm.plus_one_dietary_notes}
                      onChange={(e) => setRsvpForm({ ...rsvpForm, plus_one_dietary_notes: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder='Ej: gluten... o "ninguna"'
                    />
                  </div>
                </>
              )}

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Alergias / intolerancias</label>
                <input
                  type="text"
                  value={rsvpForm.dietary_notes}
                  onChange={(e) => setRsvpForm({ ...rsvpForm, dietary_notes: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Ej: gluten, frutos secos..."
                />
              </div>

              <div className="sm:col-span-2 flex items-center gap-3">
                <input
                  type="checkbox"
                  id="transport-edit"
                  checked={rsvpForm.transport_required}
                  onChange={(e) => setRsvpForm({ ...rsvpForm, transport_required: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="transport-edit" className="text-sm text-gray-600">Necesita transporte</label>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Alojamiento</label>
                <input
                  type="text"
                  value={rsvpForm.accommodation_notes}
                  onChange={(e) => setRsvpForm({ ...rsvpForm, accommodation_notes: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Hotel o alojamiento"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                <textarea
                  value={rsvpForm.notes}
                  onChange={(e) => setRsvpForm({ ...rsvpForm, notes: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                  placeholder="Cualquier otra cosa..."
                />
              </div>
            </>
          )}
        </div>

        {existingRsvp?.admin_notified === false && (
          <div className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-700 flex items-center gap-2">
            <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
            RSVP actualizado por el invitado desde tu última revisión
          </div>
        )}

        {rsvpSuccess && (
          <div className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">
            RSVP guardado correctamente
          </div>
        )}

        <div className="mt-4 flex justify-end">
          <button
            onClick={handleSaveRsvp}
            disabled={
              savingRsvp ||
              !rsvpForm.attendance ||
              (rsvpForm.plus_one && (!rsvpForm.plus_one_name.trim() || !rsvpForm.plus_one_dietary_notes.trim()))
            }
            className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
          >
            {savingRsvp ? 'Guardando...' : 'Guardar RSVP'}
          </button>
        </div>
      </div>

      {showDeleteRsvpModal && (
        <ConfirmModal
          title="Limpiar RSVP"
          message={`¿Eliminar la respuesta de ${form.first_name} ${form.last_name}? El invitado volverá a aparecer como pendiente y podrá responder de nuevo. Esta acción no se puede deshacer.`}
          confirmLabel="Eliminar respuesta"
          loading={deletingRsvp}
          onConfirm={handleDeleteRsvp}
          onClose={() => setShowDeleteRsvpModal(false)}
        />
      )}
    </div>
  )
}
