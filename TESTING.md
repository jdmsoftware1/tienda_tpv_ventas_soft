# 🧪 Guía de Testing

Este documento explica cómo ejecutar los tests del proyecto.

## 📋 Tipos de Tests

### 1. **Tests Unitarios**
Prueban componentes individuales de forma aislada.
- Ubicación: `src/**/*.spec.ts`
- Ejemplo: `src/clientes/clientes.service.spec.ts`

### 2. **Tests E2E (End-to-End)**
Prueban el flujo completo de la aplicación.
- Ubicación: `test/**/*.e2e-spec.ts`
- Ejemplo: `test/clientes.e2e-spec.ts`

---

## 🚀 Ejecutar Tests

### **Todos los tests**
```bash
npm test
```

### **Tests en modo watch (desarrollo)**
```bash
npm run test:watch
```

### **Tests con cobertura**
```bash
npm run test:cov
```

### **Tests E2E**
```bash
npm run test:e2e
```

### **Test específico**
```bash
npm test -- clientes.service.spec
```

---

## 📊 Cobertura de Tests

### **Ver reporte de cobertura**
Después de ejecutar `npm run test:cov`, abre:
```
coverage/lcov-report/index.html
```

### **Objetivo de cobertura**
- **Statements**: > 80%
- **Branches**: > 75%
- **Functions**: > 80%
- **Lines**: > 80%

---

## 🧪 Tests del Módulo de Clientes

### **Tests Unitarios**

#### **ClientesService** (`src/clientes/clientes.service.spec.ts`)
- ✅ `create()` - Crear nuevo cliente
- ✅ `findAll()` - Listar todos los clientes
- ✅ `findOne()` - Buscar cliente por ID
- ✅ `search()` - Buscar clientes por query
- ✅ `update()` - Actualizar cliente
- ✅ `remove()` - Eliminar cliente

#### **ClientesController** (`src/clientes/clientes.controller.spec.ts`)
- ✅ Endpoints POST, GET, PATCH, DELETE
- ✅ Validación de DTOs
- ✅ Manejo de errores

### **Tests E2E**

#### **Clientes E2E** (`test/clientes.e2e-spec.ts`)
- ✅ POST `/api/clientes` - Crear cliente
- ✅ GET `/api/clientes` - Listar clientes
- ✅ GET `/api/clientes/:id` - Obtener cliente
- ✅ GET `/api/clientes/search/:query` - Buscar clientes
- ✅ PATCH `/api/clientes/:id` - Actualizar cliente
- ✅ DELETE `/api/clientes/:id` - Eliminar cliente

---

## 🛠️ Configuración de Tests

### **Jest Configuration** (`package.json`)
```json
{
  "jest": {
    "moduleFileExtensions": ["js", "json", "ts"],
    "rootDir": "src",
    "testRegex": ".*\\.spec\\.ts$",
    "transform": {
      "^.+\\.(t|j)s$": "ts-jest"
    },
    "collectCoverageFrom": [
      "**/*.(t|j)s"
    ],
    "coverageDirectory": "../coverage",
    "testEnvironment": "node"
  }
}
```

### **E2E Configuration** (`test/jest-e2e.json`)
```json
{
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": ".",
  "testEnvironment": "node",
  "testRegex": ".e2e-spec.ts$",
  "transform": {
    "^.+\\.(t|j)s$": "ts-jest"
  }
}
```

---

## 📝 Escribir Nuevos Tests

### **Estructura de un test unitario**
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { MiServicio } from './mi-servicio.service';

describe('MiServicio', () => {
  let service: MiServicio;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MiServicio],
    }).compile();

    service = module.get<MiServicio>(MiServicio);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('metodo', () => {
    it('should do something', async () => {
      const result = await service.metodo();
      expect(result).toBe(expected);
    });
  });
});
```

### **Estructura de un test E2E**
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('MiController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/api/endpoint (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/endpoint')
      .expect(200)
      .expect('Content-Type', /json/);
  });
});
```

---

## 🐛 Debugging Tests

### **Ejecutar tests en modo debug**
```bash
npm run test:debug
```

Luego abre Chrome y ve a: `chrome://inspect`

### **Ver logs detallados**
```bash
npm test -- --verbose
```

---

## ✅ Checklist antes de hacer commit

- [ ] Todos los tests pasan: `npm test`
- [ ] Cobertura > 80%: `npm run test:cov`
- [ ] Tests E2E pasan: `npm run test:e2e`
- [ ] No hay warnings de Jest
- [ ] Tests documentan el comportamiento esperado

---

## 📚 Recursos

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)
- [Supertest](https://github.com/visionmedia/supertest)
