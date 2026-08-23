# Despliegue

## Entornos

| Entorno | URL | Propósito |
|---|---|---|
| Development | localhost:3000 | Desarrollo local |
| Preview | PR-specific | Revisión de Pull Requests |
| Production | Custom domain | Producción |

## Vercel

### Setup

1. Conectar repositorio GitHub a Vercel
2. Configurar variables de entorno
3. Desplegar a producción

### Variables de Entorno (Production)

```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx
ADMIN_EMAILS=email1@email.com,email2@email.com
NEXT_PUBLIC_APP_URL=https://tudominio.com
WEDDING_DATE=2027-05-01
COUPLE_NAMES=Arancha & Agonay
```

### Preview Deployments

Cada Pull Request genera automáticamente un Preview Deployment en Vercel.
Útil para probar cambios antes de mergear.

## Supabase

### Crear Proyecto

1. Crear proyecto en Supabase
2. Copiar URL y claves API
3. Ejecutar migraciones:
   ```bash
   npx supabase link --project-ref <project-ref>
   npx supabase db push
   ```

### Auth

1. Activar Email auth (Magic Link)
2. Activar Google OAuth
3. Configurar redirect URLs a la URL de producción

## Supabase Auth — Google OAuth

1. Crear proyecto en Google Cloud Console
2. Habilitar Google+ API
3. Crear OAuth 2.0 credentials
4. Configurar redirect URI: `https://xxx.supabase.co/auth/v1/callback`
5. Añadir client ID y secret en Supabase Auth → Google

## Flujo de Desarrollo

```
feature branch
      ↓
Pull Request → Vercel Preview
      ↓
Test en preview
      ↓
Merge a main
      ↓
Deploy automático a producción
```

## Base de Datos Local (opcional)

```bash
npx supabase init
npx supabase start
npx supabase db push
```
