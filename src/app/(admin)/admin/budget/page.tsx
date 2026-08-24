import { createSupabaseServerClient } from '@/lib/supabase/server'
import StatCard from '@/components/admin/StatCard'
import BudgetBoard, { type BoardCategory, type BoardItem } from '@/components/admin/budget/BudgetBoard'
import { Wallet, Receipt, HandCoins, Clock } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function BudgetPage() {
  const supabase = createSupabaseServerClient()

  const [categoriesResult, itemsResult, rsvpsResult] = await Promise.all([
    supabase
      .from('budget_categories')
      .select('id, name, sort_order')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true }),
    supabase
      .from('budget_items')
      .select(`
        id,
        category_id,
        name,
        vendor,
        estimated_amount,
        actual_amount,
        paid_amount,
        due_date,
        notes,
        pricing_mode,
        unit_price,
        guest_count,
        iva_rate,
        units_with_iva
      `)
      .order('name', { ascending: true }),
    supabase.from('rsvps').select('attendance, plus_one_name'),
  ])

  const categories: BoardCategory[] = categoriesResult.data || []
  const rawItems = itemsResult.data || []

  // Confirmed comensales: attending guests + their +1s
  const confirmedGuests = (rsvpsResult.data || []).reduce(
    (n, r) => (r.attendance === 'attending' ? n + 1 + (r.plus_one_name ? 1 : 0) : n),
    0
  )

  const pendingOf = (i: { actual_amount: number | null; estimated_amount: number; paid_amount: number }) =>
    Math.max((i.actual_amount ?? i.estimated_amount) - i.paid_amount, 0)

  const items: BoardItem[] = rawItems.map((i) => ({
    id: i.id,
    category_id: i.category_id,
    name: i.name,
    vendor: i.vendor,
    estimated: Number(i.estimated_amount),
    actual: i.actual_amount === null ? null : Number(i.actual_amount),
    paid: Number(i.paid_amount),
    dueDate: i.due_date,
    notes: i.notes,
    pending: pendingOf(i),
    pricingMode: i.pricing_mode === 'per_guest' ? 'per_guest' : 'total',
    unitPrice: i.unit_price === null ? null : Number(i.unit_price),
    guestCount: i.guest_count === null ? null : Number(i.guest_count),
    ivaRate: i.iva_rate === null ? null : Number(i.iva_rate),
    unitsWithIva: i.units_with_iva,
  }))

  // Global stats
  const totalEstimated = items.reduce((n, i) => n + i.estimated, 0)
  const totalActual = items.reduce((n, i) => n + (i.actual ?? 0), 0)
  const totalPaid = items.reduce((n, i) => n + i.paid, 0)
  const totalPending = items.reduce((n, i) => n + i.pending, 0)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Presupuesto</h1>
        <p className="text-gray-500 mt-1">Control de gastos de la boda</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Presupuestado" value={totalEstimated} icon={Wallet} color="bg-sage-light/40 text-sage-dark" />
        <StatCard title="Contratado" value={totalActual} icon={Receipt} color="bg-blue-50 text-blue-600" />
        <StatCard title="Pagado" value={totalPaid} icon={HandCoins} color="bg-emerald-50 text-emerald-600" />
        <StatCard title="Pendiente de pago" value={totalPending} icon={Clock} color="bg-amber-50 text-amber-600" />
      </div>

      <BudgetBoard categories={categories} items={items} confirmedGuests={confirmedGuests} />
    </div>
  )
}
