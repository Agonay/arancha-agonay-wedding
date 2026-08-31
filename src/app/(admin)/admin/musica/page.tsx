import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getPlaylist } from '@/features/music/actions'
import StatCard from '@/components/admin/StatCard'
import PlaylistManager, { type PlaylistItem } from '@/components/admin/music/PlaylistManager'
import { Music, Clock, Heart, PartyPopper, Coffee, Utensils } from 'lucide-react'

export const dynamic = 'force-dynamic'

const CATEGORY_ICONS: Record<string, typeof Music> = {
  'ceremonia': Heart,
  'cocktail': Coffee,
  'cena': Utensils,
  'primer-baile': Heart,
  'fiesta': PartyPopper,
  'cierre': Clock,
  'general': Music,
}

export default async function MusicaPage() {
  const rawPlaylist = await getPlaylist()

  const playlist: PlaylistItem[] = rawPlaylist.map((item: any) => ({
    id: item.id,
    title: item.title,
    artist: item.artist,
    spotify_url: item.spotify_url,
    youtube_url: item.youtube_url,
    deezer_url: item.deezer_url,
    album_art_url: item.album_art_url,
    moment_category: item.moment_category,
    schedule_event_title: item.schedule_events?.title || null,
    priority: item.priority,
    notes: item.notes,
  }))

  const categoryCounts = playlist.reduce((acc: Record<string, number>, item) => {
    acc[item.moment_category] = (acc[item.moment_category] || 0) + 1
    return acc
  }, {})

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Nuestra Música</h1>
        <p className="text-gray-500 mt-1">Playlist curada por momento del día</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total canciones"
          value={playlist.length}
          icon={Music}
          color="bg-purple-50 text-purple-600"
        />
        {Object.entries(CATEGORY_ICONS)
          .filter(([key]) => categoryCounts[key] > 0)
          .slice(0, 3)
          .map(([key, Icon]) => (
            <StatCard
              key={key}
              title={key.charAt(0).toUpperCase() + key.slice(1)}
              value={categoryCounts[key]}
              icon={Icon}
              color="bg-sage-light/40 text-sage-dark"
            />
          ))}
      </div>

      <PlaylistManager items={playlist} />
    </div>
  )
}
