'use client'

import { useMemo, useRef, useState } from 'react'
import {
  Plus,
  Pencil,
  Trash2,
  Download,
  FileText,
  Search,
  Link2,
} from 'lucide-react'
import {
  createDocument,
  updateDocument,
  deleteDocument,
} from '@/features/documents/actions'
import { deleteContractDocument } from '@/features/vendors/actions'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser'
import { formatEUR, parseAmount } from '@/lib/money'
import { uniqueFileKey } from '@/lib/dates'

export interface BoardDocument {
  id: string
  title: string
  category: string
  filePath: string
  amount: number | null
  docDate: string | null
  vendorId: string | null
  vendorName: string | null
  budgetItemId: string | null
  budgetItemName: string | null
  contractId: string | null
  contractName: string | null
  notes: string | null
  source: 'document' | 'contract'
  contractDocumentId: string | null
}

const CATEGORIES = ['Factura', 'Recibo', 'Contrato', 'Seguro', 'Presupuesto/Cita', 'Otro']

const CATEGORY_CLS: Record<string, string> = {
  Factura: 'bg-blue-50 text-blue-700',
  Recibo: 'bg-emerald-50 text-emerald-700',
  Contrato: 'bg-purple-50 text-purple-700',
  Seguro: 'bg-amber-50 text-amber-700',
  'Presupuesto/Cita': 'bg-sage-light/40 text-sage-dark',
  Otro: 'bg-gray-100 text-gray-600',
}

function isImage(path: string) {
  return /\.(jpe?g|png|webp)$/i.test(path)
}

function formatDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return `${d}/${m}/${y}`
}

export default function DocumentsBoard({
  docs,
  vendors,
  budgetItems,
  contracts,
}: {
  docs: BoardDocument[]
  vendors: { id: string; name: string }[]
  budgetItems: { id: string; name: string }[]
  contracts: { id: string; title: string; vendorId: string }[]
}) {
  const [uploading, setUploading] = useState(false)
  const [editing, setEditing] = useState<BoardDocument | null>(null)
  const [categoryFilter, setCategoryFilter] = useState('todas')
  const [vendorFilter, setVendorFilter] = useState('')
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return docs.filter((d) => {
      if (categoryFilter !== 'todas' && d.category !== categoryFilter) return false
      if (vendorFilter && d.vendorId !== vendorFilter) return false
      if (q && !`${d.title} ${d.notes ?? ''} ${d.contractName ?? ''}`.toLowerCase().includes(q)) return false
      return true
    })
  }, [docs, categoryFilter, vendorFilter, search])

  const handleDelete = async (doc: BoardDocument) => {
    if (!confirm(`¿Eliminar "${doc.title}"? El archivo también se borrará.`)) return
    try {
      if (doc.source === 'contract' && doc.contractDocumentId) {
        await deleteContractDocument(doc.contractDocumentId)
      } else {
        await deleteDocument(doc.id)
      }
    } catch {
      alert('Error al eliminar el documento')
    }
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="todas">Todas las categorías</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select
            value={vendorFilter}
            onChange={(e) => setVendorFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">Todos los proveedores</option>
            {vendors.map((v) => (
              <option key={v.id} value={v.id}>{v.name}</option>
            ))}
          </select>
          <div className="relative">
            <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar…"
              className="pl-9 pr-3 py-2 border rounded-lg text-sm w-44 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
        <button
          onClick={() => setUploading(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors whitespace-nowrap self-start lg:self-auto"
        >
          <Plus className="h-4 w-4" />
          Subir documento
        </button>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border p-8 text-center text-gray-400">
          {docs.length === 0
            ? 'Aún no hay documentos. Sube la primera factura o recibo para tener todo el papel de la boda en un solo sitio.'
            : 'Ningún documento coincide con los filtros.'}
        </div>
      ) : (
        <ul className="bg-white rounded-xl border divide-y">
          {filtered.map((doc) => {
            const cls = CATEGORY_CLS[doc.category] || CATEGORY_CLS.Otro
            return (
              <li key={doc.id} className="px-4 py-3 flex items-center gap-3 group">
                <span className={`w-9 h-9 rounded-lg flex-shrink-0 flex items-center justify-center ${isImage(doc.filePath) ? 'bg-sage-light/30 text-sage-dark' : 'bg-red-50 text-red-500'}`}>
                  <FileText className="h-4.5 w-4.5" />
                </span>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-gray-900 text-sm truncate">{doc.title}</span>
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium ${doc.source === 'contract' ? 'bg-purple-50 text-purple-700' : cls}`}>
                      {doc.category}
                    </span>
                    {doc.source === 'contract' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-violet-50 text-violet-700" title="Subido desde el contrato">
                        <Link2 className="h-3 w-3" /> Contrato
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-x-3 text-xs text-gray-400 mt-0.5">
                    {doc.docDate && <span>{formatDate(doc.docDate)}</span>}
                    {doc.vendorName && <span>Proveedor: {doc.vendorName}</span>}
                    {doc.contractName && <span>Contrato: {doc.contractName}</span>}
                    {doc.budgetItemName && <span>Gasto: {doc.budgetItemName}</span>}
                    {doc.notes && <span className="truncate max-w-[280px]">{doc.notes}</span>}
                  </div>
                </div>

                {doc.amount !== null && (
                  <span className="text-sm font-medium text-gray-800 whitespace-nowrap">{formatEUR(doc.amount)}</span>
                )}

                <div className="flex gap-1 flex-shrink-0">
                  <DownloadButton filePath={doc.filePath} isContract={doc.source === 'contract'} />
                  {doc.source !== 'contract' && (
                    <button onClick={() => setEditing(doc)} title="Editar" className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50">
                      <Pencil className="h-4 w-4" />
                    </button>
                  )}
                  <button onClick={() => handleDelete(doc)} title="Eliminar" className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {(uploading || editing) && (
        <DocumentFormModal
          doc={editing}
          vendors={vendors}
          budgetItems={budgetItems}
          contracts={contracts}
          onClose={() => {
            setUploading(false)
            setEditing(null)
          }}
        />
      )}
    </div>
  )
}

function DownloadButton({ filePath, isContract }: { filePath: string; isContract?: boolean }) {
  const supabase = createSupabaseBrowserClient()
  const handle = async () => {
    try {
      const { data } = await supabase.storage
        .from(isContract ? 'contracts' : 'documents')
        .createSignedUrl(filePath, 300)
      if (data?.signedUrl) window.open(data.signedUrl, '_blank')
      else alert('No se pudo generar el enlace de descarga')
    } catch {
      alert('Error al descargar el archivo')
    }
  }
  return (
    <button onClick={handle} title="Descargar" className="p-2 text-gray-400 hover:text-sage-dark rounded-lg hover:bg-cream">
      <Download className="h-4 w-4" />
    </button>
  )
}

// ============================================
// Upload / edit modal — file uploads go browser-direct
// to the private bucket (same pattern as contracts).
// ============================================

function DocumentFormModal({
  doc,
  vendors,
  budgetItems,
  contracts,
  onClose,
}: {
  doc: BoardDocument | null
  vendors: { id: string; name: string }[]
  budgetItems: { id: string; name: string }[]
  contracts: { id: string; title: string; vendorId: string }[]
  onClose: () => void
}) {
  const [form, setForm] = useState({
    title: doc?.title || '',
    category: doc?.category || 'Factura',
    amount: doc?.amount !== null && doc?.amount !== undefined ? String(doc.amount).replace('.', ',') : '',
    docDate: doc?.docDate || '',
    vendorId: doc?.vendorId || '',
    budgetItemId: doc?.budgetItemId || '',
    contractId: doc?.contractId || '',
    notes: doc?.notes || '',
  })
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const supabase = createSupabaseBrowserClient()
  const inputCls = 'w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500'

  const vendorContracts = useMemo(
    () => contracts.filter((c) => form.vendorId && c.vendorId === form.vendorId),
    [contracts, form.vendorId]
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    try {
      let filePath = doc?.filePath
      if (file) {
        if (filePath) await supabase.storage.from('documents').remove([filePath])
        const safeName = file.name.replace(/[^\w.\-]+/g, '-')
        filePath = `docs/${uniqueFileKey(safeName)}`
        const { error } = await supabase.storage.from('documents').upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        })
        if (error) throw error
      }
      if (!filePath) throw new Error('no file')

      const data = {
        title: form.title.trim(),
        category: form.category,
        file_path: filePath,
        amount: form.amount.trim() === '' ? null : parseAmount(form.amount),
        doc_date: form.docDate || null,
        vendor_id: form.vendorId || null,
        budget_item_id: form.budgetItemId || null,
        contract_id: form.contractId || null,
        notes: form.notes.trim() || null,
      }

      if (doc) {
        await updateDocument(doc.id, data)
      } else {
        await createDocument(data)
      }
      onClose()
    } catch {
      alert('Error al guardar el documento')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md my-8">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">{doc ? 'Editar documento' : 'Subir documento'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {!doc && (
            <input
              ref={fileRef}
              type="file"
              required
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="block w-full text-xs text-gray-500 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-sage-light/40 file:text-sage-dark file:cursor-pointer"
            />
          )}
          {doc && (
            <>
              <p className="text-xs text-gray-400">Deja &quot;Archivo nuevo&quot; vacío para conservar el archivo actual.</p>
              <label className="block">
                <span className="text-xs text-gray-500">Archivo nuevo (reemplaza el actual):</span>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="mt-1 block w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-gray-100 file:text-gray-600 file:cursor-pointer"
                />
              </label>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
            <input type="text" required autoFocus value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputCls} placeholder='P.ej. "Factura catering marzo"' />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={inputCls}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha del documento</label>
              <input type="date" value={form.docDate} onChange={(e) => setForm({ ...form, docDate: e.target.value })} className={inputCls} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Importe (€)</label>
              <input type="text" inputMode="decimal" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className={inputCls} placeholder="Opcional" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor</label>
              <select
                value={form.vendorId}
                onChange={(e) =>
                  setForm((prev) => {
                    const vendorId = e.target.value
                    const contractId = vendorId && prev.contractId
                      ? contracts.some((c) => c.id === prev.contractId && c.vendorId === vendorId)
                        ? prev.contractId
                        : ''
                      : ''
                    return { ...prev, vendorId, contractId }
                  })
                }
                className={inputCls}
              >
                <option value="">—</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </div>
          </div>

          {form.vendorId && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contrato del proveedor</label>
              <select
                value={form.contractId}
                onChange={(e) => setForm((prev) => ({ ...prev, contractId: e.target.value }))}
                className={inputCls}
              >
                <option value="">Sin vínculo a contrato</option>
                {vendorContracts.map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
              {vendorContracts.length === 0 && (
                <p className="text-[11px] text-gray-400 mt-1">Este proveedor no tiene contratos todavía.</p>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Concepto de presupuesto</label>
            <select value={form.budgetItemId} onChange={(e) => setForm({ ...form, budgetItemId: e.target.value })} className={inputCls}>
              <option value="">—</option>
              {budgetItems.map((i) => (
                <option key={i.id} value={i.id}>{i.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className={`${inputCls} resize-none`} placeholder="Opcional" />
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">Cancelar</button>
            <button type="submit" disabled={busy} className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50">
              {busy ? 'Subiendo…' : doc ? 'Guardar' : 'Subir'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
