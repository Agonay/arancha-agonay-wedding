# Base de Datos

## Configuración

- **Proveedor**: Supabase PostgreSQL
- **Plan Free**: 500MB (suficiente para <100 invitados)
- **RLS**: Habilitado, políticas solo para admin auth

## Tablas

### weddings
Configuración principal de la boda.

| Columna | Tipo | Notas |
|---|---|---|
| id | UUID | PK |
| couple_names | TEXT | "Arancha & Agonay" |
| wedding_date | DATE | "2027-05-01" |
| venue_name | TEXT | Nullable |
| venue_address | TEXT | Nullable |
| lifecycle_state | TEXT | planning, rsvp_open, pre_wedding, wedding_day, post_wedding |
| settings | JSONB | Feature flags, configuración |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | Auto-update trigger |

### invitations
Una invitación = un QR = un token seguro.

| Columna | Tipo | Notas |
|---|---|---|
| id | UUID | PK |
| wedding_id | UUID | FK → weddings |
| token | TEXT | UNIQUE, 22 chars base64url |
| status | TEXT | pending, sent, delivered, disabled |
| delivered_at | TIMESTAMPTZ | Nullable |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | Auto-update trigger |

### guests
Personas individuales.

| Columna | Tipo | Notas |
|---|---|---|
| id | UUID | PK |
| wedding_id | UUID | FK → weddings |
| first_name | TEXT | |
| last_name | TEXT | |
| display_name | TEXT | Nullable, para mostrar |
| group_id | UUID | FK → guest_groups, SET NULL |
| phone | TEXT | Nullable |
| email | TEXT | Nullable |
| notes | TEXT | Nullable |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | Auto-update trigger |

### invitation_guests
Relación N:N entre invitaciones e invitados.

| Columna | Tipo | Notas |
|---|---|---|
| invitation_id | UUID | PK, FK → invitations |
| guest_id | UUID | PK, FK → guests |
| is_primary | BOOLEAN | |
| created_at | TIMESTAMPTZ | |

### guest_groups
Grupos lógicos (Familia Novia, Amigos Madrid, etc.).

| Columna | Tipo | Notas |
|---|---|---|
| id | UUID | PK |
| wedding_id | UUID | FK → weddings |
| name | TEXT | UNIQUE por wedding |
| color | TEXT | Nullable |
| created_at | TIMESTAMPTZ | |

### rsvps
Una fila por invitado con preferencias individuales.

| Columna | Tipo | Notas |
|---|---|---|
| id | UUID | PK |
| guest_id | UUID | UNIQUE, FK → guests |
| attendance | TEXT | attending, not_attending, pending |
| plus_one_name | TEXT | Nullable |
| dietary_requirements | JSONB | {vegetarian: true, allergies: ["nuts"]} |
| dietary_notes | TEXT | Nullable |
| transport_required | BOOLEAN | Nullable |
| transport_notes | TEXT | Nullable |
| accommodation_notes | TEXT | Nullable |
| notes | TEXT | Nullable |
| submitted_at | TIMESTAMPTZ | Nullable |
| updated_at | TIMESTAMPTZ | Auto-update trigger |

## Migraciones

Las migraciones están en `/supabase/migrations/` y se aplican con:

```bash
npx supabase db push
```
