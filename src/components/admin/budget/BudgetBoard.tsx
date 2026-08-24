'use client'

import { useState } from 'react'
import {
  Plus,
  Pencil,
  Trash2,
  Wallet,
  Tag,
  AlertTriangle,
} from 'lucide-react'
import {
  createCategory,
  updateCategory,
  deleteCategory,
  createItem,
  updateItem,
  deleteItem,
  type ItemInput,
} from '@/features/budget/actions'
import { formatEUR, parseAmount } from '@/lib/money'
import { computeItemTotal, parseQuantity } from '@/lib/budget'

export interface BoardCategory {
  id: string
  name: string
  sort_order: number
}

export interface BoardItem {
  id: string
  category_id: string | null
  name: string
  vendor: string | null
  estimated: number
  actual: number | null
  paid: number
  dueDate: string | null
  notes: string | null
  pending: number
  pricingMode: 'total' | 'per_guest'
  unitPrice: number | null
  guestCount: number | null
  ivaRate: number | null
  unitsWithIva: number | null
}

const NO_CATEGORY = '__none__'

function isOverdue(item: BoardItem): boolean {
  if (!item.dueDate || item.pending <= 0) return false
  const today = new Date().toISOString().slice(0, 10)
  return item.dueDate < today
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return `${d}/${m}/${y}`
}

export default function BudgetBoard({
  categories,
  items,
  confirmedGuests,
}: {
  categories: BoardCategory[]
  items: BoardItem[]
  confirmedGuests: number
}) {
  const [filter, setFilter] = useState<string>('all')
  const [editingCategory, setEditingCategory] = useState<BoardCategory | null>(null)
  const [creatingCategory, setCreatingCategory] = useState(false)
  const [editingItem, setEditingItem] = useState<BoardItem | null>(null)
  const [creatingItem, setCreatingItem] = useState(false)

  const filtered = filter === 'all' ? items : filter === NO_CATEGORY ? items.filter((i) => !i.category_id) : items.filter((i) => i.category_id === filter)

  const visibleCategories =
    filter === 'all'
      ? categories
      : filter === NO_CATEGORY
        ? []
        : categories.filter((c) => c.id === filter)

  const showNoCategory = filtered.some((i) => !i.category_id)

  const handleDeleteCategory = async (c: BoardCategory) => {
    const count = items.filter((i) => i.category_id === c.id).length
    if (!confirm(`¿Eliminar la categoría "${c.name}"?${count > 0 ? ` Sus ${count} concepto(s) quedarán sin categoría.` : ''}`)) return
    try {
      await deleteCategory(c.id)
    } catch {
      alert('Error al eliminar la categoría')
    }
  }

  const handleDeleteItem = async (item: BoardItem) => {
    if (!confirm(`¿Eliminar el concepto "${item.name}"?`)) return
    try {
      await deleteItem(item.id)
    } catch {
      alert('Error al eliminar el concepto')
    }
  }

  return (
    <div className="space-y-6">
      {/* Category manager */}
      <div className="bg-white rounded-xl border p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Tag className="h-4 w-4 text-warm-gray mr-1" />
          {categories.map((c) => (
            <span key={c.id} className="group inline-flex items-center gap-1 pl-3 pr-1 py-1 rounded-full bg-sage-light/40 text-sage-dark text-sm">
              {c.name}
              <button onClick={() => setEditingCategory(c)} title="Editar" className="p-1 rounded-full hover:bg-white/70">
                <Pencil className="h-3 w-3" />
              </button>
              <button onClick={() => handleDeleteCategory(c)} title="Eliminar" className="p-1 rounded-full hover:bg-red-100 hover:text-red-600">
                <Trash2 className="h-3 w-3" />
              </button>
            </span>
          ))}
          <button
            onClick={() => setCreatingCategory(true)}
            className="inline-flex items-center gap-1 px-3 py-1 rounded-full border border-dashed text-sm text-gray-500 hover:border-sage hover:text-sage-dark transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Categoría
          </button>
          {categories.length === 0 && (
            <span className="text-xs text-gray-400">Crea categorías (p.ej. Catering, Fotografía, Vestuario…) para organizar los gastos.</span>
          )}
        </div>
      </div>

      {/* Items header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-lg font-medium text-gray-900 flex items-center gap-2">
          <Wallet className="h-5 w-5 text-sage-dark" />
          Conceptos ({filtered.length})
        </h2>
        <div className="flex gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">Todas las categorías</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
            {items.some((i) => !i.category_id) && <option value={NO_CATEGORY}>Sin categoría</option>}
          </select>
          <button
            onClick={() => setCreatingItem(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors whitespace-nowrap"
          >
            <Plus className="h-4 w-4" />
            Añadir concepto
          </button>
        </div>
      </div>

      {/* Grouped items */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border p-8 text-center text-gray-400">
          {items.length === 0
            ? 'Aún no hay conceptos. Añade el primero para empezar a controlar el presupuesto.'
            : 'No hay conceptos en esta categoría.'}
        </div>
      ) : (
        <>
          {visibleCategories.map((c) => (
            <CategorySection key={c.id} name={c.name} items={filtered.filter((i) => i.category_id === c.id)} onEdit={setEditingItem} onDelete={handleDeleteItem} />
          ))}
          {showNoCategory && (
            <CategorySection key={NO_CATEGORY} name="Sin categoría" items={filtered.filter((i) => !i.category_id)} onEdit={setEditingItem} onDelete={handleDeleteItem} />
          )}
        </>
      )}

      {(creatingCategory || editingCategory) && (
        <CategoryFormModal
          category={editingCategory}
          onClose={() => {
            setCreatingCategory(false)
            setEditingCategory(null)
          }}
        />
      )}

      {(creatingItem || editingItem) && (
        <ItemFormModal
          item={editingItem}
          categories={categories}
          confirmedGuests={confirmedGuests}
          onClose={() => {
            setCreatingItem(false)
            setEditingItem(null)
          }}
        />
      )}
    </div>
  )
}

function CategorySection({
  name,
  items,
  onEdit,
  onDelete,
}: {
  name: string
  items: BoardItem[]
  onEdit: (i: BoardItem) => void
  onDelete: (i: BoardItem) => void
}) {
  const estimated = items.reduce((n, i) => n + i.estimated, 0)
  const paid = items.reduce((n, i) => n + i.paid, 0)
  const actual = items.reduce((n, i) => n + (i.actual ?? 0), 0)
  const overBudget = actual > estimated
  // Bar: paid portion relative to estimated commitment
  const pct = estimated > 0 ? Math.min(100, Math.round(((actual || paid) / estimated) * 100)) : overBudget ? 100 : 0

  return (
    <section className="bg-white rounded-xl border overflow-hidden">
      <header className="px-4 py-3 border-b bg-gray-50/60 space-y-2">
        <div className="flex items-baseline justify-between gap-3 flex-wrap">
          <h3 className="font-medium text-gray-900">{name}</h3>
          <p className="text-xs text-gray-500">
            Pagado <span className="font-medium text-emerald-700">{formatEUR(paid)}</span>
            {' · '}Estimado {formatEUR(estimated)}
            {overBudget && (
              <span className="ml-2 inline-flex items-center gap-1 text-red-600 font-medium">
                <AlertTriangle className="h-3 w-3" /> Excedido {formatEUR(actual - estimated)}
              </span>
            )}
          </p>
        </div>
        <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${overBudget ? 'bg-red-500' : pct >= 80 ? 'bg-amber-400' : 'bg-emerald-500'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </header>

      <ul className="divide-y">
        {items.map((item) => (
          <li key={item.id} className="px-4 py-3 flex flex-col lg:flex-row lg:items-center gap-2 lg:gap-4 group">
            <div className="flex-1 min-w-0">
              <span className="font-medium text-gray-900 text-sm">{item.name}</span>
              {item.vendor && <span className="text-xs text-gray-400"> · {item.vendor}</span>}
              {item.pricingMode === 'per_guest' && item.unitPrice !== null && item.guestCount !== null && (
                <span className="ml-2 inline-flex px-2 py-0.5 rounded text-[11px] font-medium bg-sage-light/40 text-sage-dark align-middle whitespace-nowrap">
                  {formatEUR(item.unitPrice)}/comensal × {item.guestCount}
                  {item.ivaRate !== null && item.unitsWithIva !== null && item.unitsWithIva > 0 && (
                    <> +IVA {item.ivaRate}%</>
                  )}
                </span>
              )}
              {item.notes && <p className="text-xs text-gray-400 mt-0.5 truncate">{item.notes}</p>}
            </div>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
              <Amount label="Est." value={item.estimated} />
              <Amount label="Real" value={item.actual} muted={item.actual === null} />
              <Amount label="Pagado" value={item.paid} accent={item.pending <= 0 && item.paid > 0} />
              <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium ${
                isOverdue(item)
                  ? 'bg-red-50 text-red-600'
                  : item.pending <= 0
                    ? 'bg-emerald-50 text-emerald-600'
                    : 'bg-amber-50 text-amber-600'
              }`}>
                {item.pending <= 0 ? 'Pagado' : `Pendiente ${formatEUR(item.pending)}`}
              </span>
              {item.dueDate && (
                <span className={`text-xs ${isOverdue(item) ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                  Vence {formatDate(item.dueDate)}
                </span>
              )}
            </div>

            <div className="flex gap-1 flex-shrink-0 self-end lg:self-center">
              <button onClick={() => onEdit(item)} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50">
                <Pencil className="h-4 w-4" />
              </button>
              <button onClick={() => onDelete(item)} className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

function Amount({ label, value, muted = false, accent = false }: { label: string; value: number | null; muted?: boolean; accent?: boolean }) {
  return (
    <span className="inline-flex flex-col leading-tight min-w-[72px]">
      <span className="text-[10px] uppercase tracking-wide text-gray-400">{label}</span>
      <span className={`${accent ? 'text-emerald-700 font-medium' : muted ? 'text-gray-300' : 'text-gray-800'}`}>
        {value === null ? '—' : formatEUR(value)}
      </span>
    </span>
  )
}

function CategoryFormModal({ category, onClose }: { category: BoardCategory | null; onClose: () => void }) {
  const [name, setName] = useState(category?.name || '')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (category) {
        await updateCategory(category.id, { name: name.trim() })
      } else {
        await createCategory({ name: name.trim() })
      }
      onClose()
    } catch {
      alert('Error al guardar la categoría (¿ya existe una con ese nombre?)')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">{category ? 'Editar categoría' : 'Nueva categoría'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="P.ej. Catering, Fotografía, Música…"
            />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">Cancelar</button>
            <button type="submit" disabled={loading} className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50">
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ItemFormModal({
  item,
  categories,
  confirmedGuests,
  onClose,
}: {
  item: BoardItem | null
  categories: BoardCategory[]
  confirmedGuests: number
  onClose: () => void
}) {
  const isPerGuest = item?.pricingMode === 'per_guest'
  const [mode, setMode] = useState<'total' | 'per_guest'>(isPerGuest ? 'per_guest' : 'total')
  const [form, setForm] = useState({
    name: item?.name || '',
    categoryId: item?.category_id || '',
    vendor: item?.vendor || '',
    estimated: item && item.pricingMode === 'total' ? String(item.estimated).replace('.', ',') : '',
    actual: item && item.pricingMode === 'total' && item.actual !== null ? String(item.actual).replace('.', ',') : '',
    paid: item ? String(item.paid).replace('.', ',') : '0',
    dueDate: item?.dueDate || '',
    notes: item?.notes || '',
    unitPrice: item?.unitPrice !== null && item?.unitPrice !== undefined ? String(item.unitPrice).replace('.', ',') : '',
    quantityRaw:
      item?.guestCount !== null && item?.guestCount !== undefined
        ? String(item.guestCount).replace('.', ',')
        : '',
    ivaRate: item?.ivaRate !== null && item?.ivaRate !== undefined ? String(item.ivaRate).replace('.', ',') : '10',
    unitsWithIva: item?.unitsWithIva !== null && item?.unitsWithIva !== undefined ? String(item.unitsWithIva) : '',
  })
  const [loading, setLoading] = useState(false)

  // Live preview of the per-guest formula
  const preview =
    mode === 'per_guest'
      ? computeItemTotal({
          pricing_mode: 'per_guest',
          unit_price: parseAmount(form.unitPrice),
          guest_count: parseQuantity(form.quantityRaw || '', confirmedGuests),
          iva_rate: form.ivaRate.trim() === '' ? null : parseAmount(form.ivaRate),
          units_with_iva: form.unitsWithIva.trim() === '' ? null : parseInt(form.unitsWithIva, 10) || 0,
        })
      : null

  const resolvedCount = parseQuantity(form.quantityRaw || '', confirmedGuests)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    let data: ItemInput
    if (mode === 'per_guest') {
      data = {
        name: form.name.trim(),
        category_id: form.categoryId || null,
        vendor: form.vendor.trim() || null,
        estimated_amount: 0,
        paid_amount: parseAmount(form.paid),
        due_date: form.dueDate || null,
        notes: form.notes.trim() || null,
        pricing_mode: 'per_guest',
        unit_price: parseAmount(form.unitPrice),
        guest_count: resolvedCount,
        iva_rate: form.ivaRate.trim() === '' ? null : parseAmount(form.ivaRate),
        units_with_iva:
          form.unitsWithIva.trim() === '' ? null : Math.max(0, Math.min(resolvedCount ?? 0, parseInt(form.unitsWithIva, 10) || 0)),
      }
    } else {
      data = {
        name: form.name.trim(),
        category_id: form.categoryId || null,
        vendor: form.vendor.trim() || null,
        estimated_amount: parseAmount(form.estimated),
        actual_amount: form.actual.trim() === '' ? null : parseAmount(form.actual),
        paid_amount: parseAmount(form.paid),
        due_date: form.dueDate || null,
        notes: form.notes.trim() || null,
        pricing_mode: 'total',
      }
    }
    try {
      if (item) {
        await updateItem(item.id, data)
      } else {
        await createItem(data)
      }
      onClose()
    } catch {
      alert('Error al guardar el concepto')
    } finally {
      setLoading(false)
    }
  }

  const inputCls = 'w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500'

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md my-8">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">{item ? 'Editar concepto' : 'Nuevo concepto'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Concepto</label>
            <input
              type="text"
              required
              autoFocus
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={inputCls}
              placeholder="P.ej. Menú, Barra libre, Fotografía…"
            />
          </div>

          {/* Pricing mode — existing per-guest items stay per-guest (amounts are derived) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Modalidad de precio</label>
            <div className="grid grid-cols-2 gap-2">
              {(['total', 'per_guest'] as const).map((m) => {
                const lockedTotal = m === 'total' && item?.pricingMode === 'per_guest'
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => !lockedTotal && setMode(m)}
                    disabled={lockedTotal}
                    title={lockedTotal ? 'Los conceptos por comensal se calculan automáticamente' : undefined}
                    className={`px-3 py-2 rounded-lg text-sm border transition-colors ${
                      mode === m
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-700 font-medium'
                        : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    } ${lockedTotal ? 'opacity-40 cursor-not-allowed' : ''}`}
                  >
                    {m === 'total' ? 'Precio total' : 'Por comensal'}
                  </button>
                )
              })}
            </div>
            {item?.pricingMode === 'per_guest' && (
              <p className="text-[11px] text-gray-400 mt-1">
                Este concepto se recalcula solo al cambiar precio, cantidad o IVA.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
              <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className={inputCls}>
                <option value="">Sin categoría</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor</label>
              <input
                type="text"
                value={form.vendor}
                onChange={(e) => setForm({ ...form, vendor: e.target.value })}
                className={inputCls}
                placeholder="Opcional"
              />
            </div>
          </div>

          {mode === 'per_guest' ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Precio por comensal (€)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    required
                    value={form.unitPrice}
                    onChange={(e) => setForm({ ...form, unitPrice: e.target.value })}
                    className={inputCls}
                    placeholder="95"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad (nº o %)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    required
                    value={form.quantityRaw}
                    onChange={(e) => setForm({ ...form, quantityRaw: e.target.value })}
                    className={inputCls}
                    placeholder='120 o "50%"'
                  />
                  <p className="text-[11px] text-gray-400 mt-1">
                    Confirmados ahora: {confirmedGuests} comensales
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">IVA (%)</label>
                  <select
                    value={form.ivaRate}
                    onChange={(e) => setForm({ ...form, ivaRate: e.target.value })}
                    className={inputCls}
                  >
                    <option value="">Sin IVA</option>
                    <option value="10">10 %</option>
                    <option value="21">21 %</option>
                    <option value="4">4 %</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unidades con IVA</label>
                  <input
                    type="number"
                    min="0"
                    value={form.unitsWithIva}
                    onChange={(e) => setForm({ ...form, unitsWithIva: e.target.value })}
                    className={inputCls}
                    placeholder={resolvedCount !== null ? String(resolvedCount) : '0'}
                    disabled={form.ivaRate.trim() === ''}
                  />
                  {resolvedCount !== null && form.unitsWithIva.trim() !== '' && (
                    <p className="text-[11px] text-gray-400 mt-1">
                      {Math.max(0, resolvedCount - (parseInt(form.unitsWithIva, 10) || 0))} sin IVA
                    </p>
                  )}
                </div>
              </div>

              {preview && (
                <div className="rounded-lg bg-sage-light/30 px-3 py-2 text-xs text-sage-dark">
                  <span className="font-medium">Cálculo automático: </span>
                  {formatEUR(preview.baseSinIva)} base
                  {preview.ivaAmount > 0 && <> + {formatEUR(preview.ivaAmount)} IVA</>}
                  {' = '}
                  <span className="font-semibold">{formatEUR(preview.total)}</span>
                  <span className="block text-[11px] opacity-75 mt-0.5">
                    Estimado y real se calculan solos; solo introduces lo pagado.
                  </span>
                </div>
              )}
            </>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estimado (€)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  required
                  value={form.estimated}
                  onChange={(e) => setForm({ ...form, estimated: e.target.value })}
                  className={inputCls}
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Real (€)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={form.actual}
                  onChange={(e) => setForm({ ...form, actual: e.target.value })}
                  className={inputCls}
                  placeholder="—"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pagado (€)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={form.paid}
                  onChange={(e) => setForm({ ...form, paid: e.target.value })}
                  className={inputCls}
                />
              </div>
            </div>
          )}

          {mode === 'per_guest' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pagado (€)</label>
              <input
                type="text"
                inputMode="decimal"
                value={form.paid}
                onChange={(e) => setForm({ ...form, paid: e.target.value })}
                className={inputCls}
              />
              <p className="text-xs text-gray-400 mt-1">Usa &quot;Pagado&quot; para señales y pagos parciales.</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha límite de pago</label>
            <input
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              className={inputCls}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              className={`${inputCls} resize-none`}
              placeholder="P.ej. incluye IVA, seña reembolsable…"
            />
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">Cancelar</button>
            <button type="submit" disabled={loading} className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50">
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
