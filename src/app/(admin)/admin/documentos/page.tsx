import { createSupabaseServerClient } from '@/lib/supabase/server'
import StatCard from '@/components/admin/StatCard'
import DocumentsBoard, { type BoardDocument } from '@/components/admin/documents/DocumentsBoard'
import { FileText, Euro } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function DocumentsPage() {
  const supabase = createSupabaseServerClient()

  const [docsResult, vendorsResult, itemsResult] = await Promise.all([
    supabase
      .from('documents')
      .select(`
        id,
        title,
        category,
        file_path,
        amount,
        doc_date,
        vendor_id,
        budget_item_id,
        notes
      `)
      .order('doc_date', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false }),
    supabase.from('vendors').select('id, name'),
    supabase.from('budget_items').select('id, name'),
  ])

  const vendorNames = new Map((vendorsResult.data || []).map((v) => [v.id, v.name]))
  const itemNames = new Map((itemsResult.data || []).map((i) => [i.id, i.name]))

  const docs: BoardDocument[] = (docsResult.data || []).map((d) => ({
    id: d.id,
    title: d.title,
    category: d.category,
    filePath: d.file_path,
    amount: d.amount === null ? null : Number(d.amount),
    docDate: d.doc_date,
    vendorId: d.vendor_id,
    vendorName: d.vendor_id ? vendorNames.get(d.vendor_id) ?? null : null,
    budgetItemId: d.budget_item_id,
    budgetItemName: d.budget_item_id ? itemNames.get(d.budget_item_id) ?? null : null,
    notes: d.notes,
  }))

  // Stats: total docs + registered amounts
  const totalAmount = docs.reduce((n, d) => n + (d.amount ?? 0), 0)
  const invoiceCount = docs.filter((d) => d.category === 'Factura').length

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Documentos</h1>
        <p className="text-gray-500 mt-1">Archivo de la boda: facturas, recibos y contratos</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Documentos" value={docs.length} icon={FileText} color="bg-sage-light/40 text-sage-dark" />
        <StatCard title="Facturas" value={invoiceCount} icon={FileText} color="bg-blue-50 text-blue-600" />
        <StatCard title="Importe registrado" value={totalAmount} icon={Euro} color="bg-emerald-50 text-emerald-600" />
      </div>

      <DocumentsBoard
        docs={docs}
        vendors={vendorsResult.data || []}
        budgetItems={(itemsResult.data || []).map((i) => ({ id: i.id, name: i.name }))}
      />
    </div>
  )
}
