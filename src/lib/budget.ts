// Budget pricing math shared by server actions and the admin board UI.

export type PricingMode = 'total' | 'per_guest'

export interface PricingFields {
  pricing_mode: PricingMode
  unit_price: number | null
  guest_count: number | null
  iva_rate: number | null // percent, e.g. 10
  units_with_iva: number | null
}

export interface ComputedTotal {
  baseSinIva: number
  ivaAmount: number
  total: number
}

const round2 = (n: number) => Math.round(n * 100) / 100

/**
 * per_guest total = unit × (untaxed units) + unit × taxedUnits × (1 + rate%)
 * `total` mode items are never computed (amounts are manual).
 */
export function computeItemTotal(fields: PricingFields): ComputedTotal | null {
  if (fields.pricing_mode !== 'per_guest') return null
  const unit = fields.unit_price ?? 0
  const count = fields.guest_count ?? 0
  const rate = (fields.iva_rate ?? 0) / 100
  const taxed = Math.min(fields.units_with_iva ?? 0, count)

  const baseSinIva = round2(unit * count)
  const ivaAmount = round2(unit * taxed * rate)
  return { baseSinIva, ivaAmount, total: round2(baseSinIva + ivaAmount) }
}

/**
 * Parses the "cantidad" input which accepts either an absolute number
 * ("120") or a percentage of a reference guest count ("50%").
 * Returns null when the input is not valid.
 */
export function parseQuantity(
  raw: string,
  referenceGuests: number
): number | null {
  const trimmed = raw.replace(/\s/g, '').replace(',', '.')
  if (!trimmed) return null

  if (trimmed.endsWith('%')) {
    const pct = parseFloat(trimmed.slice(0, -1))
    if (!Number.isFinite(pct) || pct < 0 || pct > 100) return null
    return Math.round((pct / 100) * referenceGuests)
  }

  const n = Number(trimmed)
  if (!Number.isFinite(n) || n < 0) return null
  return Math.round(n * 100) / 100
}
