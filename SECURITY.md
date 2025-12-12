# 🔒 Documentación de Seguridad

## Sistema de Autenticación y Seguridad

Este documento describe las medidas de seguridad implementadas en el sistema.

## 🛡️ Características de Seguridad

### 1. Autenticación Google OAuth 2.0

**Implementación:**
- ✅ Solo usuarios con cuentas de Google pueden intentar acceder
- ✅ Autenticación mediante OAuth 2.0 (estándar de la industria)
- ✅ No se almacenan contraseñas en la base de datos

**Flujo:**
```
Usuario → Google OAuth → Validación Email → Generación JWT → Acceso
```

### 2. Lista Blanca de Emails Autorizados

**Configuración en `.env`:**
```env
AUTHORIZED_EMAILS=email1@gmail.com,email2@gmail.com,admin@gmail.com
ADMIN_EMAILS=admin@gmail.com
```

**Validación:**
- ❌ Si el email NO está en `AUTHORIZED_EMAILS` → **Acceso Denegado** (403 Forbidden)
- ✅ Si el email está en `AUTHORIZED_EMAILS` → Acceso permitido
- 👑 Si el email está en `ADMIN_EMAILS` → Rol de Administrador

**Código de Validación:**
```typescript
// src/auth/auth.service.ts
const authorizedEmails = this.configService
  .get('AUTHORIZED_EMAILS')
  .split(',')
  .map((e: string) => e.trim());

if (!authorizedEmails.includes(email)) {
  throw new ForbiddenException('Email not authorized');
}
```

### 3. Tokens JWT con Expiración

**Configuración:**
- ⏱️ **Duración del token:** 2 horas
- 🔄 **Auto-logout:** 1 minuto antes de expiración
- 📝 **Payload del token:**
  ```json
  {
    "email": "user@example.com",
    "sub": "user-id",
    "role": "admin|employee",
    "exp": 1234567890
  }
  ```

**Implementación:**
```typescript
// src/auth/auth.module.ts
JwtModule.registerAsync({
  useFactory: async (configService: ConfigService) => ({
    secret: configService.get('JWT_SECRET'),
    signOptions: { expiresIn: '2h' }, // Token expira en 2 horas
  }),
})
```

### 4. Blacklist de Tokens (Logout Seguro)

**Funcionamiento:**
1. Al hacer logout, el token se añade a una blacklist en la base de datos
2. Cada petición verifica si el token está en la blacklist
3. Tokens blacklisted son rechazados automáticamente
4. Limpieza automática de tokens expirados

**Tabla `token_blacklist`:**
```sql
CREATE TABLE token_blacklist (
  id UUID PRIMARY KEY,
  token TEXT NOT NULL,
  user_id UUID NOT NULL,
  reason VARCHAR(255),
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Verificación en cada petición:**
```typescript
// src/auth/strategies/jwt.strategy.ts
async validate(req: any, payload: any) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  // Verificar blacklist
  const isBlacklisted = await this.authService.isTokenBlacklisted(token);
  if (isBlacklisted) {
    throw new UnauthorizedException('Token inválido o sesión cerrada');
  }
  
  return user;
}
```

### 5. Control de Acceso Basado en Roles (RBAC)

**Roles:**
- 👤 **EMPLOYEE:** Acceso limitado a sus propios datos
- 👑 **ADMIN:** Acceso completo a todos los datos y funciones administrativas

**Decoradores de Protección:**
```typescript
@Roles(UserRole.ADMIN)  // Solo admin
@UseGuards(JwtAuthGuard, RolesGuard)
async aprobarVacaciones() { ... }
```

**Rutas Protegidas:**
- ✅ Todas las rutas requieren autenticación JWT por defecto
- ✅ Rutas administrativas requieren rol ADMIN
- ✅ Empleados solo pueden ver/modificar sus propios datos

### 6. Gestión de Sesión en Frontend

**Auto-logout:**
```typescript
// client/src/store/authStore.ts
setAuth: (user, token, expiresIn) => {
  const expiryTime = Date.now() + expiresIn * 1000;
  
  // Auto-logout 1 minuto antes de expiración
  const timeUntilExpiry = expiresIn * 1000 - 60000;
  setTimeout(() => {
    if (state.isTokenExpired()) {
      state.logout();
    }
  }, timeUntilExpiry);
}
```

**Verificación continua:**
- El frontend verifica la expiración del token en cada acción
- Si el token expiró, redirige automáticamente al login
- El token se almacena de forma segura en localStorage

### 7. Protección de Endpoints

**Guards Aplicados:**
```typescript
// Global JWT Guard
@UseGuards(JwtAuthGuard)
export class AppController { ... }

// Rutas públicas (solo login)
@Public()
@Get('auth/google')
async googleAuth() { ... }
```

**Endpoints Protegidos:**
- `/auth/me` - Requiere JWT válido
- `/auth/logout` - Requiere JWT válido
- `/vacaciones/*` - Requiere JWT válido
- `/vacaciones/:id/aprobar` - Requiere JWT + Rol ADMIN
- `/empleados/*` - Requiere JWT + Rol ADMIN
- Todos los demás endpoints requieren autenticación

## 🧪 Tests de Seguridad

### Tests Implementados:

1. **Validación de Email:**
   - ✅ Rechaza emails no autorizados
   - ✅ Acepta emails autorizados
   - ✅ Asigna rol correcto según configuración

2. **Gestión de Tokens:**
   - ✅ Genera tokens con expiración correcta
   - ✅ Añade tokens a blacklist en logout
   - ✅ Detecta tokens blacklisted
   - ✅ Rechaza tokens inválidos

3. **Sesión y Validación:**
   - ✅ Valida usuarios por ID
   - ✅ Rechaza usuarios inválidos
   - ✅ Maneja errores de logout

4. **Google OAuth:**
   - ✅ Crea usuarios nuevos correctamente
   - ✅ Actualiza google_id en usuarios existentes
   - ✅ Redirige con token después de autenticación

**Ejecutar tests:**
```bash
npm test -- auth.service.spec.ts
npm test -- auth.controller.spec.ts
```

## 🔐 Configuración de Seguridad

### Variables de Entorno Requeridas:

```env
# JWT
JWT_SECRET=tu-secreto-super-seguro-de-al-menos-32-caracteres

# Google OAuth
GOOGLE_CLIENT_ID=tu-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=tu-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback

# Emails Autorizados (separados por comas)
AUTHORIZED_EMAILS=email1@gmail.com,email2@gmail.com,admin@gmail.com

# Emails de Administradores (separados por comas)
ADMIN_EMAILS=admin@gmail.com

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

## 🚨 Mejores Prácticas

### Para Administradores:

1. **Gestión de Emails Autorizados:**
   - Mantener actualizada la lista en `.env`
   - Remover emails de empleados que ya no trabajan
   - Revisar periódicamente los accesos

2. **Monitoreo:**
   - Revisar logs de autenticación fallida
   - Monitorear tokens blacklisted
   - Auditar cambios en roles de usuario

3. **Seguridad del Servidor:**
   - Mantener `JWT_SECRET` seguro y complejo
   - No compartir credenciales de Google OAuth
   - Usar HTTPS en producción

### Para Desarrolladores:

1. **Nunca:**
   - ❌ Hardcodear emails autorizados
   - ❌ Exponer el JWT_SECRET
   - ❌ Deshabilitar guards de seguridad
   - ❌ Permitir acceso sin autenticación

2. **Siempre:**
   - ✅ Usar decoradores `@Roles()` para rutas admin
   - ✅ Validar permisos en el backend
   - ✅ Verificar tokens en cada petición
   - ✅ Implementar tests de seguridad

## 📊 Flujo de Autenticación Completo

```
1. Usuario hace clic en "Iniciar sesión con Google"
   ↓
2. Redirige a Google OAuth
   ↓
3. Usuario autoriza la aplicación
   ↓
4. Google redirige a /api/auth/google/callback
   ↓
5. Backend valida email en AUTHORIZED_EMAILS
   ├─ NO autorizado → 403 Forbidden
   └─ Autorizado → Continúa
   ↓
6. Backend genera JWT con expiración de 2h
   ↓
7. Redirige al frontend con token
   ↓
8. Frontend almacena token y configura auto-logout
   ↓
9. Usuario accede a la aplicación
   ↓
10. Cada petición incluye JWT en header
    ↓
11. Backend valida:
    - Token no expirado
    - Token no en blacklist
    - Usuario existe
    - Permisos correctos
    ↓
12. Usuario hace logout
    ↓
13. Token se añade a blacklist
    ↓
14. Redirige a login
```

## 🔄 Mantenimiento de Seguridad

### Limpieza Automática:

El sistema limpia automáticamente tokens expirados de la blacklist:

```typescript
private async cleanExpiredTokens(): Promise<void> {
  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);
  
  await this.tokenBlacklistRepository.delete({
    expires_at: LessThan(oneDayAgo),
  });
}
```

### Auditoría:

Revisar periódicamente:
- Tabla `token_blacklist` para patrones sospechosos
- Logs de autenticación fallida
- Usuarios con múltiples sesiones cerradas

## 📞 Soporte

Para reportar problemas de seguridad:
- 🔒 No crear issues públicos
- 📧 Contactar directamente al administrador
- 🚨 Reportar inmediatamente accesos no autorizados
