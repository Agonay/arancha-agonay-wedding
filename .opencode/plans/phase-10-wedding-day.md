# Phase 10 — Wedding-Day Mode Implementation Plan

**Date:** 2026-09-01
**Status:** Ready to implement

## Approach: Persistent Token + NFC

- NFC tags all encode: `https://aranzazuagonay.es/acceder`
- On first visit to `/i/[token]`, store token in `localStorage` as `wedding_guest_token`
- `/acceder` checks localStorage → redirects to stored token or falls back to name search
- "Confirmar llegada" button on invitation page marks check-in via `/api/checkin`
- Admin dashboard at `/admin/wedding-day` shows live attendance + incidents

## Migration: 013_wedding_day.sql
- `guests.checked_in_at TIMESTAMPTZ` (nullable)
- `incidents` table (title, severity, description, resolved_at)
- RLS: admins full access, anon blocked
- Realtime enabled for incidents

## Files to Create
1. `supabase/migrations/013_wedding_day.sql`
2. `src/app/(guest)/acceder/page.tsx`
3. `src/app/api/checkin/route.ts`
4. `src/app/(admin)/admin/wedding-day/page.tsx`
5. `src/components/guest/CheckInButton.tsx`
6. `src/components/admin/wedding-day/AttendanceList.tsx`
7. `src/components/admin/wedding-day/IncidentBoard.tsx`
8. `src/features/wedding-day/actions.ts`

## Files to Modify
1. `src/app/(guest)/i/[token]/page.tsx` — add localStorage store + CheckInButton
2. `src/components/admin/AdminSidebar.tsx` — add "Día Boda" link
3. `src/lib/config.ts` — add wedding_day_mode helpers
