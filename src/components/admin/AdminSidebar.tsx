'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
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
  PartyPopper,
  Menu,
  X,
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
  { name: 'Día Boda', href: '/admin/wedding-day', icon: PartyPopper },
  { name: 'Tareas', href: '/admin/tasks', icon: ClipboardList },
  { name: 'Inventario', href: '/admin/inventory', icon: Package },
  { name: 'Configuración', href: '/admin/settings', icon: Settings },
]

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()

  return (
    <>
      {navigation.map((item) => {
        const Icon = item.icon
        const active = pathname === item.href || pathname.startsWith(item.href + '/')
        return (
          <Link
            key={item.name}
            href={item.href}
            onClick={onNavigate}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              active
                ? 'bg-cream text-charcoal'
                : 'text-warm-gray hover:bg-cream hover:text-charcoal'
            }`}
          >
            <Icon className="h-5 w-5" />
            {item.name}
          </Link>
        )
      })}
    </>
  )
}

function SignOutButton() {
  const handleSignOut = async () => {
    const supabase = createSupabaseBrowserClient()
    await supabase.auth.signOut()
    window.location.href = '/admin/login'
  }

  return (
    <button
      onClick={handleSignOut}
      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-warm-gray hover:bg-cream hover:text-charcoal transition-colors"
    >
      <LogOut className="h-5 w-5" />
      Cerrar sesión
    </button>
  )
}

export default function AdminSidebar() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <div className="flex h-14 items-center justify-between border-b bg-white px-4 md:hidden">
        <h1 className="text-base font-serif font-semibold text-charcoal">
          Aránzazu & Agonay
        </h1>
        <button
          onClick={() => setOpen(true)}
          aria-label="Abrir menú"
          className="rounded-lg p-2 text-warm-gray hover:bg-cream hover:text-charcoal transition-colors"
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r bg-white transition-transform md:static md:z-auto md:w-64 md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b px-6">
          <h1 className="text-lg font-serif font-semibold text-charcoal">
            Aránzazu & Agonay
          </h1>
          <button
            onClick={() => setOpen(false)}
            aria-label="Cerrar menú"
            className="rounded-lg p-1 text-warm-gray hover:bg-cream hover:text-charcoal transition-colors md:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          <NavLinks onNavigate={() => setOpen(false)} />
        </nav>
        <div className="border-t p-3">
          <SignOutButton />
        </div>
      </aside>
    </>
  )
}
