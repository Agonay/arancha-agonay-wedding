'use client'

import { useEffect, useState } from 'react'

interface CountdownProps {
  weddingDate: string
  light?: boolean
}

function getRemaining(target: number) {
  const diff = target - Date.now()
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, done: true }
  }
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24)
  const minutes = Math.floor((diff / (1000 * 60)) % 60)
  const seconds = Math.floor((diff / 1000) % 60)
  return { days, hours, minutes, seconds, done: false }
}

export default function Countdown({ weddingDate, light = false }: CountdownProps) {
  const target = new Date(`${weddingDate}T00:00:00`).getTime()
  const [remaining, setRemaining] = useState(() => getRemaining(target))

  useEffect(() => {
    const id = setInterval(() => setRemaining(getRemaining(target)), 1000)
    return () => clearInterval(id)
  }, [target])

  const digits = [remaining.days, remaining.hours, remaining.minutes, remaining.seconds]
  const labels = ['Días', 'Horas', 'Min', 'Seg']

  return (
    <div>
      <p
        className={`mb-4 text-sm font-medium tracking-[0.2em] uppercase ${
          light ? 'text-white/60' : 'text-warm-gray-light'
        }`}
      >
        {remaining.done ? '¡Hoy es el gran día!' : 'Faltan'}
      </p>
      {!remaining.done && (
        <div className="flex items-center justify-center gap-2 sm:gap-3">
          {digits.map((value, i) => (
            <div
              key={labels[i]}
              className={`flex min-w-[56px] flex-col items-center rounded-xl px-2 py-3 shadow-sm ${
                light
                  ? 'bg-white/10 backdrop-blur-sm'
                  : 'border border-cream-dark bg-white/90'
              }`}
            >
              <span
                className={`font-serif text-3xl font-semibold tabular-nums ${
                  light ? 'text-white' : 'text-charcoal'
                }`}
              >
                {String(value).padStart(2, '0')}
              </span>
              <span
                className={`mt-1 text-[10px] tracking-wider uppercase ${
                  light ? 'text-white/60' : 'text-warm-gray-light'
                }`}
              >
                {labels[i]}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
