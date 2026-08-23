import { createSupabaseSSRClient } from '@/lib/supabase/middleware'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const supabase = await createSupabaseSSRClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (session) {
    const allowedEmails = process.env.ADMIN_EMAILS?.split(',').map((e) => e.trim()) || []
    if (allowedEmails.includes(session.user.email || '')) {
      redirect('/admin/dashboard')
    }
  }

  redirect('/admin/login')
}
