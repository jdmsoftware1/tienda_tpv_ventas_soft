# FIX.md

## [2025-12-09] - Sistema de Horarios, Vacaciones y Festivos
*   ✅ Añadidos campos `dias_vacaciones_anuales` y `dias_vacaciones_disponibles` a entidad Empleado
*   ✅ Configurado hash encadenado en Horario, Festivo y Vacacion para inmutabilidad
*   ✅ Implementado cálculo de días laborables excluyendo fines de semana y festivos
*   ✅ Integrado FestivosService en VacacionesModule para validación de festivos
*   ✅ Añadidos nuevos módulos (Horarios, Festivos, Vacaciones) a AppModule

## [2025-12-09] - Sistema de Fichajes con Google Authenticator
*   ✅ Añadidos campos `totp_secret` y `totp_enabled` a entidad Empleado
*   ✅ Implementado hash encadenado en Fichaje para inmutabilidad
*   ✅ Configurado TOTP con otplib y generación de QR con qrcode
*   ✅ Añadido botón de Fichaje en menú lateral para todos los usuarios
*   ✅ Cambiado icono de Registros Empleados a ClipboardList para evitar conflicto
*   ✅ Añadida gestión de TOTP en página de Empleados (modal QR para admin)
*   ✅ Creadas entidades preparatorias para Verifactu y Facturae

## [2025-11-28] - Correcciones Durante Implementación
*   ✅ Ajustada versión de `@nestjs/typeorm` para compatibilidad con NestJS 11
*   ✅ Agregado `@nestjs/mapped-types` para DTOs
*   ✅ Corregido uso de `IsNull()` en lugar de `null` para consultas TypeORM
*   ✅ Configurado `import type` para Response de Express (isolatedModules)
*   ✅ Instalación con `--legacy-peer-deps` para resolver conflictos de dependencias

## [Date] - Initial Setup
*   No fixes yet.
