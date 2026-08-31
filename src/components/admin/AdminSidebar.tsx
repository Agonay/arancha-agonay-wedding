'use client'

import Link from 'next/link'
import {
  LayoutDashboard,
  Users,
  Mail,
  MessageCircle,
  ClipboardCheck,
  CalendarDays,
  Table2,
  Bus,
  Wallet,
  Handshake,
  CalendarClock,
  FileText,
  ClipboardList,
  Package,
  Settings,
  LogOut,
  Music,
  Headphones,
} from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser'

const navigation = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Invitados', href: '/admin/guests', icon: Users },
  { name: 'Invitaciones', href: '/admin/invitations', icon: Mail },
  { name: 'Comunicaciones', href: '/admin/comunicaciones', icon: MessageCircle },
  { name: 'RSVP', href: '/admin/rsvps', icon: ClipboardCheck },
  { name: 'Logística', href: '/admin/logistics', icon: CalendarDays },
  { name: 'Mesas', href: '/admin/tables', icon: Table2 },
  { name: 'Transporte', href: '/admin/transport', icon: Bus },
  { name: 'Presupuesto', href: '/admin/budget', icon: Wallet },
  { name: 'Proveedores', href: '/admin/vendors', icon: Handshake },
  { name: 'Citas', href: '/admin/citas', icon: CalendarClock },
  { name: 'Documentos', href: '/admin/documentos', icon: FileText },
  { name: 'Música', href: '/admin/musica', icon: Music },
  { name: 'DJ', href: '/admin/dj', icon: Headphones },
  { name: 'Tareas', href: '/admin/tasks', icon: ClipboardList },
  { name: 'Inventario', href: '/admin/inventory', icon: Package },
  { name: 'Configuración', href: '/admin/settings', icon: Settings },
]

export default function AdminSidebar() {
  const handleSignOut = async () => {
    const supabase = createSupabaseBrowserClient()
    await supabase.auth.signOut()
    window.location.href = '/admin/login'
  }

  return (
    <aside className="hidden w-64 flex-col border-r bg-white md:flex">
      <div className="flex h-16 items-center border-b px-6">
        <h1 className="text-lg font-serif font-semibold text-charcoal">
          Aránzazu & Agonay
        </h1>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.name}
              href={item.href}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-warm-gray hover:bg-cream hover:text-charcoal transition-colors"
            >
              <Icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>
      <div className="border-t p-3">
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-warm-gray hover:bg-cream hover:text-charcoal transition-colors"
        >
          <LogOut className="h-5 w-5" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
