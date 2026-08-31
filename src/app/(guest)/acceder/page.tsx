'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Loader2, User } from 'lucide-react'
import { searchGuestByName } from '@/features/wedding-day/actions'
import { GUEST_TOKEN_STORAGE_KEY } from '@/lib/config'

interface SearchResult {
  id: string
  name: string
  token: string
}

export default function AccederPage() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(GUEST_TOKEN_STORAGE_KEY)
      if (stored) {
        router.replace(`/i/${stored}`)
      }
    }
  }, [router])

  const handleSearch = async () => {
    if (!query.trim()) return
    setLoading(true)
    setSearched(false)
    try {
      const data = await searchGuestByName(query)
      setResults(data)
    } catch {
      setResults([])
    } finally {
      setLoading(false)
      setSearched(true)
    }
  }

  const handleSelect = (token: string) => {
    localStorage.setItem(GUEST_TOKEN_STORAGE_KEY, token)
    router.push(`/i/${token}`)
  }

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-lg mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-serif text-charcoal mb-4">
            Aránzazu <span className="text-sage">&</span> Agonay
          </h1>
          <div className="w-12 h-px bg-sage mx-auto mb-4" />
          <p className="text-warm-gray">
            Introduce tu nombre para encontrar tu invitación
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-cream-dark p-6 shadow-sm">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-warm-gray-light" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Nombre o apellidos"
                className="w-full pl-10 pr-4 py-2.5 border border-cream-dark rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent"
                autoFocus
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={loading || !query.trim()}
              className="px-5 py-2.5 bg-sage text-white text-sm font-medium rounded-lg hover:bg-sage-dark transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              Buscar
            </button>
          </div>

          {searched && results.length === 0 && !loading && (
            <p className="text-sm text-warm-gray-light mt-4 text-center">
              No se encontraron resultados. Verifica el nombre e inténtalo de nuevo.
            </p>
          )}

          {results.length > 0 && (
            <div className="mt-4 space-y-2">
              {results.map((guest) => (
                <button
                  key={guest.id}
                  onClick={() => handleSelect(guest.token)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-cream transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-full bg-sage-light/40 flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4 text-sage-dark" />
                  </div>
                  <span className="text-sm font-medium text-charcoal">{guest.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mt-8 text-center">
          <div className="w-8 h-px bg-sage mx-auto mb-4" />
          <p className="text-xs text-warm-gray-light">
            ¿Problemas para encontrar tu invitación? Contacta con Aránzazu o Agonay.
          </p>
        </div>
      </div>
    </div>
  )
}
