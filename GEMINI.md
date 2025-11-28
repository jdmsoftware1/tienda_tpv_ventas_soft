# GEMINI.md - Project Context & Requirements

## Project Overview
Sistema de gestión de tienda (POS) simple, hermoso y escalable.
Construido con NestJS (Backend completo).
Desplegable en Render (Serverless).

## Core Features Implementadas

### 1. Entidades (TypeORM)
*   **Users**: Autenticación con Google OAuth, roles (Admin/Employee)
*   **Clientes (Clients)**:
    *   Datos: Teléfono, Número de Cliente (Manual), Nombre
    *   Balance calculado: Compras - Pagos - Devoluciones
    *   Asociados a empleados
*   **Empleados (Employees)**:
    *   Datos: ID_Empleado (único), Nombre
    *   Relación: Un empleado tiene muchos clientes
*   **Articulos (Articles)**:
    *   Datos: Código de Barras (único), Nombre, Precio Compra, Precio Venta, Cantidad
    *   Soporte para lectura de código de barras
*   **Compras (Purchases)**:
    *   Puede incluir artículos específicos O "VARIOS" (sin tracking de stock)
    *   Relación con CompraArticulo para detalles
    *   Actualiza stock automáticamente
*   **Pagos (Payments)**:
    *   Registro simple de pagos de clientes
    *   Reduce la deuda del cliente
*   **Devoluciones (Returns)**:
    *   Asociadas a cliente
    *   Descuenta automáticamente del balance
*   **Cierre de Mes (Monthly Close)**:
    *   Trigger manual con rango de fechas personalizable
    *   Snapshots de totales: Ventas, Pagos, Devoluciones
    *   Filtrable por rango de fechas
    *   Analytics y estadísticas

### 2. Módulos Backend Implementados
*   **AuthModule**: Google OAuth, JWT, Guards (JwtAuthGuard, RolesGuard)
*   **EmpleadosModule**: CRUD completo, búsqueda
*   **ClientesModule**: CRUD, cálculo de balance, búsqueda
*   **ArticulosModule**: CRUD, búsqueda por código de barras, gestión de stock
*   **ComprasModule**: Creación con transacciones, soporte para artículos y "VARIOS"
*   **PagosModule**: Registro de pagos
*   **DevolucionesModule**: Registro de devoluciones
*   **CierreMesModule**: Cierre de mes, analytics, estadísticas del mes actual
*   **BackupModule**: Backup manual de base de datos en SQL

### 3. Seguridad Implementada
*   **Google OAuth 2.0**: Autenticación completa
*   **JWT**: Tokens con expiración de 7 días
*   **Guards**:
    *   JwtAuthGuard: Protege todas las rutas por defecto
    *   RolesGuard: Control de acceso basado en roles
*   **Roles**:
    *   **Admin**: Acceso completo + Analytics/Totals/Cierre de Mes/Backups
    *   **Employee**: Acceso operacional (Clientes, Compras, Pagos, Devoluciones, Artículos)
*   **Authorized Emails**: Solo emails en AUTHORIZED_EMAILS pueden acceder
*   **Admin Emails**: Emails en ADMIN_EMAILS obtienen rol de Admin

### 4. API Endpoints

#### Auth
- `GET /auth/google` - Iniciar OAuth
- `GET /auth/google/callback` - Callback OAuth
- `GET /auth/me` - Perfil del usuario

#### Empleados
- `POST /empleados` - Crear empleado
- `GET /empleados` - Listar todos
- `GET /empleados/search?q=` - Buscar
- `GET /empleados/:id` - Obtener uno
- `PATCH /empleados/:id` - Actualizar
- `DELETE /empleados/:id` - Eliminar

#### Clientes
- `POST /clientes` - Crear cliente
- `GET /clientes` - Listar todos (con balance)
- `GET /clientes/search?q=` - Buscar
- `GET /clientes/:id` - Obtener uno (con balance)
- `PATCH /clientes/:id` - Actualizar
- `DELETE /clientes/:id` - Eliminar

#### Artículos
- `POST /articulos` - Crear artículo
- `GET /articulos` - Listar todos
- `GET /articulos/search?q=` - Buscar
- `GET /articulos/barcode/:codigo` - Buscar por código de barras
- `GET /articulos/:id` - Obtener uno
- `PATCH /articulos/:id` - Actualizar
- `DELETE /articulos/:id` - Eliminar

#### Compras
- `POST /compras` - Crear compra (con artículos o VARIOS)
- `GET /compras` - Listar todas
- `GET /compras/cliente/:clienteId` - Por cliente
- `GET /compras/:id` - Obtener una
- `DELETE /compras/:id` - Eliminar

#### Pagos
- `POST /pagos` - Registrar pago
- `GET /pagos` - Listar todos
- `GET /pagos/cliente/:clienteId` - Por cliente
- `GET /pagos/:id` - Obtener uno
- `DELETE /pagos/:id` - Eliminar

#### Devoluciones
- `POST /devoluciones` - Registrar devolución
- `GET /devoluciones` - Listar todas
- `GET /devoluciones/cliente/:clienteId` - Por cliente
- `GET /devoluciones/:id` - Obtener una
- `DELETE /devoluciones/:id` - Eliminar

#### Cierre de Mes (Solo Admin)
- `POST /cierre-mes` - Crear cierre
- `GET /cierre-mes` - Listar cierres
- `GET /cierre-mes/analytics?fechaInicio=&fechaFin=` - Analytics filtrado
- `GET /cierre-mes/current-month` - Estadísticas del mes actual
- `GET /cierre-mes/:id` - Obtener un cierre

#### Backup (Solo Admin)
- `POST /backup` - Crear backup
- `GET /backup` - Listar backups
- `GET /backup/:filename` - Descargar backup

### 5. Base de Datos
*   **PostgreSQL** con TypeORM
*   **Migraciones**: Automáticas en desarrollo (synchronize: true)
*   **Relaciones**: Configuradas con cascadas apropiadas
*   **Índices**: En campos únicos (num_cliente, id_empleado, codigo_barras, email)

### 6. Configuración
*   **Variables de Entorno** (.env):
    - DATABASE_HOST, DATABASE_PORT, DATABASE_USER, DATABASE_PASSWORD, DATABASE_NAME
    - GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL
    - JWT_SECRET
    - AUTHORIZED_EMAILS (separados por comas)
    - ADMIN_EMAILS (separados por comas)
    - PORT, NODE_ENV, FRONTEND_URL

### 7. Validación
*   **class-validator**: DTOs validados
*   **class-transformer**: Transformación automática
*   **ValidationPipe**: Global con whitelist

## Arquitectura Implementada
*   **Backend**: NestJS API REST completa
*   **ORM**: TypeORM con PostgreSQL
*   **Autenticación**: Passport (Google OAuth + JWT)
*   **Seguridad**: Guards, Decoradores, Roles
*   **Validación**: DTOs con class-validator
*   **Backup**: Sistema de backup SQL manual

## Próximos Pasos (Frontend)
*   Integrar React + Vite
*   Sidebar colapsable con iconos
*   Búsquedas rápidas
*   Botones rápidos en clientes (Pago, Compra, Devolución, Editar)
*   Vista Analytics tipo Excel
*   Gráficas de progreso
*   Lector de código de barras

## Importación de Datos
*   Pendiente: Endpoint para importar clientes desde CSV
*   El sistema soporta creación manual de todos los datos
