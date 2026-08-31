'use server'

import { createSupabaseServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

interface TaskRow {
  id: string
  title: string
  description: string | null
  done: boolean
  done_at: string | null
  due_date: string | null
  priority: string
  created_at: string
}

async function getWeddingId() {
  const supabase = createSupabaseServerClient()
  const { data: wedding, error } = await supabase
    .from('weddings')
    .select('id')
    .single()
  if (error || !wedding) throw new Error('No wedding record found.')
  return wedding.id
}

export type TaskInput = {
  title: string
  description?: string | null
  priority?: 'low' | 'medium' | 'high'
  due_date?: string | null
}

export async function getTasks() {
  const supabase = createSupabaseServerClient()
  const weddingId = await getWeddingId()

  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('wedding_id', weddingId)
    .order('done', { ascending: true })
    .order('created_at', { ascending: false })

  if (error) throw error

  return (data as TaskRow[] | null) || []
}

export async function createTask(data: TaskInput) {
  const supabase = createSupabaseServerClient()
  const weddingId = await getWeddingId()

  const { data: task, error } = await supabase
    .from('tasks')
    .insert({
      wedding_id: weddingId,
      title: data.title.trim(),
      description: data.description?.trim() || null,
      priority: data.priority || 'low',
      due_date: data.due_date || null,
    })
    .select()
    .single()

  if (error) throw error

  revalidatePath('/admin/tasks')

  return task
}

export async function toggleTask(id: string, done: boolean) {
  const supabase = createSupabaseServerClient()

  const { error } = await supabase
    .from('tasks')
    .update({
      done,
      done_at: done ? new Date().toISOString() : null,
    })
    .eq('id', id)

  if (error) throw error

  revalidatePath('/admin/tasks')
}

export async function deleteTask(id: string) {
  const supabase = createSupabaseServerClient()

  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id)

  if (error) throw error

  revalidatePath('/admin/tasks')
}
