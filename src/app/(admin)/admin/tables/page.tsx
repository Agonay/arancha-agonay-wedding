import { createSupabaseServerClient } from '@/lib/supabase/server'
import { firstOf } from '@/lib/embed'
import StatCard from '@/components/admin/StatCard'
import SeatingBoard from '@/components/admin/seating/SeatingBoard'
import { Users, Table2, UserX, Armchair } from 'lucide-react'

export const dynamic = 'force-dynamic'

interface GuestRowLike {
  id: string
  first_name: string
  last_name: string
  display_name: string | null
  phone?: string | null
  guest_groups: unknown
  rsvps: { attendance: string | null; plus_one_name: string | null }[] | null
}

function groupName(groups: unknown): string | null {
  const g = groups as { name: string } | { name: string }[] | null
  if (Array.isArray(g)) return g[0]?.name ?? null
  return g?.name ?? null
}

function displayName(g: { first_name: string; last_name: string; display_name: string | null }) {
  return g.display_name || `${g.first_name} ${g.last_name}`
}

export default async function TablesPage() {
  const supabase = createSupabaseServerClient()

  const [tablesResult, poolResult] = await Promise.all([
    supabase
      .from('tables')
      .select(`
        *,
        guests (
          id,
          first_name,
          last_name,
          display_name,
          guest_groups ( name ),
          rsvps ( attendance, plus_one_name )
        )
      `)
      .order('sort_order', { ascending: true }),
    supabase
      .from('guests')
      .select(`
        id,
        first_name,
        last_name,
        display_name,
        phone,
        guest_groups ( name ),
        rsvps!inner ( attendance, plus_one_name )
      `)
      .is('table_id', null)
      .eq('rsvps.attendance', 'attending')
      .order('last_name', { ascending: true }),
  ])

  const rawTables = (tablesResult.data || []) as {
    id: string
    name: string
    capacity: number
    notes: string | null
    guests: GuestRowLike[] | null
  }[]

  const rawPool = (poolResult.data || []) as unknown as GuestRowLike[]

  const boardTables = rawTables.map((t) => ({
    id: t.id,
    name: t.name,
    capacity: t.capacity,
    notes: t.notes,
    guests: (t.guests || []).map((g) => {
      const rsvp = firstOf<{ attendance: string | null; plus_one_name: string | null }>(g.rsvps)
      const attending = rsvp?.attendance === 'attending'
      return {
        id: g.id,
        name: displayName(g),
        group: groupName(g.guest_groups),
        plusOne: attending ? rsvp?.plus_one_name || null : null,
        confirmed: attending,
      }
    }),
  }))

  const pool = rawPool.map((g) => {
    const rsvp = firstOf<{ attendance: string | null; plus_one_name: string | null }>(g.rsvps)
    return {
      id: g.id,
      name: displayName(g),
      group: groupName(g.guest_groups),
      phone: g.phone || null,
      plusOne: rsvp?.plus_one_name || null,
    }
  })

  // Stats
  const occupiedAt = (t: { guests: { plusOne: string | null }[] }) =>
    t.guests.reduce((n, g) => n + 1 + (g.plusOne ? 1 : 0), 0)

  const totalCapacity = boardTables.reduce((n, t) => n + t.capacity, 0)
  const totalOccupied = boardTables.reduce((n, t) => n + occupiedAt(t), 0)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Mesas</h1>
        <p className="text-gray-500 mt-1">Organización del banquete</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Mesas" value={boardTables.length} icon={Table2} color="bg-sage-light/40 text-sage-dark" />
        <StatCard title="Aforo total" value={totalCapacity} icon={Armchair} color="bg-blue-50 text-blue-600" />
        <StatCard title="Plazas ocupadas" value={totalOccupied} icon={Users} color="bg-emerald-50 text-emerald-600" />
        <StatCard title="Confirmados sin mesa" value={pool.length} icon={UserX} color="bg-amber-50 text-amber-600" />
      </div>

      <SeatingBoard tables={boardTables} pool={pool} />
    </div>
  )
}
