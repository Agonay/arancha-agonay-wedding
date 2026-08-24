'use server'

import { createSupabaseServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

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
}

function sanitizeItem(data: ItemInput) {
  return {
    category_id: data.category_id || null,
    name: data.name,
    vendor: data.vendor?.trim() || null,
    estimated_amount: Math.max(0, Math.round((data.estimated_amount || 0) * 100) / 100),
    actual_amount:
      data.actual_amount === null || data.actual_amount === undefined
        ? null
        : Math.max(0, Math.round(data.actual_amount * 100) / 100),
    paid_amount: Math.max(0, Math.round((data.paid_amount || 0) * 100) / 100),
    due_date: data.due_date || null,
    notes: data.notes?.trim() || null,
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
