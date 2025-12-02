# 🚀 Instrucciones de Instalación y Ejecución

## 📋 Requisitos Previos

- Node.js 18+ instalado
- npm o yarn
- Cuenta en Neon (PostgreSQL) - Ya configurada
- Cuenta en Google Cloud Console - Ya configurada

## 🔧 Instalación

### 1. Instalar dependencias del backend

```bash
npm install
```

### 2. Instalar dependencias del frontend

```bash
cd client
npm install
cd ..
```

### 3. Configurar variables de entorno

El archivo `.env` ya está configurado con:
- ✅ Base de datos Neon (PostgreSQL)
- ✅ Google OAuth (Client ID y Secret)
- ✅ JWT Secret generado
- ⚠️ **IMPORTANTE**: Reemplaza `tuemail@gmail.com` con tu email real en:
  - `AUTHORIZED_EMAILS`
  - `ADMIN_EMAILS`

## 🏃 Ejecución en Desarrollo

### Opción 1: Backend y Frontend por separado (Recomendado)

**Terminal 1 - Backend:**
```bash
npm run start:dev
```
Backend corriendo en: `http://localhost:3000`

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
```
Frontend corriendo en: `http://localhost:5173`

### Opción 2: Solo Backend (sin frontend)

```bash
npm run start:dev
```

Accede a la API en: `http://localhost:3000`

## 🔐 Autenticación

1. Ve a `http://localhost:5173` (o `http://localhost:3000/auth/google` si solo usas backend)
2. Haz clic en "Continuar con Google"
3. Inicia sesión con tu cuenta de Google
4. Serás redirigido al dashboard

## 📦 Build para Producción

### 1. Compilar frontend y backend

```bash
npm run build
```

Esto ejecutará:
1. `npm run build:client` - Compila React y genera archivos en `/public`
2. `nest build` - Compila NestJS

### 2. Ejecutar en producción

```bash
npm run start:prod
```

Todo se servirá desde `http://localhost:3000`:
- Frontend: `http://localhost:3000`
- API: `http://localhost:3000/api/*`

## 🌐 Despliegue en Render

### 1. Crear nuevo Web Service en Render

1. Conecta tu repositorio de GitHub
2. Configura:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start:prod`
   - **Environment**: Node

### 2. Variables de Entorno en Render

Agrega todas las variables del `.env`:
```
DATABASE_URL=postgresql://...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_CALLBACK_URL=https://tu-app.onrender.com/api/auth/google/callback
JWT_SECRET=...
AUTHORIZED_EMAILS=...
ADMIN_EMAILS=...
PORT=3000
NODE_ENV=production
FRONTEND_URL=https://tu-app.onrender.com
```

⚠️ **Importante**: Actualiza `GOOGLE_CALLBACK_URL` y `FRONTEND_URL` con tu URL de Render.

### 3. Actualizar Google OAuth

En Google Cloud Console, agrega a las URIs autorizadas:
- `https://tu-app.onrender.com/api/auth/google/callback`
- `https://tu-app.onrender.com`

## 📚 Estructura del Proyecto

```
tienda_project_nestjs/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── components/    # Componentes reutilizables
│   │   ├── pages/         # Páginas/Vistas
│   │   ├── store/         # Zustand stores
│   │   ├── lib/           # Utilidades (API client)
│   │   ├── App.tsx        # Componente principal
│   │   └── main.tsx       # Entry point
│   ├── public/            # Archivos estáticos
│   └── package.json       # Dependencias frontend
├── src/                   # Backend NestJS
│   ├── auth/              # Autenticación
│   ├── entities/          # Entidades TypeORM
│   ├── clientes/          # Módulo Clientes
│   ├── empleados/         # Módulo Empleados
│   ├── articulos/         # Módulo Artículos
│   ├── compras/           # Módulo Compras
│   ├── pagos/             # Módulo Pagos
│   ├── devoluciones/      # Módulo Devoluciones
│   ├── cierre-mes/        # Módulo Cierre de Mes
│   ├── backup/            # Módulo Backup
│   └── config/            # Configuraciones
├── public/                # Build del frontend (generado)
├── .env                   # Variables de entorno
├── package.json           # Dependencias backend
└── README.md              # Documentación
```

## 🔍 Endpoints Principales

### Autenticación
- `GET /api/auth/google` - Iniciar OAuth
- `GET /api/auth/google/callback` - Callback OAuth
- `GET /api/auth/me` - Perfil del usuario

### API (requiere autenticación)
- `GET /api/clientes` - Listar clientes
- `GET /api/empleados` - Listar empleados
- `GET /api/articulos` - Listar artículos
- `GET /api/compras` - Listar compras
- `GET /api/pagos` - Listar pagos
- `GET /api/devoluciones` - Listar devoluciones
- `GET /api/cierre-mes` - Listar cierres (Admin)
- `POST /api/backup` - Crear backup (Admin)

## 🐛 Troubleshooting

### Error: "Unauthorized" al acceder
- Verifica que tu email esté en `AUTHORIZED_EMAILS`
- Asegúrate de haber iniciado sesión con Google

### Error: No se conecta a la base de datos
- Verifica que `DATABASE_URL` esté correctamente configurado
- Comprueba que Neon esté activo

### Error: Google OAuth no funciona
- Verifica `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET`
- Asegúrate de que el callback URL esté configurado en Google Cloud Console

### Frontend no carga en producción
- Ejecuta `npm run build` antes de `npm run start:prod`
- Verifica que la carpeta `/public` tenga archivos

## 📞 Soporte

Para más información, consulta:
- `GEMINI.md` - Documentación completa del proyecto
- `UPDATES.md` - Historial de cambios
- `FIX.md` - Registro de correcciones
