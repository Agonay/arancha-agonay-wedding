'use client'

import { useState, useEffect, useRef } from 'react'
import { undoCheckIn } from '@/features/wedding-day/actions'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser'
import { Check, UserX, Search, RotateCcw } from 'lucide-react'

interface GuestAttendance {
  id: string
  firstName: string
  lastName: string
  displayName: string | null
  checkedInAt: string | null
  attendance: string | null
}

export default function AttendanceList({ initial }: { initial: GuestAttendance[] }) {
  const [guests, setGuests] = useState(initial)
  const [filter, setFilter] = useState<'all' | 'checked' | 'pending'>('all')
  const [search, setSearch] = useState('')
  const [undoing, setUndoing] = useState<string | null>(null)
  const realtimeSet = useRef(false)

  useEffect(() => {
    if (realtimeSet.current) return
    realtimeSet.current = true

    const supabase = createSupabaseBrowserClient()
    const channel = supabase
      .channel('wedding-day-attendance')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'guests' },
        (payload) => {
          const row = payload.new as { id: string; checked_in_at: string | null }
          setGuests((prev) =>
            prev.map((g) => (g.id === row.id ? { ...g, checkedInAt: row.checked_in_at } : g))
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const handleUndo = async (guestId: string) => {
    setUndoing(guestId)
    await undoCheckIn(guestId)
    setGuests((prev) =>
      prev.map((g) => (g.id === guestId ? { ...g, checkedInAt: null } : g))
    )
    setUndoing(null)
  }

  const nameMatch = (g: GuestAttendance) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    const name = g.displayName || `${g.firstName} ${g.lastName}`
    return name.toLowerCase().includes(q)
  }

  const filtered = guests.filter((g) => {
    if (!nameMatch(g)) return false
    if (filter === 'checked') return !!g.checkedInAt
    if (filter === 'pending') return !g.checkedInAt
    return true
  })

  const checkedCount = guests.filter((g) => g.checkedInAt).length

  return (
    <div className="bg-white rounded-xl border p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-serif text-charcoal">Lista de asistencia</h2>
        <span className="text-sm text-warm-gray">
          {checkedCount} / {guests.length} confirmados
        </span>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-warm-gray-light" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sage"
          />
        </div>
        <div className="flex gap-1">
          {([['all', 'Todos'], ['checked', 'Llegados'], ['pending', 'Pendientes']] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === key
                  ? 'bg-sage text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1 max-h-96 overflow-y-auto">
        {filtered.length === 0 && (
          <p className="text-sm text-warm-gray-light py-4 text-center">Sin resultados</p>
        )}
        {filtered.map((g) => {
          const name = g.displayName || `${g.firstName} ${g.lastName}`
          const isChecked = !!g.checkedInAt
          return (
            <div
              key={g.id}
              className="flex items-center justify-between gap-3 p-2 rounded-lg hover:bg-cream"
            >
              <div className="flex items-center gap-3 min-w-0">
                {isChecked ? (
                  <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <UserX className="h-3.5 w-3.5 text-gray-400" />
                  </div>
                )}
                <span className={`text-sm truncate ${isChecked ? 'text-charcoal' : 'text-warm-gray'}`}>
                  {name}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {g.attendance === 'attending' && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                    Asiste
                  </span>
                )}
                {isChecked ? (
                  <button
                    onClick={() => handleUndo(g.id)}
                    disabled={undoing === g.id}
                    className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                    title="Deshacer check-in"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Deshacer
                  </button>
                ) : (
                  <span className="text-xs text-gray-300">—</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
