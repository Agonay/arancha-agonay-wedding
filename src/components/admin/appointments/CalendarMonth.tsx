'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const MONTHS = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
]

const WEEKDAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

// Module-scope date helpers: react-hooks/purity forbids inline new Date()
// inside component bodies.
function pad(n: number): string {
  return String(n).padStart(2, '0')
}

function isoOf(year: number, monthIndex0: number, day: number): string {
  return `${year}-${pad(monthIndex0 + 1)}-${pad(day)}`
}

function currentMonth(): { year: number; month: number } {
  const now = new Date()
  return { year: now.getFullYear(), month: now.getMonth() }
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

/** Grid of ISO dates for a month view, Monday-first; null = leading blank. */
function monthGrid(year: number, month: number): (string | null)[] {
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7 // Mon=0
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (string | null)[] = Array.from({ length: firstWeekday }, () => null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(isoOf(year, month, d))
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

export default function CalendarMonth({
  markedDates,
  selectedDate,
  onSelect,
  compact = false,
}: {
  markedDates: Record<string, number>
  selectedDate: string | null
  onSelect?: (date: string | null) => void
  compact?: boolean
}) {
  const [view, setView] = useState(currentMonth)
  const today = todayISO()
  const interactive = typeof onSelect === 'function'

  const move = (delta: number) => {
    setView((v) => {
      const m = v.month + delta
      if (m < 0) return { year: v.year - 1, month: 11 }
      if (m > 11) return { year: v.year + 1, month: 0 }
      return { ...v, month: m }
    })
  }

  const cellCls = compact ? 'h-8 text-xs' : 'h-9 text-sm'

  return (
    <div className={compact ? 'w-full' : 'w-full max-w-xs'}>
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={() => move(-1)}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
          aria-label="Mes anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <p className={`font-medium text-gray-900 capitalize ${compact ? 'text-sm' : ''}`}>
          {MONTHS[view.month]} {view.year}
        </p>
        <button
          onClick={() => move(1)}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
          aria-label="Mes siguiente"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-y-1">
        {WEEKDAYS.map((w) => (
          <div key={w} className={`${compact ? 'h-7' : 'h-8'} flex items-center justify-center text-[10px] font-medium uppercase tracking-wide text-gray-400`}>
            {w}
          </div>
        ))}
        {monthGrid(view.year, view.month).map((iso, i) => {
          if (!iso) return <div key={`blank-${i}`} />
          const count = markedDates[iso] || 0
          const selected = selectedDate === iso
          const isToday = iso === today

          let cls = `${cellCls} rounded-lg flex flex-col items-center justify-center transition-colors relative`
          if (selected) cls += ' bg-emerald-600 text-white font-medium'
          else if (count > 0) cls += ' bg-sage-light/50 text-charcoal hover:bg-sage-light cursor-pointer font-medium'
          else if (interactive) cls += ' text-gray-600 hover:bg-gray-100 cursor-pointer'
          else cls += ' text-gray-600'

          const content = (
            <>
              <span className={isToday && !selected ? 'underline decoration-emerald-500 decoration-2 underline-offset-2' : ''}>
                {parseInt(iso.slice(8), 10)}
              </span>
              {count > 0 && !selected && (
                <span className={`absolute bottom-0.5 w-1 h-1 rounded-full ${count > 1 ? 'bg-sage-dark' : 'bg-sage-dark/60'}`} />
              )}
            </>
          )

          if (!interactive) {
            return (
              <div key={iso} className={cls}>
                {content}
              </div>
            )
          }
          return (
            <button
              key={iso}
              onClick={() => onSelect!(selected ? null : iso)}
              title={count > 0 ? `${count} cita${count > 1 ? 's' : ''}` : undefined}
              className={cls}
            >
              {content}
            </button>
          )
        })}
      </div>
    </div>
  )
}
