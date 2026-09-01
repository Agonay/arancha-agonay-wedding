import { createSupabaseSSRClient } from '@/lib/supabase/middleware'
import { redirect } from 'next/navigation'
import AdminSidebar from '@/components/admin/AdminSidebar'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createSupabaseSSRClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/admin/login')
  }

  const allowedEmails = process.env.ADMIN_EMAILS?.split(',').map((e) => e.trim()) || []
  if (!allowedEmails.includes(session.user.email || '')) {
    redirect('/admin/login')
  }

  return (
    <div className="flex h-screen flex-col overflow-y-auto bg-gray-50 md:flex-row md:overflow-hidden">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto p-6 md:p-8">{children}</main>
    </div>
  )
}
