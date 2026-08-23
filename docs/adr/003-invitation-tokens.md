# ADR-003: Arquitectura de tokens de invitación

## Contexto
Los invitados acceden a su portal personalizado mediante un QR que contiene un token. Este token actúa como credencial de acceso ligero sin requerir cuentas de usuario.

## Requisitos
- No contener información personal identificable (PII)
- No ser secuencial
- Ser criptográficamente difícil de adivinar
- Identificar únicamente una invitación
- Ser URL-safe

## Opciones

### A. UUID v4
- **Ventajas**: Estándar, 122 bits de entropía
- **Desventajas**: 36 caracteres con guiones, URL menos limpia
- **Formato**: `550e8400-e29b-41d4-a716-446655440000`

### B. NanoID
- **Ventajas**: Compacto, configurable, URL-safe
- **Desventajas**: Librería adicional
- **Formato**: `F7DW92JK5PQx3mR8vLnY2A` (22 chars)

### C. crypto.randomBytes + base64url
- **Ventajas**: Nativo en Node.js, sin dependencias, URL-safe
- **Desventajas**: Requiere encoding manual
- **Formato**: `F7DW92JK5PQx3mR8vLnY2A` (22 chars)

## Decisión
**Opción C: crypto.randomBytes(16).toString('base64url')**

## Razonamiento
- 128 bits de entropía (~3.4 × 10³⁸ combinaciones)
- 22 caracteres (compacto y legible en QR)
- Sin dependencias externas (usa crypto nativo de Node.js)
- URL-safe (base64url: A-Z, a-z, 0-9, -, _)
- Imposible de adivinar por fuerza bruta

## Consecuencias
- Los tokens se almacenan en plaintext en la DB (necesario para lookup)
- Regenerar token invalida el anterior inmediatamente
- Brute force es computacionalmente inviable
