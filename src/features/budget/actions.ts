'use server'

import { createSupabaseServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { computeItemTotal, type PricingMode } from '@/lib/budget'

function revalidateBudget() {
  revalidatePath('/admin/budget')
  revalidatePath('/admin/dashboard')
}

export type CategoryInput = {
  name: string
  sort_order?: number
}

export async function createCategory(data: CategoryInput) {
  const supabase = createSupabaseServerClient()

  const { data: wedding, error: weddingError } = await supabase
    .from('weddings')
    .select('id')
    .single()
  if (weddingError || !wedding) throw new Error('No wedding record found.')

  const { data: category, error } = await supabase
    .from('budget_categories')
    .insert({ ...data, wedding_id: wedding.id })
    .select()
    .single()

  if (error) throw error
  revalidateBudget()
  return category
}

export async function updateCategory(id: string, data: Partial<CategoryInput>) {
  const supabase = createSupabaseServerClient()
  const { data: category, error } = await supabase
    .from('budget_categories')
    .update(data)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  revalidateBudget()
  return category
}

export async function deleteCategory(id: string) {
  const supabase = createSupabaseServerClient()
  // Items keep existing (category_id set to NULL by FK ON DELETE SET NULL)
  const { error } = await supabase.from('budget_categories').delete().eq('id', id)
  if (error) throw error
  revalidateBudget()
}

export type ItemInput = {
  category_id?: string | null
  name: string
  vendor?: string | null
  estimated_amount: number
  actual_amount?: number | null
  paid_amount?: number
  due_date?: string | null
  notes?: string | null
  pricing_mode?: PricingMode
  unit_price?: number | null
  guest_count?: number | null
  iva_rate?: number | null
  units_with_iva?: number | null
}

function sanitizeItem(data: ItemInput) {
  const mode: PricingMode = data.pricing_mode === 'per_guest' ? 'per_guest' : 'total'
  const round2 = (n: number) => Math.round(n * 100) / 100

  // Per-guest items derive their amounts from the pricing formula.
  const computed = computeItemTotal({
    pricing_mode: mode,
    unit_price: data.unit_price ?? null,
    guest_count: data.guest_count ?? null,
    iva_rate: data.iva_rate ?? null,
    units_with_iva: data.units_with_iva ?? null,
  })

  return {
    category_id: data.category_id || null,
    name: data.name,
    vendor: data.vendor?.trim() || null,
    estimated_amount:
      computed !== null
        ? computed.total
        : Math.max(0, round2(data.estimated_amount || 0)),
    actual_amount:
      computed !== null
        ? computed.total
        : data.actual_amount === null || data.actual_amount === undefined
          ? null
          : Math.max(0, round2(data.actual_amount)),
    paid_amount: Math.max(0, round2(data.paid_amount || 0)),
    due_date: data.due_date || null,
    notes: data.notes?.trim() || null,
    pricing_mode: mode,
    unit_price:
      mode === 'per_guest'
        ? Math.max(0, round2(data.unit_price ?? 0))
        : null,
    guest_count:
      mode === 'per_guest'
        ? Math.max(0, round2(data.guest_count ?? 0))
        : null,
    iva_rate:
      mode === 'per_guest' && data.iva_rate !== null && data.iva_rate !== undefined
        ? Math.min(100, Math.max(0, round2(data.iva_rate)))
        : null,
    units_with_iva:
      mode === 'per_guest' && data.units_with_iva !== null && data.units_with_iva !== undefined
        ? Math.max(0, Math.round(data.units_with_iva))
        : null,
  }
}

export async function createItem(data: ItemInput) {
  const supabase = createSupabaseServerClient()

  const { data: wedding, error: weddingError } = await supabase
    .from('weddings')
    .select('id')
    .single()
  if (weddingError || !wedding) throw new Error('No wedding record found.')

  const { data: item, error } = await supabase
    .from('budget_items')
    .insert({ ...sanitizeItem(data), wedding_id: wedding.id })
    .select()
    .single()

  if (error) throw error
  revalidateBudget()
  return item
}

export async function updateItem(id: string, data: ItemInput) {
  const supabase = createSupabaseServerClient()
  const { data: item, error } = await supabase
    .from('budget_items')
    .update(sanitizeItem(data))
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  revalidateBudget()
  return item
}

export async function deleteItem(id: string) {
  const supabase = createSupabaseServerClient()
  const { error } = await supabase.from('budget_items').delete().eq('id', id)
  if (error) throw error
  revalidateBudget()
}
