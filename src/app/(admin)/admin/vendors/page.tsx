import { createSupabaseServerClient } from '@/lib/supabase/server'
import { isoToday, isoInDays } from '@/lib/dates'
import StatCard from '@/components/admin/StatCard'
import VendorBoard, { type BoardVendor } from '@/components/admin/vendors/VendorBoard'
import { Handshake, FileSignature, CalendarClock, Euro } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function VendorsPage() {
  const supabase = createSupabaseServerClient()

  const { data: rawVendors } = await supabase
    .from('vendors')
    .select(`
      *,
      vendor_contracts ( id, title, file_path, amount, signed_at, notes, budget_item_id ),
      vendor_payments ( id, concept, amount, due_date, paid_at, budget_item_id )
    `)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })

  const { data: budgetItems } = await supabase
    .from('budget_items')
    .select('id, name')
    .order('name', { ascending: true })

  const vendors: BoardVendor[] = (rawVendors || []).map((v: {
    id: string
    name: string
    service_type: string
    status: string
    contact_name: string | null
    phone: string | null
    email: string | null
    website: string | null
    rating: number | null
    notes: string | null
    vendor_contracts: {
      id: string
      title: string
      file_path: string | null
      amount: number | string | null
      signed_at: string | null
      notes: string | null
      budget_item_id: string | null
    }[] | null
    vendor_payments: {
      id: string
      concept: string
      amount: number | string | null
      due_date: string
      paid_at: string | null
      budget_item_id: string | null
    }[] | null
  }) => ({
    id: v.id,
    name: v.name,
    serviceType: v.service_type,
    status: (['candidato', 'contactado', 'contratado', 'descartado'].includes(v.status) ? v.status : 'candidato') as BoardVendor['status'],
    contactName: v.contact_name,
    phone: v.phone,
    email: v.email,
    website: v.website,
    rating: v.rating,
    notes: v.notes,
    contracts: (v.vendor_contracts || []).map((c) => ({
      id: c.id,
      title: c.title,
      filePath: c.file_path,
      amount: c.amount === null ? null : Number(c.amount),
      signedAt: c.signed_at,
      notes: c.notes,
      budgetItemId: c.budget_item_id,
    })),
    payments: (v.vendor_payments || []).map((p) => ({
      id: p.id,
      concept: p.concept,
      amount: p.amount === null ? null : Number(p.amount),
      dueDate: p.due_date,
      paidAt: p.paid_at,
      budgetItemId: p.budget_item_id,
    })),
  }))

  // Stats + alerts
  const today = isoToday()
  const in30 = isoInDays(30)

  const contractedTotal = vendors.reduce(
    (n, v) => n + v.contracts.reduce((s, c) => s + (c.amount ?? 0), 0),
    0
  )
  const pendingPayments = vendors.flatMap((v) =>
    v.payments.filter((p) => !p.paidAt).map((p) => ({ ...p, vendorName: v.name }))
  )
  const overduePayments = pendingPayments.filter((p) => p.dueDate < today)
  const upcomingPayments = pendingPayments.filter((p) => p.dueDate >= today && p.dueDate <= in30)
  const pendingAmount = pendingPayments.reduce((n, p) => n + (p.amount ?? 0), 0)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Proveedores</h1>
        <p className="text-gray-500 mt-1">Contactos, contratos y pagos</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Proveedores" value={vendors.length} icon={Handshake} color="bg-sage-light/40 text-sage-dark" />
        <StatCard title="Contratos" value={vendors.reduce((n, v) => n + v.contracts.length, 0)} icon={FileSignature} color="bg-blue-50 text-blue-600" />
        <StatCard title="Contratado" value={contractedTotal} icon={Euro} color="bg-emerald-50 text-emerald-600" />
        <StatCard title="Pagos pendientes" value={pendingPayments.length} icon={CalendarClock} color="bg-amber-50 text-amber-600" />
      </div>

      <VendorBoard
        vendors={vendors}
        overdueCount={overduePayments.length}
        upcomingCount={upcomingPayments.length}
        pendingAmount={pendingAmount}
        budgetItems={budgetItems || []}
      />
    </div>
  )
}
