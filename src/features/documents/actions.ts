'use server'

import { createSupabaseServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

function revalidateDocuments() {
  revalidatePath('/admin/documentos')
}

export type DocumentInput = {
  title: string
  category: string
  file_path: string
  amount?: number | null
  doc_date?: string | null
  vendor_id?: string | null
  budget_item_id?: string | null
  notes?: string | null
}

function sanitizeDocument(data: DocumentInput) {
  const round2 = (n: number) => Math.round(n * 100) / 100
  return {
    title: data.title.trim(),
    category: data.category.trim() || 'Otro',
    file_path: data.file_path,
    amount:
      data.amount === null || data.amount === undefined
        ? null
        : Math.max(0, round2(data.amount)),
    doc_date: data.doc_date || null,
    vendor_id: data.vendor_id || null,
    budget_item_id: data.budget_item_id || null,
    notes: data.notes?.trim() || null,
  }
}

export async function createDocument(data: DocumentInput) {
  const supabase = createSupabaseServerClient()

  const { data: wedding, error: weddingError } = await supabase
    .from('weddings')
    .select('id')
    .single()
  if (weddingError || !wedding) throw new Error('No wedding record found.')

  const { data: document, error } = await supabase
    .from('documents')
    .insert({ ...sanitizeDocument(data), wedding_id: wedding.id })
    .select()
    .single()

  if (error) throw error
  revalidateDocuments()
  return document
}

export async function updateDocument(id: string, data: DocumentInput) {
  const supabase = createSupabaseServerClient()
  const { data: document, error } = await supabase
    .from('documents')
    .update(sanitizeDocument(data))
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  revalidateDocuments()
  return document
}

export async function deleteDocument(id: string) {
  const supabase = createSupabaseServerClient()

  const { data: doc } = await supabase
    .from('documents')
    .select('file_path')
    .eq('id', id)
    .single()

  if (doc?.file_path) {
    await supabase.storage.from('documents').remove([doc.file_path])
  }

  const { error } = await supabase.from('documents').delete().eq('id', id)
  if (error) throw error
  revalidateDocuments()
}
