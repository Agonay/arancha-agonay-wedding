# Arquitectura — Arancha & Agonay Wedding App

## Vista General

```
                         GUESTS
                            │
                      QR / Browser
                            │
                            ▼
                    Next.js (Vercel)
                            │
              ┌─────────────┼─────────────┐
              ▼             ▼             ▼
         Supabase DB   Supabase Auth   Google Drive
            │                             │
       Invitations                      Photos
       Guests                           Videos
       RSVPs                        Voice messages
       Tables
       Budget
       Vendors
       Tasks
```

## Stack Tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript |
| Estilos | Tailwind CSS v4, shadcn/ui |
| Hosting | Vercel |
| Base de datos | Supabase PostgreSQL |
| Auth Admin | Supabase Auth (Magic Link + Google OAuth) |
| Auth Invitados | Token seguro en URL + cookie |
| Almacén fotos | Google Drive (Service Account) |
| Iconos | Lucide |

## Estructura del Proyecto

```
/src
  /app
    /(guest)          → Portal de invitados
      /i/[token]      → Página de invitación
    /(admin)          → Panel de administración
      /login          → Login
      /dashboard      → Dashboard
  /components
    /guest            → Componentes portal invitados
    /admin            → Componentes panel admin
    /shared           → Componentes compartidos
    /ui               → Componentes base (shadcn)
  /features           → Lógica de negocio por dominio
  /lib
    /supabase         → Clientes Supabase
    /google           → Cliente Google Drive
    /tokens           → Generación de tokens
  /types              → Tipos TypeScript
  /services           → Servicios externos
  /hooks              → React hooks

/supabase/migrations  → Migraciones de base de datos
/docs                 → Documentación
/tests                → Tests
```

## Separación Guest/Admin

### Portal de Invitados
- Sin autenticación tradicional
- Acceso mediante token en URL
- Diseño elegante, mobile-first
- Navegación mínima, scroll vertical

### Panel de Administración
- Autenticación Supabase Auth
- Sidebar con navegación completa
- Diseño funcional, desktop-first
- Tablas, filtros, formularios

## Seguridad

- Invitados: acceso solo a través de Next.js server (nunca directo a Supabase)
- Admin: Supabase Auth + lista de emails permitidos
- RLS habilitado pero solo para admin (invitados vía service role en servidor)
- Tokens de invitación: 128-bit random, base64url
- `noindex, nofollow` en todas las páginas

## Decisiones Clave

- **No ORM**: Supabase JS client query builder es suficiente para <100 guests
- **Guests sin Supabase Auth**: Operaciones van por Next.js server con service role key
- **Google Drive Service Account**: Uploads seguros sin exponer credenciales al browser
- **Server Actions**: Para mutaciones de formularios (RSVP, CRUD admin)
- **Route Handlers**: Para uploads de archivos y operaciones externas
