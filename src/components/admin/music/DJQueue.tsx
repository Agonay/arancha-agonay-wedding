'use client'

import { useEffect, useState, useRef } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser'
import { updateProposalStatus, deleteProposal } from '@/features/music/actions'
import { categoryLabel } from '@/lib/music'
import { ExternalLink, Play, SkipForward, XCircle, Trash2, Music } from 'lucide-react'

export interface ProposalItem {
  id: string
  title: string
  artist: string
  spotify_url: string | null
  youtube_url: string | null
  deezer_url: string | null
  album_art_url: string | null
  moment_category: string
  guest_name: string
  status: string
  submitted_at: string
}

export default function DJQueue({ initialProposals }: { initialProposals: ProposalItem[] }) {
  const [proposals, setProposals] = useState<ProposalItem[]>(initialProposals)
  const [filter, setFilter] = useState<string>('pending')
  const [copied, setCopied] = useState<string | null>(null)
  const realtimeSet = useRef(false)

  useEffect(() => {
    if (realtimeSet.current) return
    realtimeSet.current = true

    const supabase = createSupabaseBrowserClient()
    const channel = supabase
      .channel('dj-queue-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'song_proposals' },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const newProposal = payload.new as ProposalItem
            setProposals((prev) => [newProposal, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            setProposals((prev) =>
              prev.map((p) => (p.id === payload.new.id ? { ...p, ...payload.new } : p))
            )
          } else if (payload.eventType === 'DELETE') {
            setProposals((prev) => prev.filter((p) => p.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const handleStatus = async (id: string, status: string) => {
    await updateProposalStatus(id, status)
    setProposals((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status } : p))
    )
  }

  const handleDelete = async (id: string) => {
    await deleteProposal(id)
    setProposals((prev) => prev.filter((p) => p.id !== id))
  }

  const handleCopyLink = async (id: string, url: string) => {
    await navigator.clipboard.writeText(url)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const filtered = filter === 'all'
    ? proposals
    : proposals.filter((p) => p.status === filter)

  const pendingCount = proposals.filter((p) => p.status === 'pending').length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-2 flex-wrap">
          {[
            { value: 'pending', label: 'Pendientes' },
            { value: 'queued', label: 'En cola' },
            { value: 'played', label: 'Reproducidas' },
            { value: 'skipped', label: 'Saltadas' },
            { value: 'rejected', label: 'Rechazadas' },
            { value: 'all', label: 'Todas' },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filter === f.value
                  ? 'bg-sage text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f.label}
              {f.value === 'pending' && pendingCount > 0 && ` (${pendingCount})`}
            </button>
          ))}
        </div>
        {pendingCount > 0 && filter !== 'pending' && (
          <div className="px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg text-sm font-medium animate-pulse">
            {pendingCount} pendiente{pendingCount !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <Music className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No hay canciones {filter !== 'all' ? `con estado "${filter}"` : 'aún'}</p>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map((proposal) => (
          <ProposalCard
            key={proposal.id}
            proposal={proposal}
            onStatus={handleStatus}
            onDelete={handleDelete}
            onCopyLink={handleCopyLink}
            copied={copied}
          />
        ))}
      </div>
    </div>
  )
}

function ProposalCard({
  proposal,
  onStatus,
  onDelete,
  onCopyLink,
  copied,
}: {
  proposal: ProposalItem
  onStatus: (id: string, status: string) => void
  onDelete: (id: string) => void
  onCopyLink: (id: string, url: string) => void
  copied: string | null
}) {
  const url = proposal.spotify_url || proposal.youtube_url || proposal.deezer_url

  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center gap-3 p-4 border rounded-lg transition-all ${
        proposal.status === 'pending'
          ? 'border-amber-200 bg-amber-50/50'
          : proposal.status === 'queued'
          ? 'border-blue-200 bg-blue-50/50'
          : proposal.status === 'played'
          ? 'border-emerald-200 bg-emerald-50/50 opacity-60'
          : 'border-gray-200 bg-gray-50 opacity-40'
      }`}
    >
      {proposal.album_art_url && (
        <img
          src={proposal.album_art_url}
          alt=""
          className="h-12 w-12 rounded object-cover flex-shrink-0"
        />
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-gray-900 truncate">{proposal.title}</p>
          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 flex-shrink-0">
            {categoryLabel(proposal.moment_category)}
          </span>
        </div>
        <p className="text-sm text-gray-500 truncate">{proposal.artist}</p>
        <p className="text-xs text-gray-400 mt-0.5">
          Propuesto por {proposal.guest_name}
        </p>
      </div>

      <div className="flex items-center gap-1 flex-shrink-0 flex-wrap">
        {url && (
          <button
            onClick={() => window.open(url!, '_blank', 'noopener,noreferrer')}
            className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
            title="Abrir enlace"
          >
            <ExternalLink className="h-4 w-4" />
          </button>
        )}
        {proposal.spotify_url && (
          <button
            onClick={() => onCopyLink(proposal.id, proposal.spotify_url!)}
            className="p-1.5 text-gray-400 hover:text-green-500 transition-colors text-xs"
          >
            {copied === proposal.id ? '¡Copiado!' : 'Copiar'}
          </button>
        )}

        {proposal.status === 'pending' && (
          <>
            <button
              onClick={() => onStatus(proposal.id, 'queued')}
              className="p-1.5 text-blue-500 hover:text-blue-700 transition-colors"
              title="Encolar"
            >
              <Play className="h-4 w-4" />
            </button>
            <button
              onClick={() => onStatus(proposal.id, 'skipped')}
              className="p-1.5 text-amber-500 hover:text-amber-700 transition-colors"
              title="Saltar"
            >
              <SkipForward className="h-4 w-4" />
            </button>
            <button
              onClick={() => onStatus(proposal.id, 'rejected')}
              className="p-1.5 text-red-400 hover:text-red-600 transition-colors"
              title="Rechazar"
            >
              <XCircle className="h-4 w-4" />
            </button>
          </>
        )}

        {proposal.status === 'queued' && (
          <>
            <button
              onClick={() => onStatus(proposal.id, 'played')}
              className="p-1.5 text-emerald-500 hover:text-emerald-700 transition-colors"
              title="Marcar como reproducida"
            >
              <Play className="h-4 w-4" />
            </button>
            <button
              onClick={() => onStatus(proposal.id, 'skipped')}
              className="p-1.5 text-amber-500 hover:text-amber-700 transition-colors"
              title="Saltar"
            >
              <SkipForward className="h-4 w-4" />
            </button>
          </>
        )}

        <button
          onClick={() => onDelete(proposal.id)}
          className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
          title="Eliminar"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
