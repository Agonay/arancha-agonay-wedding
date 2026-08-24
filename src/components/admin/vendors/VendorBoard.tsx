'use client'

import { useMemo, useRef, useState } from 'react'
import {
  Plus,
  Pencil,
  Trash2,
  Handshake,
  FileSignature,
  Download,
  Star,
  AlertTriangle,
  CalendarClock,
  Check,
} from 'lucide-react'
import {
  createVendor,
  updateVendor,
  deleteVendor,
  updateVendorStatus,
  createContract,
  deleteContract,
  createPayment,
  togglePaymentPaid,
  deletePayment,
  type VendorStatus,
} from '@/features/vendors/actions'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser'
import { formatEUR } from '@/lib/money'
import { uniqueFileKey } from '@/lib/dates'

export interface BoardContract {
  id: string
  title: string
  filePath: string | null
  amount: number | null
  signedAt: string | null
  notes: string | null
}

export interface BoardPayment {
  id: string
  concept: string
  amount: number | null
  dueDate: string
  paidAt: string | null
}

export interface BoardVendor {
  id: string
  name: string
  serviceType: string
  status: VendorStatus
  contactName: string | null
  phone: string | null
  email: string | null
  website: string | null
  rating: number | null
  notes: string | null
  contracts: BoardContract[]
  payments: BoardPayment[]
}

const SERVICE_TYPES = [
  'Catering',
  'Fotografía/Vídeo',
  'Música',
  'Vestuario',
  'Peluquería/Maquillaje',
  'Flores/Decoración',
  'Papelería',
  'Transporte',
  'Pastelería',
  'Officiante',
  'Otro',
]

const STATUS_META: Record<VendorStatus, { label: string; cls: string }> = {
  candidato: { label: 'Candidato', cls: 'bg-gray-100 text-gray-600' },
  contactado: { label: 'Contactado', cls: 'bg-blue-50 text-blue-700' },
  contratado: { label: 'Contratado', cls: 'bg-emerald-50 text-emerald-700' },
  descartado: { label: 'Descartado', cls: 'bg-red-50 text-red-500' },
}

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function isOverdue(p: BoardPayment) {
  return !p.paidAt && p.dueDate < todayISO()
}

function contractedOf(v: BoardVendor) {
  return v.contracts.reduce((s, c) => s + (c.amount ?? 0), 0)
}

function pendingOf(v: BoardVendor) {
  return v.payments.filter((p) => !p.paidAt).reduce((s, p) => s + (p.amount ?? 0), 0)
}

function Stars({ rating }: { rating: number | null }) {
  if (!rating) return <span className="text-[11px] text-gray-300">Sin valorar</span>
  return (
    <span className="inline-flex items-center gap-0.5" title={`${rating}/5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={`h-3 w-3 ${i <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
      ))}
    </span>
  )
}

export default function VendorBoard({
  vendors,
  overdueCount,
  upcomingCount,
  pendingAmount,
}: {
  vendors: BoardVendor[]
  overdueCount: number
  upcomingCount: number
  pendingAmount: number
}) {
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<BoardVendor | null>(null)
  const [detail, setDetail] = useState<BoardVendor | null>(null)
  const [statusFilter, setStatusFilter] = useState<'todos' | VendorStatus>('todos')

  const handleDelete = async (v: BoardVendor) => {
    const contractNote = v.contracts.length > 0 ? ` Se eliminarán también sus ${v.contracts.length} contrato(s) y archivos.` : ''
    if (!confirm(`¿Eliminar al proveedor "${v.name}"?${contractNote}`)) return
    try {
      await deleteVendor(v.id)
    } catch {
      alert('Error al eliminar el proveedor')
    }
  }

  const handleStatus = async (id: string, status: VendorStatus) => {
    try {
      await updateVendorStatus(id, status)
    } catch {
      alert('Error al cambiar el estado')
    }
  }

  const filtered = statusFilter === 'todos' ? vendors : vendors.filter((v) => v.status === statusFilter)

  // Group by service type for quote comparison
  const groups = useMemo(() => {
    const map = new Map<string, BoardVendor[]>()
    for (const v of filtered) {
      const list = map.get(v.serviceType) || []
      list.push(v)
      map.set(v.serviceType, list)
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0], 'es'))
  }, [filtered])

  return (
    <div className="space-y-6">
      {/* Payment alerts */}
      {(overdueCount > 0 || upcomingCount > 0) && (
        <div className={`rounded-xl border p-4 flex items-start gap-3 ${overdueCount > 0 ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
          <AlertTriangle className={`h-5 w-5 mt-0.5 flex-shrink-0 ${overdueCount > 0 ? 'text-red-600' : 'text-amber-600'}`} />
          <div className="text-sm">
            {overdueCount > 0 && (
              <p className="font-medium text-red-800">{overdueCount} pago{overdueCount > 1 ? 's' : ''} vencido{overdueCount > 1 ? 's' : ''}</p>
            )}
            {upcomingCount > 0 && (
              <p className={overdueCount > 0 ? 'text-red-700 mt-0.5' : 'font-medium text-amber-800'}>
                {upcomingCount} pago{upcomingCount > 1 ? 's' : ''} en los próximos 30 días · {formatEUR(pendingAmount)} pendiente en total
              </p>
            )}
            <p className="text-xs opacity-75 mt-1">Revísalo en cada proveedor, sección &quot;Pagos&quot;.</p>
          </div>
        </div>
      )}

      {/* Header row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <Handshake className="h-5 w-5 text-sage-dark" />
            Proveedores ({filtered.length})
          </h2>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="px-3 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="todos">Todos los estados</option>
            {(Object.keys(STATUS_META) as VendorStatus[]).map((s) => (
              <option key={s} value={s}>{STATUS_META[s].label}</option>
            ))}
          </select>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors whitespace-nowrap"
        >
          <Plus className="h-4 w-4" />
          Añadir proveedor
        </button>
      </div>

      {vendors.length === 0 ? (
        <div className="bg-white rounded-xl border p-8 text-center text-gray-400">
          Aún no hay proveedores. Añade el primero para comparar opciones y llevar el control de contratos y pagos.
        </div>
      ) : (
        groups.map(([type, list]) => {
          const quoted = list.map(contractedOf).filter((n) => n > 0)
          const min = quoted.length > 0 ? Math.min(...quoted) : null
          const max = quoted.length > 0 ? Math.max(...quoted) : null
          return (
            <section key={type} className="bg-white rounded-xl border overflow-hidden">
              <header className="px-4 py-3 border-b bg-gray-50/60 flex items-baseline justify-between gap-3 flex-wrap">
                <h3 className="font-medium text-gray-900">{type}</h3>
                {min !== null && (
                  <p className="text-xs text-gray-500">
                    Comparativa: {formatEUR(min)}{max !== null && max !== min ? ` – ${formatEUR(max)}` : ''} entre {quoted.length} con presupuesto
                  </p>
                )}
              </header>
              <ul className="divide-y">
                {list.map((v) => {
                  const meta = STATUS_META[v.status]
                  const pending = pendingOf(v)
                  return (
                    <li key={v.id} className="px-4 py-3 flex flex-col lg:flex-row lg:items-center gap-2 lg:gap-4 group">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <button onClick={() => setDetail(v)} className="font-medium text-gray-900 text-sm hover:text-sage-dark hover:underline truncate">
                            {v.name}
                          </button>
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium ${meta.cls}`}>
                            {meta.label}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-x-3 text-xs text-gray-400 mt-0.5">
                          {v.contactName && <span>{v.contactName}</span>}
                          {v.phone && <span>{v.phone}</span>}
                          {v.email && <span>{v.email}</span>}
                          {v.website && <span className="truncate max-w-[180px]">{v.website}</span>}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                        <Stars rating={v.rating} />
                        <span className="inline-flex flex-col leading-tight min-w-[72px]">
                          <span className="text-[10px] uppercase tracking-wide text-gray-400">Contratado</span>
                          <span className="text-sm text-gray-800">{formatEUR(contractedOf(v))}</span>
                        </span>
                        {pending > 0 && (
                          <span className="inline-flex flex-col leading-tight min-w-[72px]">
                            <span className="text-[10px] uppercase tracking-wide text-gray-400">Pendiente</span>
                            <span className="text-sm text-amber-600 font-medium">{formatEUR(pending)}</span>
                          </span>
                        )}
                      </div>

                      <div className="flex gap-1 flex-shrink-0 self-end lg:self-center">
                        <select
                          value=""
                          onChange={(e) => e.target.value && handleStatus(v.id, e.target.value as VendorStatus)}
                          title="Cambiar estado"
                          className="w-9 h-8 text-xs border rounded-lg text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                        >
                          <option value="">⋯</option>
                          {(Object.keys(STATUS_META) as VendorStatus[]).map((s) => (
                            <option key={s} value={s}>{STATUS_META[s].label}</option>
                          ))}
                        </select>
                        <button onClick={() => setEditing(v)} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(v)} className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </section>
          )
        })
      )}

      {(creating || editing) && (
        <VendorFormModal
          vendor={editing}
          onClose={() => {
            setCreating(false)
            setEditing(null)
          }}
        />
      )}

      {detail && <DetailModal vendor={vendors.find((v) => v.id === detail.id) || detail} onClose={() => setDetail(null)} />}
    </div>
  )
}

// ============================================
// Vendor create/edit modal
// ============================================

function VendorFormModal({ vendor, onClose }: { vendor: BoardVendor | null; onClose: () => void }) {
  const [form, setForm] = useState({
    name: vendor?.name || '',
    serviceType: vendor?.serviceType || 'Catering',
    customType: '',
    status: (vendor?.status || 'candidato') as VendorStatus,
    contactName: vendor?.contactName || '',
    phone: vendor?.phone || '',
    email: vendor?.email || '',
    website: vendor?.website || '',
    rating: vendor?.rating ? String(vendor.rating) : '',
    notes: vendor?.notes || '',
  })
  const [loading, setLoading] = useState(false)

  const inputCls = 'w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const serviceType = form.customType.trim() || form.serviceType
    const data = {
      name: form.name.trim(),
      service_type: serviceType,
      status: form.status,
      contact_name: form.contactName.trim() || null,
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
      website: form.website.trim() || null,
      rating: form.rating === '' ? null : parseInt(form.rating, 10),
      notes: form.notes.trim() || null,
    }
    try {
      if (vendor) {
        await updateVendor(vendor.id, data)
      } else {
        await createVendor(data)
      }
      onClose()
    } catch {
      alert('Error al guardar el proveedor')
    } finally {
      setLoading(false)
    }
  }

  const knownType = SERVICE_TYPES.includes(form.serviceType)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md my-8">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">{vendor ? 'Editar proveedor' : 'Nuevo proveedor'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
            <input type="text" required autoFocus value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} placeholder="P.ej. Finca La Losilla, FotoJuan…" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de servicio</label>
              <select
                value={knownType ? form.serviceType : '__custom__'}
                onChange={(e) =>
                  setForm({ ...form, serviceType: e.target.value === '__custom__' ? '' : e.target.value })
                }
                className={inputCls}
              >
                {SERVICE_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
                <option value="__custom__">Otro…</option>
              </select>
              {!knownType && (
                <input
                  type="text"
                  required
                  value={form.customType}
                  onChange={(e) => setForm({ ...form, customType: e.target.value })}
                  className={`${inputCls} mt-2`}
                  placeholder="Escribe el tipo de servicio"
                  autoFocus
                />
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as VendorStatus })} className={inputCls}>
                {(Object.keys(STATUS_META) as VendorStatus[]).map((s) => (
                  <option key={s} value={s}>{STATUS_META[s].label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Persona de contacto</label>
              <input type="text" value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} className={inputCls} placeholder="Opcional" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
              <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputCls} placeholder="Opcional" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputCls} placeholder="Opcional" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Web / Instagram</label>
              <input type="text" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} className={inputCls} placeholder="Opcional" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Valoración</label>
            <select value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })} className={inputCls}>
              <option value="">Sin valorar</option>
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>{'★'.repeat(n)}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className={`${inputCls} resize-none`} placeholder="Impresiones, condiciones, alternativas…" />
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

// ============================================
// Detail modal: contracts + payments
// ============================================

function DetailModal({ vendor, onClose }: { vendor: BoardVendor; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg my-8">
        <div className="flex items-start justify-between p-4 border-b">
          <div>
            <h2 className="text-lg font-semibold">{vendor.name}</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {vendor.serviceType} · {STATUS_META[vendor.status].label}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">✕</button>
        </div>

        <div className="p-4 space-y-6 max-h-[70vh] overflow-y-auto">
          <ContractsSection vendorId={vendor.id} contracts={vendor.contracts} />
          <PaymentsSection vendorId={vendor.id} payments={vendor.payments} />
        </div>
      </div>
    </div>
  )
}

function ContractsSection({ vendorId, contracts }: { vendorId: string; contracts: BoardContract[] }) {
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ title: '', amount: '', signedAt: '', notes: '' })
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const supabase = createSupabaseBrowserClient()

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    try {
      let filePath: string | null = null
      if (file) {
        const safeName = file.name.replace(/[^\w.\-]+/g, '-')
        filePath = `${vendorId}/${uniqueFileKey(safeName)}`
        const { error } = await supabase.storage.from('contracts').upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        })
        if (error) throw error
      }
      await createContract({
        vendor_id: vendorId,
        title: form.title.trim(),
        file_path: filePath,
        amount: form.amount.trim() === '' ? null : parseFloat(form.amount.replace(',', '.')),
        signed_at: form.signedAt || null,
        notes: form.notes.trim() || null,
      })
      setForm({ title: '', amount: '', signedAt: '', notes: '' })
      setFile(null)
      if (fileRef.current) fileRef.current.value = ''
      setAdding(false)
    } catch {
      alert('Error al guardar el contrato')
    } finally {
      setBusy(false)
    }
  }

  const handleDownload = async (filePath: string) => {
    try {
      const { data } = await supabase.storage.from('contracts').createSignedUrl(filePath, 300)
      if (data?.signedUrl) window.open(data.signedUrl, '_blank')
      else alert('No se pudo generar el enlace de descarga')
    } catch {
      alert('Error al descargar el archivo')
    }
  }

  const handleDelete = async (c: BoardContract) => {
    if (!confirm(`¿Eliminar el contrato "${c.title}"?${c.filePath ? ' El archivo también se borrará.' : ''}`)) return
    try {
      await deleteContract(c.id)
    } catch {
      alert('Error al eliminar el contrato')
    }
  }

  const inputCls = 'w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500'

  return (
    <section>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
          <FileSignature className="h-4 w-4 text-sage-dark" /> Contratos ({contracts.length})
        </h3>
        <button onClick={() => setAdding(!adding)} className="text-xs text-emerald-700 hover:underline inline-flex items-center gap-1">
          <Plus className="h-3 w-3" /> Añadir
        </button>
      </div>

      {contracts.length === 0 && !adding && (
        <p className="text-xs text-gray-400 py-1">Sin contratos todavía.</p>
      )}

      <ul className="space-y-2">
        {contracts.map((c) => (
          <li key={c.id} className="border rounded-lg px-3 py-2 flex items-start justify-between gap-2 group">
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{c.title}</p>
              <div className="flex flex-wrap gap-x-3 text-xs text-gray-400 mt-0.5">
                {c.amount !== null && <span>{formatEUR(c.amount)}</span>}
                {c.signedAt && <span>Firmado {c.signedAt.split('-').reverse().join('/')}</span>}
                {c.notes && <span className="truncate max-w-[240px]">{c.notes}</span>}
              </div>
            </div>
            <div className="flex gap-1 flex-shrink-0">
              {c.filePath && (
                <button onClick={() => handleDownload(c.filePath!)} title="Descargar archivo" className="p-2 text-gray-400 hover:text-sage-dark rounded-lg hover:bg-cream">
                  <Download className="h-4 w-4" />
                </button>
              )}
              <button onClick={() => handleDelete(c)} title="Eliminar" className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </li>
        ))}
      </ul>

      {adding && (
        <form onSubmit={handleAdd} className="mt-3 border rounded-lg p-3 space-y-3 bg-gray-50/60">
          <input type="text" required autoFocus value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputCls} placeholder="Título del contrato (p.ej. Contrato banquete)" />
          <div className="grid grid-cols-2 gap-3">
            <input type="text" inputMode="decimal" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className={inputCls} placeholder="Importe € (opcional)" />
            <label className="text-xs text-gray-500 flex items-center gap-2">
              Firma:
              <input type="date" value={form.signedAt} onChange={(e) => setForm({ ...form, signedAt: e.target.value })} className="flex-1 px-2 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </label>
          </div>
          <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={(e) => setFile(e.target.files?.[0] || null)} className="block w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-sage-light/40 file:text-sage-dark file:cursor-pointer" />
          <input type="text" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={inputCls} placeholder="Notas (opcional)" />
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setAdding(false)} className="px-3 py-1.5 text-xs border rounded-lg hover:bg-white">Cancelar</button>
            <button type="submit" disabled={busy} className="px-3 py-1.5 text-xs bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50">
              {busy ? 'Subiendo…' : 'Guardar contrato'}
            </button>
          </div>
        </form>
      )}
    </section>
  )
}

function PaymentsSection({ vendorId, payments }: { vendorId: string; payments: BoardPayment[] }) {
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ concept: '', amount: '', dueDate: '' })
  const [busy, setBusy] = useState(false)

  const sorted = [...payments].sort((a, b) => a.dueDate.localeCompare(b.dueDate))
  const inputCls = 'w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500'

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    try {
      await createPayment({
        vendor_id: vendorId,
        concept: form.concept.trim(),
        amount: form.amount.trim() === '' ? null : parseFloat(form.amount.replace(',', '.')),
        due_date: form.dueDate,
      })
      setForm({ concept: '', amount: '', dueDate: '' })
      setAdding(false)
    } catch {
      alert('Error al añadir el pago')
    } finally {
      setBusy(false)
    }
  }

  const handleToggle = async (p: BoardPayment) => {
    try {
      await togglePaymentPaid(p.id, p.paidAt ? null : todayISO())
    } catch {
      alert('Error al actualizar el pago')
    }
  }

  const handleDelete = async (p: BoardPayment) => {
    if (!confirm(`¿Eliminar el pago "${p.concept}"?`)) return
    try {
      await deletePayment(p.id)
    } catch {
      alert('Error al eliminar el pago')
    }
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-sage-dark" /> Pagos ({sorted.length})
        </h3>
        <button onClick={() => setAdding(!adding)} className="text-xs text-emerald-700 hover:underline inline-flex items-center gap-1">
          <Plus className="h-3 w-3" /> Añadir
        </button>
      </div>

      {sorted.length === 0 && !adding && (
        <p className="text-xs text-gray-400 py-1">Sin pagos programados.</p>
      )}

      <ul className="space-y-2">
        {sorted.map((p) => {
          const overdue = isOverdue(p)
          return (
            <li key={p.id} className="border rounded-lg px-3 py-2 flex items-center justify-between gap-2">
              <div className="min-w-0 flex items-start gap-2">
                <button
                  onClick={() => handleToggle(p)}
                  title={p.paidAt ? 'Marcar como pendiente' : 'Marcar como pagado'}
                  className={`mt-0.5 w-5 h-5 rounded-full border flex-shrink-0 flex items-center justify-center transition-colors ${
                    p.paidAt ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-300 hover:border-emerald-500'
                  }`}
                >
                  {p.paidAt && <Check className="h-3 w-3" />}
                </button>
                <div className="min-w-0">
                  <p className={`text-sm truncate ${p.paidAt ? 'text-gray-400 line-through' : 'font-medium text-gray-900'}`}>{p.concept}</p>
                  <div className="flex gap-x-3 text-xs mt-0.5">
                    {p.amount !== null && <span className="text-gray-400">{formatEUR(p.amount)}</span>}
                    <span className={overdue ? 'text-red-600 font-medium' : p.paidAt ? 'text-gray-400' : 'text-amber-600'}>
                      {p.paidAt ? `Pagado ${p.paidAt.split('-').reverse().join('/')}` : `Vence ${p.dueDate.split('-').reverse().join('/')}`}
                      {overdue ? ' · ¡vencido!' : ''}
                    </span>
                  </div>
                </div>
              </div>
              <button onClick={() => handleDelete(p)} title="Eliminar" className="p-2 text-gray-300 hover:text-red-600 rounded-lg hover:bg-red-50">
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          )
        })}
      </ul>

      {adding && (
        <form onSubmit={handleAdd} className="mt-3 border rounded-lg p-3 space-y-3 bg-gray-50/60">
          <input type="text" required autoFocus value={form.concept} onChange={(e) => setForm({ ...form, concept: e.target.value })} className={inputCls} placeholder='Concepto (p.ej. Seña 30%, "Pago final")' />
          <div className="grid grid-cols-2 gap-3">
            <input type="text" inputMode="decimal" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className={inputCls} placeholder="Importe € (opcional)" />
            <input type="date" required value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className={inputCls} />
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setAdding(false)} className="px-3 py-1.5 text-xs border rounded-lg hover:bg-white">Cancelar</button>
            <button type="submit" disabled={busy} className="px-3 py-1.5 text-xs bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50">
              {busy ? 'Guardando…' : 'Añadir pago'}
            </button>
          </div>
        </form>
      )}
    </section>
  )
}
