<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# WeddingApp — "Wedding Operating System" (Aránzazu & Agonay)

Full wedding lifecycle app: planning → guest management → invitations → RSVP → logistics → seating → wedding day → post-wedding. Wedding date: **May 1, 2027**. UI entirely in **Spanish**.

## MANDATORY PROTOCOL FOR EVERY SESSION

1. **Read this file first.** It is the single source of truth for plan status.
2. **Update this file at the end of every work session** (and after completing any roadmap item):
   - Move items between "Current Status", mark checklist boxes `[x]`, add newly discovered to-dos.
   - Record any new technical gotchas under "Gotchas & Lessons".
   - Update the "Last updated" line at the bottom.
3. **Commit AGENTS.md updates together with your work** so the tree stays clean.
4. The user speaks English in chat but wants all app-facing text in Spanish.

## HARD RULES

- **This repo is PUBLIC on GitHub. NEVER commit secrets** — no passwords, no JWTs, no API keys in code, docs, or commits. Secrets live only in `.env.local` (gitignored) and Vercel env vars.
- Never commit `.env.local`.
- Do not commit unless the work session warrants it; push to `master` when committing (deploys trigger Vercel).
- Git identity must stay: `user.name=Agonay`, `user.email=agrosocas@gmail.com`. Vercel blocks deploys whose commit author email doesn't match a GitHub account contributor (this was fixed once by rewriting history — don't break it again).

## Tech Stack

- Next.js 16.3.2 (App Router, Turbopack), React 19, TypeScript
- Tailwind CSS v4 (design system: Playfair Display + Inter fonts, cream `#FAF8F5` / sage palette)
- Supabase PostgreSQL (project ref: `ofuhkvazuhribgwdjidl`)
- Hosting: Vercel (Hobby plan). Repo: https://github.com/Agonay/arancha-agonay-wedding (public, branch `master`)
- Domain: **aranzazuagonay.es**, registrar Hostinger (DNS records managed there; nameservers NOT changed)

## Access & Credentials Pointers (values live outside the repo)

- `.env.local`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_EMAILS`, `NEXT_PUBLIC_APP_URL`, `WEDDING_DATE=2027-05-01`, `COUPLE_NAMES`
- Admin login: `agrosocas@gmail.com` + password stored locally by user (set via Supabase admin API). Auth method: **email+password** (magic links were abandoned due to Supabase email rate limits).
- Supabase CLI needs `$env:SUPABASE_ACCESS_TOKEN='...'` (personal token, user provides).
- Same env vars must exist in Vercel project settings (Production), with `NEXT_PUBLIC_APP_URL=https://aranzazuagonay.es`.

## Architecture Map

- `src/app/(admin)/admin/**` — admin panel: `dashboard`, `guests`, `guests/[id]`, `invitations`, `rsvps`; layout enforces session + `ADMIN_EMAILS` allowlist.
- `src/app/admin/login/page.tsx` — login (deliberately OUTSIDE `(admin)` route group to avoid redirect loop).
- `src/app/admin/auth/callback/page.tsx` — PKCE callback (kept though currently unused).
- `src/app/(guest)/i/[token]/page.tsx` + `rsvp/page.tsx` — guest invitation & RSVP flow.
- `src/features/{guests,invitations,rsvp}/actions.ts` — server actions (`'use server'`). Constants live in `src/lib/config.ts` (`RSVP_DEADLINE = 2027-04-01T23:59:59`, `isRsvpOpen()`).
- `src/lib/tokens/index.ts` — invitation token gen (16 bytes base64url ≈22 chars) + format validation.
- `src/lib/supabase/{server,browser,middleware}.ts` — untyped clients (typed Database was removed to fix type errors).
- `supabase/migrations/001_initial_schema.sql` — weddings, invitations, guests, invitation_guests, guest_groups, rsvps + RLS.
- `supabase/migrations/002_rsvp_notifications.sql` — adds `rsvps.admin_notified boolean default false`.
- `scripts/seed-guests.js` — seeded 93 real guests + groups + invitations into live DB.

## Roadmap & Status

### ✅ Completed

- [x] Phase 1 — Foundation: scaffold, design system, Supabase clients, schema migration 001, proxy.ts, docs/ADRs
- [x] Phase 2 — Invitation MVP: guest CRUD, invitations with tokens + QR codes (QR via free API `api.qrserver.com`, colors fg=`2D2D2D` bg=`FAF8F5`), regenerate/mark-delivered/delete, personalized landing `/i/[token]`
- [x] Phase 3 — RSVP system: per-guest form, deadline enforcement, admin overview with stats, dashboard stat cards
- [x] Phase 4 — Guest polish: detail/edit page `/admin/guests/[id]`, CSV export (UTF-8 BOM)
- [x] RSVP editing: admins edit RSVPs on guest page; guests re-edit via "Modificar respuesta" ("¡Respuesta actualizada!" confirmation); blue notification banner on dashboard + pulsing dots on /admin/rsvps + "Marcar como revisados"
- [x] Name fix: Arancha → **Aránzazu** everywhere (DB record + all components)
- [x] GitHub: repo made PUBLIC (Hobby plan blocks private-repo collaborators); commit author rewritten to agrosocas@gmail.com (Vercel deploy-block issue resolved)
- [x] Phase 5 — Logistics: migration `003_logistics.sql` (`venues`, `schedule_events`, `transport_options`, `accommodations` + `rsvps.transport_option_id`); `/admin/logistics` (Lugares / Horario del día / Alojamiento CRUD); `/admin/transport` (bus CRUD + assign confirmed guests with `transport_required=true` to buses via dropdown); "Logística" sidebar entry; guest-facing "El gran día" timeline on `/i/[token]` (public events only, venue + Google Maps link, private events filtered server-side). Schedule uses DATE + TIME columns (not timestamptz) by design.
- [x] Phase 6 — Seating chart ("Mesas"): migration `004_seating.sql` (`tables` with UNIQUE(wedding_id,name) + capacity, `guests.table_id` FK ON DELETE SET NULL); `/admin/tables` with stat cards, "Confirmados sin mesa" pool panel, table cards with capacity bars (amber ≥80%, red overflow) and inline assignment dropdowns; guest-facing "Tu mesa" card on `/i/[token]` (only attending guests with assigned table). Plus-ones count toward capacity automatically. Visual drag-and-drop floor plan deferred to Phase 12 polish. FIXED along the way: long-standing bug where RSVP embeds on `/i/[token]`, `/i/[token]/rsvp`, GuestTable CSV export and GuestEditForm prefill read `rsvps[0]` but PostgREST returns to-one objects — all normalized via shared `firstOf()` in `src/lib/embed.ts`.
- [x] Phase 7 — Budget tracker: migration `005_budget.sql` (`budget_categories` UNIQUE(wedding_id,name), `budget_items` with estimated/actual/paid NUMERIC(12,2) + CHECK >= 0, `category_id` ON DELETE SET NULL, due_date); `/admin/budget` with stat cards (Presupuestado / Contratado / Pagado / Pendiente de pago; pendiente = Σ max((actual ?? estimated) − paid, 0)), category chip manager, category filter, items grouped by category with per-category progress bars + over-budget warnings, per-item amounts + pending badges + overdue due dates (red); item modal accepts Spanish decimal commas via `parseAmount()` in `src/lib/money.ts`. "Pagado" doubles as deposit (seña) tracking.
- [x] Phase 7b — Per-guest pricing ("por comensal") + IVA: migration `006_budget_pricing.sql` adds `pricing_mode` ('total'|'per_guest'), `unit_price`, `guest_count`, `iva_rate` (0–100), `units_with_iva`. Per-guest items compute estimated=actual server-side in `sanitizeItem()` via shared math in `src/lib/budget.ts` (`computeItemTotal`: unit × count, with units_with_iva units taxed at iva_rate, rest sin IVA); "Cantidad" input accepts absolute number OR % of confirmed guests (`parseQuantity("50%", 120) → 60`; % capped at 100), pre-filled with live confirmed count (attending RSVPs + plus-ones, computed on the page). Modal shows live breakdown ("X base + Y IVA = Z"); existing per-guest items can't switch back to manual mode (amounts are derived). Row chips show "95 €/comensal × 120 +IVA 10%".

### 🔶 In Progress — Deployment

- [ ] DNS: Hostinger zone has A `@` → `76.76.21.21` and CNAME `www` → `e3ee19e674706c26.vercel-dns-017.com`; domain was brand-new, awaiting propagation (check with `nslookup aranzazuagonay.es 8.8.8.8`). Vercel shows both domains until propagation completes, then auto-validates.
- [ ] Vercel: confirm production build/deploy succeeds after DNS validates; verify env vars set (incl. `NEXT_PUBLIC_APP_URL=https://aranzazuagonay.es`)
- [ ] Supabase Auth → URL Configuration: add redirects `https://aranzazuagonay.es/admin/auth/callback` and `/admin/dashboard` once domain resolves
- [ ] Verify admin login works on production

### ⬜ Pending (roadmap order)

- [ ] Data cleanup: replace placeholder guests "Invitado Idaero 1/2" with real names (ask user)
- [ ] Phase 7 — Budget tracker
- [ ] Phase 8 — Vendor CRM
- [ ] Phase 9 — Communications (email templates, reminders)
- [ ] Phase 10 — Wedding-day mode (run-of-show, check-in via QR scan)
- [ ] Phase 11 — Post-wedding (thank-you tracking, photo sharing)
- [ ] Phase 12 — Polish: PWA/offline, performance, accessibility

## Gotchas & Lessons (do not relearn these)

- **Next.js 16**: `middleware.ts` must be `proxy.ts` exporting function named `proxy`.
- `'use server'` files may ONLY export async functions — constants go to `src/lib/config.ts`.
- Cannot set cookies inside Server Components (removed cookie-set from `/i/[token]` page).
- Supabase SQL: `uuid_generate_v4()` requires `extensions.` schema prefix (`extensions.uuid_generate_v4()`) in triggers/defaults.
- Admin sidebar needs `'use client'`.
- Magic link auth hit rate limits → switched to email+password set via service-role admin API.
- Dev server background start (PowerShell): `Start-Process -FilePath "cmd" -ArgumentList "/c", "cd C:\Users\agros\Desktop\Projects\WeddingApp && npm run dev" -WindowStyle Hidden`, then verify with `netstat -ano | Select-String "3000"`.
- Restart dev: `taskkill /F /IM node.exe` then start again (kills ALL node processes).
- Build warning about package-lock.json outside repo root is benign (turbopack.root note).
- Supabase untyped client: nested to-one joins (`venues (...)`, `guests (...)`) are TYPED as arrays by TS even though runtime returns an object — cast with `as unknown as { ... } | null` when mapping.
- Wedding-day schedule deliberately uses `event_date DATE` + `start_time/end_time TIME`, NOT timestamptz — avoids Madrid-vs-UTC conversion bugs between admin `<input type="time">` and guest display.
- SQL inserts via `UNION ALL` of literals need explicit casts (`'2027-05-01'::date`, `'17:00'::time`, `'...'::uuid`) or Postgres resolves them as text and fails.
- Pre-existing lint baseline is NOT clean (~19 errors in old files: dashboard/rsvps/login/RsvpForm/proxy.ts) — only ensure NEW code adds no errors.
- **PostgREST to-one embeds return OBJECTS, not arrays**: any FK column with a UNIQUE constraint (e.g. `rsvps.guest_id`, `guests.table_id`) makes the nested embed a single object, even though supabase-js types it as an array. Always normalize with `firstOf()` from `src/lib/embed.ts`. This silently broke RSVP state detection on `/i/[token]`, RSVP prefill on `/i/[token]/rsvp` + post-deadline re-entry, GuestTable CSV export (exported 0 rows) and GuestEditForm prefill until Phase 6.

## Data State

93 guests seeded across 10 groups: Familia Arancha 17, Extras Familia 10, Amigos Alcazar 12, Amigos Extra 5, Labo 11, Otros 15, Familia Agonay 7, Amigos Gym 6, Utek 7, Idaero 2 (placeholders pending real names). Each guest has individual token; duplicate-name collisions resolved with suffixes (Mama A, Jorge U, Laura G…). A single `weddings` row is auto-created on first dashboard visit (`ensureWedding`).

Logistics tables live (`003`): first real entries created via UI — venue "Finca La Losilla", transport "Bus", event "Coctel" (public). Phase-5 smoke-test rows were inserted and fully removed.

Seating tables (`004`) exist but empty — no tables/guests assigned yet (2 attending RSVPs so far).

Budget tables (`005`/`006`) live. User's first real items: "Suite Intur" (348 €), "Vestido Novia" (2.000 €), "Traje Novio" (500 €), "Alianzas" (500 €) — all pricing_mode 'total'. No categories yet.

---
*Last updated: 2026-08-24 — Phase 7b per-guest pricing + IVA complete; deployment still awaiting DNS propagation. Any session that finishes work MUST refresh the Status/Checklist sections above.*
