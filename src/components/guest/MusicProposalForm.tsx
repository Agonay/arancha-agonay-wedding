'use client'

import { useState, useCallback } from 'react'
import { Music, Search, ExternalLink, Check, AlertCircle, Loader2, X } from 'lucide-react'
import { searchMusicAction, unfurlMusicUrl, submitProposal, type ProposalInput } from '@/features/music/actions'
import { MOMENT_CATEGORIES, categoryLabel } from '@/lib/music'

interface SearchResult {
  title: string
  artist: string
  spotify_url: string | null
  deezer_url: string | null
  youtube_url: string | null
  album_art_url: string | null
}

export default function MusicProposalForm({ token }: { token: string }) {
  const [mode, setMode] = useState<'search' | 'url' | 'manual'>('search')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const [urlParsed, setUrlParsed] = useState<{ spotify_url: string | null; deezer_url: string | null; youtube_url: string | null } | null>(null)
  const [selectedSong, setSelectedSong] = useState<SearchResult | null>(null)
  const [momentCategory, setMomentCategory] = useState('fiesta')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return
    setSearching(true)
    setError(null)
    const results = await searchMusicAction(searchQuery)
    setSearchResults(results)
    setSearching(false)
  }, [searchQuery])

  const handleUrlParse = async () => {
    if (!urlInput.trim()) return
    setError(null)
    const parsed = await unfurlMusicUrl(urlInput)
    if (parsed) {
      setUrlParsed(parsed)
    } else {
      setError('URL no reconocida. Usa un enlace de Spotify, YouTube o Deezer.')
    }
  }

  const handleSelectResult = (result: SearchResult) => {
    setSelectedSong(result)
    setSearchResults([])
    setSearchQuery('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      let data: ProposalInput
      if (selectedSong) {
        data = {
          title: selectedSong.title,
          artist: selectedSong.artist,
          spotify_url: selectedSong.spotify_url,
          deezer_url: selectedSong.deezer_url,
          youtube_url: selectedSong.youtube_url,
          album_art_url: selectedSong.album_art_url,
          moment_category: momentCategory,
        }
      } else if (urlParsed) {
        const hasSpotify = !!urlParsed.spotify_url
        const hasDeezer = !!urlParsed.deezer_url
        data = {
          title: 'Canción propuesta',
          artist: 'Artista desconocido',
          spotify_url: urlParsed.spotify_url,
          deezer_url: urlParsed.deezer_url,
          youtube_url: urlParsed.youtube_url,
          moment_category: momentCategory,
        }
      } else {
        return
      }

      await submitProposal(data)
      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al enviar la propuesta')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="bg-white rounded-2xl border border-cream-dark p-6 shadow-sm text-center">
        <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
          <Check className="h-6 w-6 text-emerald-600" />
        </div>
        <h3 className="text-lg font-serif text-charcoal mb-2">¡Propuesta enviada!</h3>
        <p className="text-sm text-warm-gray-light mb-4">
          El DJ verá tu sugerencia. ¡Gracias por contribuir a la fiesta!
        </p>
        <button
          onClick={() => { setSubmitted(false); setSelectedSong(null); setUrlParsed(null); setUrlInput(''); }}
          className="text-sm text-sage-dark hover:text-sage font-medium"
        >
          Proponer otra canción
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-cream-dark p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-1">
        <Music className="h-5 w-5 text-sage-dark" />
        <h2 className="text-lg font-serif text-charcoal">Sugiere una canción</h2>
      </div>
      <p className="text-sm text-warm-gray-light mb-4">
        ¿Qué no puede faltar en la fiesta?
      </p>

      {/* Mode tabs */}
      <div className="flex gap-1 bg-cream rounded-lg p-1 mb-4">
        <button
          onClick={() => setMode('search')}
          className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            mode === 'search' ? 'bg-white text-charcoal shadow-sm' : 'text-warm-gray'
          }`}
        >
          Buscar
        </button>
        <button
          onClick={() => setMode('url')}
          className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            mode === 'url' ? 'bg-white text-charcoal shadow-sm' : 'text-warm-gray'
          }`}
        >
          Pegar enlace
        </button>
        <button
          onClick={() => setMode('manual')}
          className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            mode === 'manual' ? 'bg-white text-charcoal shadow-sm' : 'text-warm-gray'
          }`}
        >
          Manual
        </button>
      </div>

      {/* Search mode */}
      {mode === 'search' && (
        <div>
          <div className="flex gap-2 mb-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearch())}
                placeholder="Nombre de canción o artista..."
                className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sage"
              />
              <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
            <button
              onClick={handleSearch}
              disabled={searching || !searchQuery.trim()}
              className="px-4 py-2 bg-sage text-white rounded-lg text-sm font-medium hover:bg-sage-dark disabled:opacity-50 flex items-center gap-1"
            >
              {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Buscar'}
            </button>
          </div>

          {searchResults.length > 0 && (
            <div className="space-y-1 mb-3 max-h-48 overflow-y-auto border rounded-lg divide-y">
              {searchResults.map((result, i) => (
                <button
                  key={i}
                  onClick={() => handleSelectResult(result)}
                  className={`flex items-center gap-3 p-2 w-full text-left hover:bg-cream transition-colors ${
                    selectedSong?.title === result.title ? 'bg-sage-light/30' : ''
                  }`}
                >
                  {result.album_art_url && (
                    <img src={result.album_art_url} alt="" className="h-10 w-10 rounded" />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{result.title}</p>
                    <p className="text-xs text-gray-500 truncate">{result.artist}</p>
                  </div>
                  {result.spotify_url && (
                  {result.deezer_url && (
                    <span className="text-xs text-blue-600 flex-shrink-0">Deezer</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* URL mode */}
      {mode === 'url' && (
        <div>
          <div className="flex gap-2 mb-3">
            <input
              type="url"
              value={urlInput}
              onChange={(e) => { setUrlInput(e.target.value); setUrlParsed(null); }}
              placeholder="https://open.spotify.com/track/..."
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sage"
            />
            <button
              onClick={handleUrlParse}
              disabled={!urlInput.trim()}
              className="px-4 py-2 bg-sage text-white rounded-lg text-sm font-medium hover:bg-sage-dark disabled:opacity-50"
            >
              Añadir
            </button>
          </div>
          {urlParsed && (
            <div className="flex items-center gap-2 p-3 bg-sage-light/30 rounded-lg mb-3">
              <Check className="h-4 w-4 text-sage-dark flex-shrink-0" />
              <span className="text-sm text-sage-dark truncate">
                {urlParsed.spotify_url || urlParsed.deezer_url || urlParsed.youtube_url}
              </span>
            </div>
          )}
          <p className="text-xs text-warm-gray-light">
            Pega un enlace de Spotify, YouTube Music o Deezer
          </p>
        </div>
      )}

      {/* Manual mode */}
      {mode === 'manual' && (
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Canción</label>
            <input
              type="text"
              onChange={(e) => setSelectedSong({ title: e.target.value, artist: selectedSong?.artist || '', spotify_url: null, deezer_url: null, youtube_url: null, album_art_url: null })}
              placeholder="Nombre de la canción"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sage"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Artista</label>
            <input
              type="text"
              onChange={(e) => setSelectedSong({ title: selectedSong?.title || '', artist: e.target.value, spotify_url: null, deezer_url: null, youtube_url: null, album_art_url: null })}
              placeholder="Nombre del artista"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sage"
            />
          </div>
        </div>
      )}

      {/* Moment selector */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-gray-700 mb-1.5">¿Para qué momento?</label>
        <div className="flex flex-wrap gap-1.5">
          {MOMENT_CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setMomentCategory(cat.value)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                momentCategory === cat.value
                  ? 'bg-sage text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Selected song preview */}
      {selectedSong && selectedSong.title && (
        <div className="flex items-center gap-3 p-3 bg-cream rounded-lg mb-4">
          {selectedSong.album_art_url && (
            <img src={selectedSong.album_art_url} alt="" className="h-10 w-10 rounded" />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-charcoal truncate">{selectedSong.title}</p>
            <p className="text-xs text-gray-500 truncate">{selectedSong.artist}</p>
          </div>
          <button onClick={() => setSelectedSong(null)} className="p-1 text-gray-400 hover:text-gray-600">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg mb-4 text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={submitting || (!selectedSong?.title && !urlParsed)}
        className="w-full py-2.5 bg-charcoal text-white text-sm font-medium rounded-lg hover:bg-warm-gray disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Enviando...
          </>
        ) : (
          <>
            <Music className="h-4 w-4" />
            Proponer canción
          </>
        )}
      </button>
    </div>
  )
}
