'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, Music, ExternalLink, X } from 'lucide-react'
import {
  createPlaylistItem,
  updatePlaylistItem,
  deletePlaylistItem,
  searchMusicAction,
  type PlaylistInput,
} from '@/features/music/actions'
import { MOMENT_CATEGORIES, categoryLabel } from '@/lib/music'

export interface PlaylistItem {
  id: string
  title: string
  artist: string
  spotify_url: string | null
  youtube_url: string | null
  deezer_url: string | null
  album_art_url: string | null
  moment_category: string
  schedule_event_title: string | null
  priority: number
  notes: string | null
}

export default function PlaylistManager({ items }: { items: PlaylistItem[] }) {
  const [editing, setEditing] = useState<PlaylistItem | null>(null)
  const [creating, setCreating] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const [localItems, setLocalItems] = useState(items)
  const [filterCategory, setFilterCategory] = useState<string>('all')

  const grouped = localItems
    .filter((item) => filterCategory === 'all' || item.moment_category === filterCategory)
    .reduce((acc: Record<string, PlaylistItem[]>, item) => {
      if (!acc[item.moment_category]) acc[item.moment_category] = []
      acc[item.moment_category].push(item)
      return acc
    }, {})

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    setSearching(true)
    const results = await searchMusicAction(searchQuery)
    setSearchResults(results)
    setSearching(false)
  }

  const handleSelectResult = (result: any) => {
    const form = document.getElementById('playlist-form') as HTMLFormElement
    if (form) {
      const titleInput = form.querySelector('[name="title"]') as HTMLInputElement
      const artistInput = form.querySelector('[name="artist"]') as HTMLInputElement
      const spotifyInput = form.querySelector('[name="spotify_url"]') as HTMLInputElement
      const deezerInput = form.querySelector('[name="deezer_url"]') as HTMLInputElement
      const albumArtInput = form.querySelector('[name="album_art_url"]') as HTMLInputElement
      if (titleInput) titleInput.value = result.title
      if (artistInput) artistInput.value = result.artist
      if (spotifyInput && result.spotify_url) spotifyInput.value = result.spotify_url
      if (deezerInput && result.deezer_url) deezerInput.value = result.deezer_url
      if (albumArtInput && result.album_art_url) albumArtInput.value = result.album_art_url
    }
    setSearchResults([])
    setSearchQuery('')
  }

  const handleCreate = async (data: PlaylistInput) => {
    const newItem = await createPlaylistItem(data)
    setLocalItems([...localItems, {
      id: newItem.id,
      title: newItem.title,
      artist: newItem.artist,
      spotify_url: newItem.spotify_url,
      youtube_url: newItem.youtube_url,
      deezer_url: newItem.deezer_url,
      album_art_url: newItem.album_art_url,
      moment_category: newItem.moment_category,
      schedule_event_title: null,
      priority: newItem.priority,
      notes: newItem.notes,
    }])
    setCreating(false)
    setSearchResults([])
    setSearchQuery('')
  }

  const handleUpdate = async (data: Partial<PlaylistInput>) => {
    if (!editing) return
    await updatePlaylistItem(editing.id, data)
    setLocalItems(localItems.map((item) =>
      item.id === editing.id ? { ...item, ...data } : item
    ))
    setEditing(null)
  }

  const handleDelete = async (id: string) => {
    await deletePlaylistItem(id)
    setLocalItems(localItems.filter((item) => item.id !== id))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilterCategory('all')}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filterCategory === 'all'
                ? 'bg-sage text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Todas ({localItems.length})
          </button>
          {MOMENT_CATEGORIES.map((cat) => {
            const count = localItems.filter((i) => i.moment_category === cat.value).length
            if (count === 0 && filterCategory !== cat.value) return null
            return (
              <button
                key={cat.value}
                onClick={() => setFilterCategory(cat.value)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  filterCategory === cat.value
                    ? 'bg-sage text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat.label} ({count})
              </button>
            )
          })}
        </div>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-2 px-4 py-2 bg-sage text-white rounded-lg hover:bg-sage-dark transition-colors text-sm font-medium"
        >
          <Plus className="h-4 w-4" />
          Añadir canción
        </button>
      </div>

      {Object.keys(grouped).length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <Music className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No hay canciones en la playlist aún</p>
        </div>
      )}

      {Object.entries(grouped).map(([category, songs]) => (
        <div key={category} className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            {categoryLabel(category)} ({songs.length})
          </h3>
          <div className="space-y-2">
            {songs.map((song) => (
              <SongRow
                key={song.id}
                item={song}
                onEdit={() => setEditing(song)}
                onDelete={() => handleDelete(song.id)}
              />
            ))}
          </div>
        </div>
      ))}

      {(creating || editing) && (
        <SongModal
          item={editing}
          onSave={(data) => editing ? handleUpdate(data) : handleCreate(data as PlaylistInput)}
          onCancel={() => { setCreating(false); setEditing(null); setSearchResults([]); setSearchQuery(''); }}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          onSearch={handleSearch}
          searchResults={searchResults}
          searching={searching}
          onSelectResult={handleSelectResult}
        />
      )}
    </div>
  )
}

function SongRow({
  item,
  onEdit,
  onDelete,
}: {
  item: PlaylistItem
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <div className="flex items-center gap-4 p-4 bg-white border rounded-lg hover:shadow-sm transition-shadow">
      {item.album_art_url ? (
        <img
          src={item.album_art_url}
          alt=""
          className="h-12 w-12 rounded object-cover flex-shrink-0"
        />
      ) : (
        <div className="h-12 w-12 rounded bg-gray-100 flex items-center justify-center flex-shrink-0">
          <Music className="h-5 w-5 text-gray-300" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 truncate">{item.title}</p>
        <p className="text-sm text-gray-500 truncate">{item.artist}</p>
        {item.schedule_event_title && (
          <p className="text-xs text-sage-dark mt-0.5">Evento: {item.schedule_event_title}</p>
        )}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {item.spotify_url && (
          <a
            href={item.spotify_url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 text-gray-400 hover:text-green-500 transition-colors"
            title="Abrir en Spotify"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        )}
        {item.deezer_url && (
          <a
            href={item.deezer_url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 text-gray-400 hover:text-blue-500 transition-colors"
            title="Abrir en Deezer"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        )}
        {item.youtube_url && (
          <a
            href={item.youtube_url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
            title="Abrir en YouTube"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        )}
        <button
          onClick={onEdit}
          className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          onClick={onDelete}
          className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

function SongModal({
  item,
  onSave,
  onCancel,
  searchQuery,
  onSearchQueryChange,
  onSearch,
  searchResults,
  searching,
  onSelectResult,
}: {
  item: PlaylistItem | null
  onSave: (data: Partial<PlaylistInput>) => void
  onCancel: () => void
  searchQuery: string
  onSearchQueryChange: (q: string) => void
  onSearch: () => void
  searchResults: any[]
  searching: boolean
  onSelectResult: (result: any) => void
}) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)
    const data: Partial<PlaylistInput> = {
      title: formData.get('title') as string,
      artist: formData.get('artist') as string,
      spotify_url: (formData.get('spotify_url') as string) || null,
      youtube_url: (formData.get('youtube_url') as string) || null,
      deezer_url: (formData.get('deezer_url') as string) || null,
      album_art_url: (formData.get('album_art_url') as string) || null,
      moment_category: formData.get('moment_category') as string,
      priority: parseInt(formData.get('priority') as string, 10) || 0,
      notes: (formData.get('notes') as string) || null,
    }
    if (item) {
      onSave(data)
    } else {
      onSave(data as PlaylistInput)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            {item ? 'Editar canción' : 'Añadir canción'}
          </h2>
          <button onClick={onCancel} className="p-1 text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form id="playlist-form" onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Buscar canción</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => onSearchQueryChange(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), onSearch())}
                  placeholder="Nombre de canción o artista..."
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sage"
                />
                <button
                  type="button"
                  onClick={onSearch}
                  disabled={searching}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 disabled:opacity-50"
                >
                  {searching ? 'Buscando...' : 'Buscar'}
                </button>
              </div>
              {searchResults.length > 0 && (
                <div className="mt-2 space-y-1 max-h-48 overflow-y-auto border rounded-lg divide-y">
                  {searchResults.map((result, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => onSelectResult(result)}
                      className="flex items-center gap-3 p-2 w-full text-left hover:bg-gray-50"
                    >
                      {result.album_art_url ? (
                        <img src={result.album_art_url} alt="" className="h-8 w-8 rounded" />
                      ) : (
                        <div className="h-8 w-8 rounded bg-gray-100 flex items-center justify-center">
                          <Music className="h-4 w-4 text-gray-300" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{result.title}</p>
                        <p className="text-xs text-gray-500 truncate">{result.artist}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
              <input
                name="title"
                type="text"
                required
                defaultValue={item?.title || ''}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sage"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Artista *</label>
              <input
                name="artist"
                type="text"
                required
                defaultValue={item?.artist || ''}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sage"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Spotify URL</label>
              <input
                name="spotify_url"
                type="url"
                defaultValue={item?.spotify_url || ''}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sage"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Deezer URL</label>
              <input
                name="deezer_url"
                type="url"
                defaultValue={item?.deezer_url || ''}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sage"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">YouTube URL</label>
              <input
                name="youtube_url"
                type="url"
                defaultValue={item?.youtube_url || ''}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sage"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Momento</label>
              <select
                name="moment_category"
                defaultValue={item?.moment_category || 'general'}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sage"
              >
                {MOMENT_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prioridad</label>
              <input
                name="priority"
                type="number"
                defaultValue={item?.priority ?? 0}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sage"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
              <textarea
                name="notes"
                rows={2}
                defaultValue={item?.notes || ''}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sage"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-sage text-white rounded-lg text-sm font-medium hover:bg-sage-dark"
            >
              {item ? 'Guardar' : 'Añadir'}
            </button>
          </div>
        </form>

        <input type="hidden" name="album_art_url" />
      </div>
    </div>
  )
}
