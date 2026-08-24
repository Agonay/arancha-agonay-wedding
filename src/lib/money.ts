const eurFormatter = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

export function formatEUR(value: number): string {
  return eurFormatter.format(value)
}

/** Parses user input tolerant to Spanish decimal comma ("1.250,50" / "1250,5"). */
export function parseAmount(input: string): number {
  const normalized = input.replace(/\./g, '').replace(',', '.').trim()
  const n = parseFloat(normalized)
  return Number.isFinite(n) ? n : 0
}
