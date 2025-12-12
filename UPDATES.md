# UPDATES.md

## [v1.0.4] - 2025-12-09 - Sistema de Horarios, Vacaciones y Festivos

### Sistema de Gestión de Horarios
*   ✅ **Entidad Horario** con hash encadenado (inmutable)
*   ✅ **Configuración de horario semanal** por empleado
*   ✅ **Soporte para jornada partida** (mañana y tarde)
*   ✅ **Días libres** configurables
*   ✅ **Cálculo automático** de horas totales por día
*   ✅ **API endpoints**:
    - `POST /api/horarios/empleado/:id` - Configurar horario semanal (admin)
    - `GET /api/horarios/empleado/:id` - Obtener horario de empleado
    - `GET /api/horarios` - Listar todos los horarios (admin)
    - `GET /api/horarios/verify-integrity` - Verificar integridad (admin)

### Sistema de Festivos
*   ✅ **Entidad Festivo** con hash encadenado (inmutable)
*   ✅ **Tipos de festivos**: Nacional, Autonómico, Local
*   ✅ **Integración con cálculo de vacaciones** (excluye festivos)
*   ✅ **API endpoints**:
    - `POST /api/festivos` - Crear festivo (admin)
    - `GET /api/festivos?year=2025` - Listar festivos por año
    - `GET /api/festivos/verify-integrity` - Verificar integridad (admin)

### Sistema de Vacaciones
*   ✅ **Entidad Vacacion** con hash encadenado (inmutable)
*   ✅ **Solicitud de vacaciones** por empleados
*   ✅ **Aprobación/Rechazo** por administradores
*   ✅ **Cálculo automático de días laborables** (excluye fines de semana y festivos)
*   ✅ **Control de días disponibles** por empleado (22 días por defecto)
*   ✅ **Estados**: Pendiente, Aprobada, Rechazada, Cancelada
*   ✅ **API endpoints**:
    - `POST /api/vacaciones/solicitar` - Solicitar vacaciones
    - `PATCH /api/vacaciones/:id/aprobar` - Aprobar solicitud (admin)
    - `PATCH /api/vacaciones/:id/rechazar` - Rechazar solicitud (admin)
    - `GET /api/vacaciones/empleado/:id` - Ver vacaciones de empleado
    - `GET /api/vacaciones/pendientes` - Ver solicitudes pendientes (admin)
    - `GET /api/vacaciones/verify-integrity` - Verificar integridad (admin)

### Actualización Entidad Empleado
*   ✅ Campo `dias_vacaciones_anuales` (int, default: 22)
*   ✅ Campo `dias_vacaciones_disponibles` (decimal, default: 22)
*   ✅ Descuento automático al aprobar vacaciones

### Seguridad e Inmutabilidad
*   ✅ **Hash SHA-256** en cada registro de horario, festivo y vacación
*   ✅ **Encadenamiento de hashes** (blockchain-like)
*   ✅ **Verificación de integridad** para cada módulo
*   ✅ **Cumplimiento legal** con registros inalterables

### Módulos Creados
*   ✅ HorariosModule (service, controller, entity)
*   ✅ FestivosModule (service, controller, entity)
*   ✅ VacacionesModule (service, controller, entity)

---

## [v1.0.3] - 2025-12-02 - Sistema de Compras Mejorado + UI

### Sistema de Compras Rediseñado
*   ✅ **Búsqueda de cliente por código o nombre** en el modal de nueva compra
*   ✅ **Carrito de compras** con lista de artículos, cantidades y subtotales
*   ✅ **Escaneo de código de barras** para agregar artículos rápidamente
*   ✅ **Campo de descuento** en euros aplicable al total
*   ✅ **Opción VARIOS** para compras sin artículos específicos
*   ✅ **Generación de tickets** con vista previa e impresión
*   ✅ **Cálculo automático** de total en backend cuando hay artículos

### Modal de Compra Rápida en Clientes
*   ✅ Rediseñado con dos paneles (artículos + carrito)
*   ✅ Escaneo de código de barras
*   ✅ Lista de artículos disponibles
*   ✅ Carrito con subtotal, descuento y total
*   ✅ Opción VARIOS integrada

### Mejoras de UI
*   ✅ **Paleta de colores verde** basada en el logotipo de la marca
*   ✅ Colores centralizados en `tailwind.config.js` y `src/index.css`
*   ✅ Cambio de etiqueta "Monto" por "Cantidad" en toda la app
*   ✅ Versión actualizada a 1.0.3 en footer

### Backend
*   ✅ DTO `CreateCompraDto.total` ahora es opcional (se calcula automáticamente)
*   ✅ Descripción "VARIOS" por defecto cuando `es_varios=true`
*   ✅ Tests añadidos para compras con VARIOS y múltiples artículos

---

## [v1.0.2] - 2025-12-02 - Migración de Datos Legacy

### Migración de Base de Datos
*   ✅ Script de migración desde MySQL (tiendaNew.sql) a PostgreSQL (Neon)
*   ✅ Migración de 6 empleados (tabla trabajadores → empleados)
*   ✅ Migración de 420 clientes con relación empleado-cliente
*   ✅ Campo `direccion` añadido a la entidad Cliente (opcional)
*   ✅ Mapeo de campos:
    - `cod_user` → `id_empleado`
    - `name` → `nombre` (empleados)
    - `cod_cliente-cod_user` → `num_cliente` (clave única)
    - `nombre_c + apellidos_c` → `nombre` (clientes)
    - `telefono_c` → `telefono`
    - `direccion_c` → `direccion`
    - `cod_user` → `empleado_id` (FK)
*   ✅ Campos omitidos: `debe`, `pass`, `email_c`, `DNI_NIF`, `fecha_creación`, `ult_fecha_pago`

### Distribución de Clientes por Empleado
- David: 73 clientes
- fe: 53 clientes
- Bego: 147 clientes
- Jimenez: 37 clientes
- Yaiza: 58 clientes
- BegoJi: 52 clientes

---

## [v1.0.1] - 2025-12-02 - Frontend Completo + Tests

### Frontend React
*   ✅ Dashboard mejorado con gráficos interactivos (Recharts)
    - Tarjetas de estadísticas (Ventas, Pagos, Devoluciones, Balance)
    - Gráfico de barras de transacciones
    - Gráfico circular de distribución de montos
    - Panel de Top Deudores
    - Panel de Artículos con Stock Bajo
    - Panel de Compras Recientes
*   ✅ Módulo de Clientes (CRUD completo + búsqueda + balance)
*   ✅ Módulo de Artículos (CRUD + búsqueda + gestión de stock)
*   ✅ Módulo de Compras (con artículos y modo "VARIOS")
*   ✅ Módulo de Empleados (CRUD completo)
*   ✅ Módulo de Pagos (registro y listado)
*   ✅ Módulo de Devoluciones (registro y listado)
*   ✅ Módulo de Cierre de Mes (solo admin)
*   ✅ Footer con versión y copyright

### Tests Unitarios (133 tests)
*   ✅ AppController (2 tests)
*   ✅ ClientesService + Controller (13 tests)
*   ✅ ArticulosService + Controller (19 tests)
*   ✅ ComprasService + Controller (15 tests)
*   ✅ EmpleadosService + Controller (16 tests)
*   ✅ PagosService + Controller (12 tests)
*   ✅ DevolucionesService + Controller (12 tests)
*   ✅ CierreMesService + Controller (12 tests)
*   ✅ BackupService + Controller (10 tests)

### Tests E2E
*   ✅ Clientes E2E
*   ✅ Artículos E2E
*   ✅ Compras E2E
*   ✅ Empleados E2E

---

## [v1.0.0] - 2025-11-28 - Backend Completo Implementado
*   ✅ Configuración de dependencias (TypeORM, PostgreSQL, Passport, JWT, class-validator)
*   ✅ Estructura de base de datos con 9 entidades
*   ✅ Sistema de autenticación con Google OAuth 2.0
*   ✅ Sistema de autorización con roles (Admin/Employee)
*   ✅ Módulo de Empleados (CRUD completo + búsqueda)
*   ✅ Módulo de Clientes (CRUD + cálculo de balance + búsqueda)
*   ✅ Módulo de Artículos (CRUD + búsqueda por código de barras)
*   ✅ Módulo de Compras (con soporte para artículos y "VARIOS")
*   ✅ Módulo de Pagos (registro simple)
*   ✅ Módulo de Devoluciones (registro simple)
*   ✅ Módulo de Cierre de Mes (con analytics y estadísticas)
*   ✅ Módulo de Backup (exportación SQL manual)
*   ✅ Validación global con DTOs
*   ✅ CORS configurado
*   ✅ Guards de seguridad (JWT + Roles)
*   ✅ Documentación actualizada (GEMINI.md, README.md)

---

## [v0.0.1] - Project Initialization
*   Created documentation files.
*   Initialized NestJS project.
