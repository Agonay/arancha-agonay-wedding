import { createSupabaseServerClient } from '@/lib/supabase/server'
import StatCard from '@/components/admin/StatCard'
import DJQueue from '@/components/admin/music/DJQueue'
import { Headphones, Clock, Music, AlertCircle, LogOut } from 'lucide-react'
import { djLogout } from '@/features/dj/actions'

export const dynamic = 'force-dynamic'

export default async function DJPage() {
  const supabase = createSupabaseServerClient()

  const { data: rawProposals } = await supabase
    .from('song_proposals')
    .select('*, guests!guest_id(display_name)')
    .order('submitted_at', { ascending: false })

  const proposals = (rawProposals || []).map((p: any) => ({
    id: p.id,
    title: p.title,
    artist: p.artist,
    spotify_url: p.spotify_url,
    youtube_url: p.youtube_url,
    deezer_url: p.deezer_url,
    album_art_url: p.album_art_url,
    moment_category: p.moment_category,
    guest_name: p.guest_name || p.guests?.display_name || 'Anónimo',
    status: p.status,
    submitted_at: p.submitted_at,
  }))

  const pendingCount = proposals.filter((p) => p.status === 'pending').length
  const queuedCount = proposals.filter((p) => p.status === 'queued').length
  const playedCount = proposals.filter((p) => p.status === 'played').length
  const rejectedCount = proposals.filter((p) => p.status === 'rejected').length

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex items-center justify-between px-6 md:px-8 py-4 border-b bg-white">
        <div className="flex items-center gap-2">
          <Headphones className="h-6 w-6 text-sage-dark" />
          <h1 className="text-lg font-semibold text-gray-900">DJ - Cola de Canciones</h1>
        </div>
        <form action={djLogout}>
          <button
            type="submit"
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Salir
          </button>
        </form>
      </div>

      <div className="max-w-5xl mx-auto space-y-6 p-6 md:p-8">
        <p className="text-gray-500 text-sm">Propuestas de invitados en tiempo real</p>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Pendientes"
            value={pendingCount}
            icon={Clock}
            color="bg-amber-50 text-amber-600"
          />
          <StatCard
            title="En cola"
            value={queuedCount}
            icon={Headphones}
            color="bg-blue-50 text-blue-600"
          />
          <StatCard
            title="Reproducidas"
            value={playedCount}
            icon={Music}
            color="bg-emerald-50 text-emerald-600"
          />
          <StatCard
            title="Rechazadas"
            value={rejectedCount}
            icon={AlertCircle}
            color="bg-red-50 text-red-600"
          />
        </div>

        <DJQueue initialProposals={proposals} />
      </div>
    </div>
  )
}
