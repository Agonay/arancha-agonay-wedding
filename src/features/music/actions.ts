'use server'

import { createSupabaseServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { searchSpotify, searchDeezer, parseMusicUrl } from '@/lib/music'

function revalidateMusic() {
  revalidatePath('/admin/musica')
  revalidatePath('/admin/dj')
  revalidatePath('/admin/dashboard')
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

// ============================================
// Feature Flags
// ============================================

export async function getFeatureFlag(key: string): Promise<boolean> {
  const supabase = createSupabaseServerClient()
  const { data, error } = await supabase
    .from('feature_flags')
    .select('value')
    .eq('key', key)
    .single()
  if (error) return false
  return data?.value ?? false
}

export async function setFeatureFlag(key: string, value: boolean) {
  const supabase = createSupabaseServerClient()
  const { error } = await supabase
    .from('feature_flags')
    .upsert({ key, value, updated_at: new Date().toISOString() })
  if (error) throw error
  revalidateMusic()
  revalidatePath('/i/[token]')
}

// ============================================
// Music Playlist (couple's curated songs)
// ============================================

export type PlaylistInput = {
  title: string
  artist: string
  spotify_url?: string | null
  youtube_url?: string | null
  deezer_url?: string | null
  album_art_url?: string | null
  moment_category: string
  schedule_event_id?: string | null
  priority?: number
  notes?: string | null
}

export async function getPlaylist() {
  const supabase = createSupabaseServerClient()
  const weddingId = await getWeddingId()

  const { data, error } = await supabase
    .from('music_playlist')
    .select('*, schedule_events!schedule_event_id(title)')
    .eq('wedding_id', weddingId)
    .order('moment_category', { ascending: true })
    .order('priority', { ascending: true })

  if (error) throw error
  return data || []
}

export async function createPlaylistItem(data: PlaylistInput) {
  const supabase = createSupabaseServerClient()
  const weddingId = await getWeddingId()

  const { data: item, error } = await supabase
    .from('music_playlist')
    .insert({
      ...data,
      wedding_id: weddingId,
      title: data.title.trim(),
      artist: data.artist.trim(),
      notes: data.notes?.trim() || null,
      priority: data.priority ?? 0,
    })
    .select()
    .single()

  if (error) throw error
  revalidateMusic()
  return item
}

export async function updatePlaylistItem(id: string, data: Partial<PlaylistInput>) {
  const supabase = createSupabaseServerClient()
  const update: Record<string, any> = { ...data }
  if (update.title) update.title = update.title.trim()
  if (update.artist) update.artist = update.artist.trim()
  if (update.notes !== undefined) update.notes = update.notes?.trim() || null

  const { data: item, error } = await supabase
    .from('music_playlist')
    .update(update)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  revalidateMusic()
  return item
}

export async function deletePlaylistItem(id: string) {
  const supabase = createSupabaseServerClient()
  const { error } = await supabase.from('music_playlist').delete().eq('id', id)
  if (error) throw error
  revalidateMusic()
}

// ============================================
// Song Proposals (guest suggestions)
// ============================================

export type ProposalInput = {
  title: string
  artist: string
  spotify_url?: string | null
  youtube_url?: string | null
  deezer_url?: string | null
  album_art_url?: string | null
  moment_category?: string
  guest_name?: string | null
  guest_id?: string | null
}

export async function getProposals() {
  const supabase = createSupabaseServerClient()
  const weddingId = await getWeddingId()

  const { data, error } = await supabase
    .from('song_proposals')
    .select('*, guests!guest_id(display_name)')
    .eq('wedding_id', weddingId)
    .order('submitted_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function submitProposal(data: ProposalInput) {
  const supabase = createSupabaseServerClient()
  const weddingId = await getWeddingId()

  const { data: proposal, error } = await supabase
    .from('song_proposals')
    .insert({
      wedding_id: weddingId,
      title: data.title.trim(),
      artist: data.artist.trim(),
      spotify_url: data.spotify_url || null,
      youtube_url: data.youtube_url || null,
      deezer_url: data.deezer_url || null,
      album_art_url: data.album_art_url || null,
      moment_category: data.moment_category || 'fiesta',
      guest_name: data.guest_name?.trim() || null,
      guest_id: data.guest_id || null,
      status: 'pending',
    })
    .select()
    .single()

  if (error) throw error
  return proposal
}

export async function updateProposalStatus(id: string, status: string) {
  const supabase = createSupabaseServerClient()
  const { data: proposal, error } = await supabase
    .from('song_proposals')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return proposal
}

export async function deleteProposal(id: string) {
  const supabase = createSupabaseServerClient()
  const { error } = await supabase.from('song_proposals').delete().eq('id', id)
  if (error) throw error
}

// ============================================
// Music Search (Spotify + Deezer)
// ============================================

export async function searchMusicAction(query: string) {
  if (!query.trim()) return []
  const spotify = await searchSpotify(query.trim())
  if (spotify.length > 0) return spotify
  return searchDeezer(query.trim())
}

export async function unfurlMusicUrl(url: string) {
  const parsed = parseMusicUrl(url)
  return parsed
}
