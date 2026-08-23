# ADR-006: Acceso de invitados a través de Next.js (no directo a Supabase)

## Contexto
Los invitados no tienen cuentas de Supabase Auth. Necesitamos decidir cómo acceden a los datos.

## Opciones

### A. Invitados acceden directamente desde el browser a Supabase
- **Ventajas**: Menos carga en Next.js, queries directas
- **Desventajas**: Exponer SUPABASE_ANON_KEY en browser, RLS complejo sin auth, riesgo de seguridad
- **Seguridad**: RLS basado en token sería necesario (complejo de implementar)

### B. Invitados acceden a través de Next.js Server
- **Ventajas**: Control total de acceso, validación en servidor, sin exponer credenciales
- **Desventajas**: Más código en servidor, cada consulta pasa por Next.js
- **Seguridad**: Service role key solo en servidor, validación de token en cada request

## Decisión
**Opción B: Acceso a través de Next.js Server**

## Razonamiento
- Para <100 invitados, la carga adicional es insignificante
- Service role key nunca se expone al browser
- Server Components y Server Actions proporcionan la infraestructura perfecta
- Validación de token centralizada en un solo lugar
- RLS solo se usa para admin (defensa en profundidad)
- Menor superficie de ataque

## Consecuencias
- Todas las operaciones de invitados van por Server Components o Route Handlers
- RSVP usa Server Actions (validación server-side incluida)
- Foto upload usa Route Handler (validación MIME, tamaño, etc.)
- El browser nunca ve claves de Supabase
