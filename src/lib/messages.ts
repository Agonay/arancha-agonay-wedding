export const WEDDING_DATE_ES = 'sábado 1 de mayo de 2027'
export const RSVP_DEADLINE_ES = '1 de abril de 2027'

const COUPLE_NAMES_ES = process.env.COUPLE_NAMES || 'Aránzazu & Agonay'

export type MessageTemplate = 'invitacion' | 'recordatorio'

export const TEMPLATE_LABELS: Record<MessageTemplate, string> = {
  invitacion: 'Invitación',
  recordatorio: 'Recordatorio',
}

export function buildInviteUrl(token: string): string {
  return `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.aranzazuagonay.es'}/i/${token}`
}

function venueLine(venue?: string | null): string {
  return venue ? `\nLugar: ${venue}\n` : '\n'
}

export function invitationMessage(names: string, url: string, venue?: string | null): string {
  return [
    `¡Hola, ${names}!`,
    '',
    `Nos hace muchísima ilusión invitarte a nuestra boda, que celebraremos el ${WEDDING_DATE_ES}.${venueLine(venue)}Puedes ver tu invitación personal con todos los detalles en este enlace:`,
    '',
    url,
    '',
    `Por favor, confírmanos si podrás venir antes del ${RSVP_DEADLINE_ES}. ¡Te esperamos!`,
    '',
    COUPLE_NAMES_ES,
  ].join('\n')
}

export function reminderMessage(names: string, url: string): string {
  return [
    `¡Hola, ${names}!`,
    '',
    `Somos ${COUPLE_NAMES_ES} y estamos preparando nuestra boda del ${WEDDING_DATE_ES}.`,
    '',
    'Vimos que aún no nos has confirmado si podrás acompañarnos. ¿Nos lo haces saber? Solo te llevará un minuto:',
    '',
    url,
    '',
    `El plazo para responder termina el ${RSVP_DEADLINE_ES}. ¡Muchas gracias!`,
  ].join('\n')
}

export function defaultMessage(
  template: MessageTemplate,
  names: string,
  url: string,
  venue?: string | null
): string {
  if (template === 'recordatorio') return reminderMessage(names, url)
  return invitationMessage(names, url, venue)
}

/** wa.me deep link; assumes Spanish mobile when the number has 9 digits starting 6-9. */
export function waMeHref(rawPhone: string, text?: string): string {
  let digits = rawPhone.replace(/\D/g, '')
  if (digits.length === 9 && /^[6789]/.test(digits)) digits = `34${digits}`
  const q = text ? `?text=${encodeURIComponent(text)}` : ''
  return `https://wa.me/${digits}${q}`
}
