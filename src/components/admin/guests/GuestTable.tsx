'use client'

import { useState } from 'react'
import { Search, Mail, Trash2, Pencil, Download, FileDown } from 'lucide-react'
import Link from 'next/link'
import { firstOf } from '@/lib/embed'

interface GuestRow {
  id: string
  first_name: string
  last_name: string
  display_name: string | null
  phone: string | null
  email: string | null
  notes: string | null
  guest_groups: { id: string; name: string; color: string | null } | null
  invitation_guests: {
    is_primary: boolean
    invitations: { token: string; status: string; delivered_at: string | null }
  }[] | null
  rsvps: unknown
}

interface GuestTableProps {
  guests: GuestRow[]
  groups: { id: string; name: string; color: string | null }[]
  onDelete: (id: string) => Promise<void>
}

export default function GuestTable({ guests, groups, onDelete }: GuestTableProps) {
  const [search, setSearch] = useState('')
  const [filterGroup, setFilterGroup] = useState('')

  const filtered = guests.filter((g) => {
    const name = `${g.first_name} ${g.last_name}`.toLowerCase()
    const matchesSearch = !search || name.includes(search.toLowerCase())
    const matchesGroup = !filterGroup || g.guest_groups?.id === filterGroup
    return matchesSearch && matchesGroup
  })

  const getInvitation = (g: GuestRow) => g.invitation_guests?.[0]?.invitations || null

  const exportCSV = (type: string) => {
    const rows: string[][] = []

    if (type === 'all') {
      rows.push(['Nombre', 'Apellido', 'Grupo', 'Email', 'Teléfono', 'Notas'])
      for (const g of guests) {
        rows.push([
          g.first_name,
          g.last_name,
          g.guest_groups?.name || '',
          g.email || '',
          g.phone || '',
          g.notes || '',
        ])
      }
    } else if (type === 'rsvps') {
      rows.push(['Nombre', 'Apellido', 'Grupo', 'Asistencia', '+1', 'Alergias', 'Notas'])
      for (const g of guests) {
        const rsvp = firstOf<{ attendance: string | null; plus_one_name: string | null; dietary_notes: string | null; notes: string | null }>(g.rsvps)
        if (rsvp) {
          rows.push([
            g.first_name,
            g.last_name,
            g.guest_groups?.name || '',
            rsvp.attendance === 'attending' ? 'Sí' : 'No',
            rsvp.plus_one_name || '',
            rsvp.dietary_notes || '',
            rsvp.notes || '',
          ])
        }
      }
    }

    const csv = rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `invitados-${type}-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="bg-white rounded-xl border">
      <div className="flex flex-col sm:flex-row gap-3 p-4 border-b">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar invitados..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <select
          value={filterGroup}
          onChange={(e) => setFilterGroup(e.target.value)}
          className="px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="">Todos los grupos</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>
        <div className="flex gap-2">
          <button
            onClick={() => exportCSV('all')}
            className="flex items-center gap-1.5 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50"
            title="Exportar todos"
          >
            <Download className="h-4 w-4" />
            Exportar
          </button>
          <button
            onClick={() => exportCSV('rsvps')}
            className="flex items-center gap-1.5 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50"
            title="Exportar RSVPs"
          >
            <FileDown className="h-4 w-4" />
            RSVP
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Nombre</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Grupo</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 hidden md:table-cell">Email</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 hidden lg:table-cell">Teléfono</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 hidden md:table-cell">Invitación</th>
              <th className="text-right px-4 py-3 font-medium text-gray-500">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-gray-400">
                  {guests.length === 0 ? 'No hay invitados. Añade el primero.' : 'No se encontraron resultados'}
                </td>
              </tr>
            ) : (
              filtered.map((guest) => {
                const invitation = getInvitation(guest)
                return (
                  <tr key={guest.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link href={`/admin/guests/${guest.id}`} className="font-medium text-gray-900 hover:text-emerald-600 transition-colors">
                        {guest.display_name || `${guest.first_name} ${guest.last_name}`}
                      </Link>
                      {guest.notes && (
                        <div className="text-xs text-gray-400 truncate max-w-xs mt-0.5">{guest.notes}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {guest.guest_groups ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                          {guest.guest_groups.name}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{guest.email || '—'}</td>
                    <td className="px-4 py-3 text-gray-500 hidden lg:table-cell">{guest.phone || '—'}</td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {invitation ? (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          invitation.status === 'delivered'
                            ? 'bg-blue-50 text-blue-700'
                            : invitation.status === 'sent'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {invitation.status === 'delivered' ? 'Entregada' : invitation.status === 'sent' ? 'Enviada' : 'Pendiente'}
                        </span>
                      ) : (
                        <span className="text-gray-400">Sin invitación</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Link
                          href={`/admin/guests/${guest.id}`}
                          className="p-1.5 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100"
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </Link>
                        {invitation && (
                          <a
                            href={`/i/${invitation.token}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100"
                            title="Ver invitación"
                          >
                            <Mail className="h-4 w-4" />
                          </a>
                        )}
                        <button
                          onClick={() => {
                            if (confirm(`¿Eliminar a ${guest.first_name} ${guest.last_name}?`)) {
                              onDelete(guest.id)
                            }
                          }}
                          className="p-1.5 text-gray-400 hover:text-red-600 rounded hover:bg-gray-100"
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
