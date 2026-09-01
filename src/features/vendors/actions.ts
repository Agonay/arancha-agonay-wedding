'use server'

import { createSupabaseServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

function revalidateVendors() {
  revalidatePath('/admin/vendors')
  revalidatePath('/admin/dashboard')
  revalidatePath('/admin/budget')
}

export type VendorStatus = 'candidato' | 'contactado' | 'contratado' | 'descartado'

export type VendorInput = {
  name: string
  service_type: string
  status?: VendorStatus
  contact_name?: string | null
  phone?: string | null
  email?: string | null
  website?: string | null
  rating?: number | null
  notes?: string | null
}

async function getWeddingId() {
  const supabase = createSupabaseServerClient()
  const { data: wedding, error } = await supabase.from('weddings').select('id').single()
  if (error || !wedding) throw new Error('No wedding record found.')
  return wedding.id as string
}

function sanitizeVendor(data: VendorInput) {
  return {
    name: data.name.trim(),
    service_type: data.service_type.trim() || 'Otro',
    status: data.status || 'candidato',
    contact_name: data.contact_name?.trim() || null,
    phone: data.phone?.trim() || null,
    email: data.email?.trim() || null,
    website: data.website?.trim() || null,
    rating:
      data.rating === null || data.rating === undefined
        ? null
        : Math.min(5, Math.max(1, Math.round(data.rating))),
    notes: data.notes?.trim() || null,
  }
}

export async function createVendor(data: VendorInput) {
  const supabase = createSupabaseServerClient()
  const weddingId = await getWeddingId()

  const { data: vendor, error } = await supabase
    .from('vendors')
    .insert({ ...sanitizeVendor(data), wedding_id: weddingId })
    .select()
    .single()

  if (error) throw error
  revalidateVendors()
  return vendor
}

export async function updateVendor(id: string, data: VendorInput) {
  const supabase = createSupabaseServerClient()
  const { data: vendor, error } = await supabase
    .from('vendors')
    .update(sanitizeVendor(data))
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  revalidateVendors()
  return vendor
}

export async function updateVendorStatus(id: string, status: VendorStatus) {
  const supabase = createSupabaseServerClient()
  const { error } = await supabase.from('vendors').update({ status }).eq('id', id)
  if (error) throw error
  revalidateVendors()
}

export async function deleteVendor(id: string) {
  const supabase = createSupabaseServerClient()

  // Remove contract files from storage before cascading rows away.
  const { data: contracts } = await supabase
    .from('vendor_contracts')
    .select('file_path')
    .eq('vendor_id', id)

  const paths = (contracts || []).map((c) => c.file_path).filter((p): p is string => Boolean(p))
  if (paths.length > 0) {
    await supabase.storage.from('contracts').remove(paths)
  }

  const { error } = await supabase.from('vendors').delete().eq('id', id)
  if (error) throw error
  revalidateVendors()
}

// ============================================
// Contracts
// ============================================

export type ContractInput = {
  vendor_id: string
  title: string
  file_path?: string | null
  amount?: number | null
  signed_at?: string | null
  notes?: string | null
  budget_item_id?: string | null
}

export async function createContract(data: ContractInput) {
  const supabase = createSupabaseServerClient()
  const weddingId = await getWeddingId()

  const { data: contract, error } = await supabase
    .from('vendor_contracts')
    .insert({
      wedding_id: weddingId,
      vendor_id: data.vendor_id,
      title: data.title.trim(),
      file_path: data.file_path || null,
      amount:
        data.amount === null || data.amount === undefined
          ? null
          : Math.max(0, Math.round(data.amount * 100) / 100),
      signed_at: data.signed_at || null,
      notes: data.notes?.trim() || null,
      budget_item_id: data.budget_item_id || null,
    })
    .select()
    .single()

  if (error) throw error
  revalidateVendors()
  return contract
}

export async function deleteContract(id: string) {
  const supabase = createSupabaseServerClient()

  const { data: contract } = await supabase
    .from('vendor_contracts')
    .select('file_path')
    .eq('id', id)
    .single()

  if (contract?.file_path) {
    await supabase.storage.from('contracts').remove([contract.file_path])
  }

  const { error } = await supabase.from('vendor_contracts').delete().eq('id', id)
  if (error) throw error
  revalidateVendors()
}

// ============================================
// Payments
// ============================================

export type PaymentInput = {
  vendor_id: string
  concept: string
  amount?: number | null
  due_date: string
  budget_item_id?: string | null
}

export async function createPayment(data: PaymentInput) {
  const supabase = createSupabaseServerClient()
  const weddingId = await getWeddingId()

  const { data: payment, error } = await supabase
    .from('vendor_payments')
    .insert({
      wedding_id: weddingId,
      vendor_id: data.vendor_id,
      concept: data.concept.trim(),
      amount:
        data.amount === null || data.amount === undefined
          ? null
          : Math.max(0, Math.round(data.amount * 100) / 100),
      due_date: data.due_date,
      budget_item_id: data.budget_item_id || null,
    })
    .select()
    .single()

  if (error) throw error
  revalidateVendors()
  return payment
}

export async function togglePaymentPaid(id: string, paidAt: string | null) {
  const supabase = createSupabaseServerClient()
  const { error } = await supabase.from('vendor_payments').update({ paid_at: paidAt }).eq('id', id)
  if (error) throw error
  revalidateVendors()
}

export async function deletePayment(id: string) {
  const supabase = createSupabaseServerClient()
  const { error } = await supabase.from('vendor_payments').delete().eq('id', id)
  if (error) throw error
  revalidateVendors()
}
