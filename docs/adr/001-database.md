# ADR-001: Supabase como base de datos

## Contexto
Necesitamos una base de datos PostgreSQL para gestionar invitados, invitaciones, RSVPs, y toda la planificación de la boda. El proyecto es pequeño (<100 invitados) y necesita funcionar dentro del free tier siempre que sea posible.

## Opciones

### A. Supabase PostgreSQL
- **Ventajas**: Free tier 500MB, built-in auth, dashboard visual, migraciones, RLS
- **Desventajas**: Vendor lock-in, pausa tras inactividad en free tier
- **Coste**: €0/mes (free tier)

### B. Neon
- **Ventajas**: Serverless PostgreSQL, branching, free tier generoso
- **Desventajas**: Sin auth built-in, menos maduro que Supabase
- **Coste**: €0/mes (free tier)

### C. Vercel Postgres
- **Ventajas**: Integración nativa con Vercel
- **Desventajas**: Limitado, menos funcionalidades, coste mayor
- **Coste**: €20/mes

## Decisión
**Supabase PostgreSQL**

## Razonamiento
- Free tier suficiente para el proyecto
- Auth built-in reduce complejidad
- RLS proporciona seguridad adicional
- Dashboard facilita gestión manual si es necesario
- Comunidad activa y documentación sólida

## Consecuencias
- Dependemos de Supabase, pero el export de datos es trivial
- La pausa por inactividad del free tier no afecta (tráfico concentrado en fechas clave)
- Si superamos 500MB, upgrade a Pro ($25/mes) es fácil
