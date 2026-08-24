import { createClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

// Daily reminder emails for citas (7 days + 1 day before).
// Triggered by the Vercel cron defined in vercel.json; protected with
// CRON_SECRET (Vercel sends it automatically as Authorization: Bearer).

type Cita = {
  id: string
  title: string
  category: string
  vendor_id: string | null
  appointment_date: string
  start_time: string | null
  end_time: string | null
  location: string | null
  notes: string | null
  reminder_7d_sent_at: string | null
  reminder_1d_sent_at: string | null
  vendors: { name: string } | { name: string }[] | null
}

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

/** Today in Europe/Madrid as YYYY-MM-DD (cron runs on UTC servers). */
function madridToday(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Madrid',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

function daysUntil(fromISO: string, toISO: string): number {
  const ms = Date.parse(`${toISO}T00:00:00Z`) - Date.parse(`${fromISO}T00:00:00Z`)
  return Math.round(ms / 86400000)
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function longDate(iso: string): string {
  return capitalize(
    new Intl.DateTimeFormat('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      timeZone: 'UTC',
    }).format(Date.parse(`${iso}T00:00:00Z`))
  )
}

function timeRange(cita: Cita): string {
  const start = cita.start_time ? cita.start_time.slice(0, 5) : ''
  const end = cita.end_time ? cita.end_time.slice(0, 5) : ''
  if (start && end) return `${start}–${end} h`
  return start ? `${start} h` : 'Hora sin concretar'
}

function whenLabel(days: number): string {
  if (days === 0) return '¡es HOY!'
  if (days === 1) return 'es mañana'
  return `es en ${days} días`
}

function emailHtml(cita: Cita, days: number): string {
  const vendor = Array.isArray(cita.vendors) ? cita.vendors[0] : cita.vendors
  const row = (label: string, value: string | null) =>
    value
      ? `<tr><td style="padding:4px 12px 4px 0;color:#8a8a8a;font-size:13px;white-space:nowrap;vertical-align:top">${label}</td><td style="padding:4px 0;color:#2d2d2d;font-size:14px">${value}</td></tr>`
      : ''

  return `
  <div style="font-family:Georgia,serif;max-width:520px;margin:0 auto;background:#faf8f5;border-radius:12px;padding:32px">
    <p style="color:#8a8a8a;font-size:12px;letter-spacing:2px;text-transform:uppercase;margin:0 0 8px">Boda Aránzazu &amp; Agonay</p>
    <h1 style="color:#2d2d2d;font-size:22px;margin:0 0 4px">Recordatorio de cita</h1>
    <p style="color:#6b7259;font-size:15px;margin:0 0 20px">La cita <strong>${cita.title}</strong> ${whenLabel(days)}.</p>
    <table style="border-collapse:collapse;background:#ffffff;border:1px solid #e5e0d8;border-radius:10px" cellpadding="0" cellspacing="0" width="100%">
      ${row('Fecha', `${longDate(cita.appointment_date)} (${cita.appointment_date.split('-').reverse().join('/')})`)}
      ${row('Hora', timeRange(cita))}
      ${row('Categoría', cita.category)}
      ${row('Proveedor', vendor?.name ?? null)}
      ${row('Lugar', cita.location)}
      ${row('Notas', cita.notes)}
    </table>
    <p style="color:#b0aca3;font-size:12px;margin:20px 0 0">Este aviso se envió automáticamente desde aranzazuagonay.es.</p>
  </div>`
}

async function sendEmail(to: string[], subject: string, html: string) {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM || 'Boda Aránzazu & Agonay <onboarding@resend.dev>'
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to, subject, html }),
  })
  if (!res.ok) {
    throw new Error(`Resend error (${res.status}): ${await res.text()}`)
  }
}

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (secret && request.headers.get('authorization') !== `Bearer ${secret}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const recipients = (process.env.NOTIFY_EMAILS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  if (!process.env.RESEND_API_KEY || recipients.length === 0) {
    return Response.json(
      { error: 'Missing RESEND_API_KEY or NOTIFY_EMAILS configuration' },
      { status: 500 }
    )
  }

  const today = madridToday()
  const supabase = serviceClient()

  const { data: rawCitas, error } = await supabase
    .from('appointments')
    .select(`
      id, title, category, vendor_id, appointment_date,
      start_time, end_time, location, notes,
      reminder_7d_sent_at, reminder_1d_sent_at,
      vendors ( name )
    `)
    .in('status', ['pendiente', 'confirmada'])
    .gte('appointment_date', today)
    .or('reminder_7d_sent_at.is.null,reminder_1d_sent_at.is.null')
    .order('appointment_date', { ascending: true })

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  const citas = (rawCitas || []) as unknown as Cita[]
  const sent: { id: string; title: string; daysLeft: number; reminders: string[] }[] = []

  for (const cita of citas) {
    const days = daysUntil(today, cita.appointment_date)

    // Fire each reminder once its window opens; overdue-but-unsent still goes
    // out once. The urgent (<=1 day) email supersedes an unsent 7d reminder.
    let kind: '7d' | 'urgent' | null = null
    if (days >= 1 && days <= 7 && !cita.reminder_7d_sent_at) kind = '7d'
    else if (days >= 0 && days <= 1 && !cita.reminder_1d_sent_at) kind = 'urgent'

    if (!kind) continue

    try {
      await sendEmail(
        recipients,
        `Cita boda: ${cita.title} — ${whenLabel(days)}`,
        emailHtml(cita, days)
      )
    } catch (err) {
      return Response.json(
        { error: `Failed sending for cita ${cita.id}`, detail: String(err), sent },
        { status: 502 }
      )
    }

    const patch: Record<string, string> =
      kind === '7d'
        ? { reminder_7d_sent_at: new Date().toISOString() }
        : {
            reminder_1d_sent_at: new Date().toISOString(),
            reminder_7d_sent_at: new Date().toISOString(),
          }
    await supabase.from('appointments').update(patch).eq('id', cita.id)

    sent.push({
      id: cita.id,
      title: cita.title,
      daysLeft: days,
      reminders: [kind],
    })
  }

  return Response.json({ ok: true, checked: citas.length, sent })
}
