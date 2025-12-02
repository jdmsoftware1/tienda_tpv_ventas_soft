# GEMINI.md - Project Context & Requirements

## Project Overview
**Sistema de Gestión de Tienda - POS** para "Decoraciones Ángel e Hijas"
- **Backend**: NestJS 11 + TypeORM + PostgreSQL (Neon)
- **Frontend**: React 18 + Vite + TailwindCSS + Recharts
- **Autenticación**: Google OAuth 2.0
- **Versión**: 1.0.3

## Prompt Inicial (Requisitos del Cliente)
Ver archivo `prompts/PROMPT INICIAL.txt` para los requisitos originales del cliente.

### Resumen de Requisitos Clave:
- **Clientes**: teléfono, num_cliente (manual), nombre, balance calculado (compras - pagos - devoluciones)
- **Empleados**: id_empleado, nombre. Los clientes van asociados a empleados
- **Compras**: con artículos o "VARIOS" (sin control de stock)
- **Artículos**: código de barras, precio compra, precio venta, cantidad
- **Pagos y Devoluciones**: registro simple, afectan el balance del cliente
- **Cierre de Mes**: manual, con rango de fechas personalizable
- **UI**: Sencilla, bonita, sidebar colapsable con iconos, buscadores rápidos
- **Filtros por Empleado**: En todas las vistas excepto artículos

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

## Frontend Implementado (React + Vite)

### Páginas Implementadas
- **Dashboard**: Gráficos con Recharts, estadísticas del mes, top deudores, stock bajo
- **Clientes**: CRUD completo, búsqueda, balance, filtro por empleado, acciones rápidas (pago, compra, devolución)
- **Compras**: Sistema de carrito con escaneo de código de barras, lista de artículos, opción "VARIOS", generación de tickets
- **Pagos**: Registro simple, filtro por empleado
- **Devoluciones**: Registro simple, filtro por empleado
- **Artículos**: CRUD completo, búsqueda por código de barras
- **Empleados**: CRUD completo
- **Cierre de Mes**: Solo admin (en desarrollo)

### Sistema de Compras (v1.0.3)
El módulo de compras permite:
1. **Seleccionar cliente** antes de agregar artículos
2. **Escanear código de barras** o seleccionar artículos de una lista
3. **Carrito de compras** con:
   - Lista de artículos agregados
   - Cantidad por artículo
   - Precio unitario y subtotal
   - Botón para eliminar artículos
   - Total calculado automáticamente
4. **Opción VARIOS**: Para compras sin artículos específicos (solo cantidad y descripción)
5. **Generación de Ticket**:
   - Vista previa del ticket
   - Formato optimizado para impresión (80mm)
   - Datos: empresa, fecha, cliente, artículos, total
   - Botón de impresión

### Características UI
- Sidebar colapsable con iconos (Lucide)
- Filtro por empleado en todas las vistas (excepto artículos)
- Búsquedas rápidas por nombre o código
- Footer con versión y copyright JDMSoftware
- Diseño responsive con TailwindCSS
- **Paleta de colores personalizada** (verde de la marca) configurable en `tailwind.config.js` y `src/index.css`

### Paleta de Colores (Marca)
Los colores de la aplicación están centralizados y son fácilmente modificables:
- **Archivo principal**: `client/src/index.css` (variables CSS)
- **Configuración Tailwind**: `client/tailwind.config.js`
- **Color primario**: Verde (#22c55e) basado en el logotipo
- **Uso**: Clases `primary-*` (ej: `bg-primary-600`, `text-primary-500`)

## Migración de Datos Legacy

### Script de Migración (`scripts/migrate-all.ts`)
Migra datos desde MySQL (tiendaNew.sql) a PostgreSQL (Neon):
- **Empleados**: tabla `trabajadores` → `empleados`
- **Clientes**: tabla `clientes` → `clientes` (con relación empleado)
- **Mapeo de campos**:
  - `cod_user` → `id_empleado`
  - `cod_cliente` → `num_cliente`
  - `nombre_c + apellidos_c` → `nombre`
  - `cod_user` (clientes) → `empleado_id` (FK)
- **Campos omitidos**: `debe`, `pass`, `email_c`, `DNI_NIF`

### Ejecutar Migración
```bash
npm run migrate:data
```

## Estructura del Proyecto
```
tienda_project_nestjs/
├── src/                    # Backend NestJS
│   ├── auth/               # Autenticación Google OAuth
│   ├── clientes/           # Módulo de clientes
│   ├── empleados/          # Módulo de empleados
│   ├── articulos/          # Módulo de artículos
│   ├── compras/            # Módulo de compras
│   ├── pagos/              # Módulo de pagos
│   ├── devoluciones/       # Módulo de devoluciones
│   ├── cierre-mes/         # Módulo de cierre de mes
│   ├── backup/             # Módulo de backup
│   └── entities/           # Entidades TypeORM
├── client/                 # Frontend React
│   └── src/
│       ├── components/     # Componentes reutilizables
│       ├── pages/          # Páginas de la aplicación
│       ├── lib/            # Utilidades (api, auth)
│       └── store/          # Estado global (Zustand)
├── scripts/                # Scripts de migración
├── prompts/                # Prompts originales del cliente
└── tmp/                    # Archivos temporales (gitignored)
```

## Datos Migrados (v1.0.2)
- **6 empleados**: David, fe, Bego, Jimenez, Yaiza, BegoJi
- **420 clientes** distribuidos por empleado
