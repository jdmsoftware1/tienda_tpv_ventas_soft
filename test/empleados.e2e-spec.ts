import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('EmpleadosController (e2e)', () => {
  let app: INestApplication;
  let empleadoId: string;
  const testIdEmpleado = `EMP-${Date.now()}`;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/api/empleados (POST)', () => {
    it('should create a new empleado', () => {
      return request(app.getHttpServer())
        .post('/api/empleados')
        .send({
          id_empleado: testIdEmpleado,
          nombre: 'Empleado de Prueba',
        })
        .expect(201)
        .then((response) => {
          expect(response.body).toHaveProperty('id');
          expect(response.body.id_empleado).toBe(testIdEmpleado);
          expect(response.body.nombre).toBe('Empleado de Prueba');
          empleadoId = response.body.id;
        });
    });

    it('should fail with duplicate id_empleado', () => {
      return request(app.getHttpServer())
        .post('/api/empleados')
        .send({
          id_empleado: testIdEmpleado,
          nombre: 'Otro Empleado',
        })
        .expect(409);
    });

    it('should fail without required fields', () => {
      return request(app.getHttpServer())
        .post('/api/empleados')
        .send({
          nombre: 'Empleado sin ID',
        })
        .expect(400);
    });
  });

  describe('/api/empleados (GET)', () => {
    it('should return all empleados', () => {
      return request(app.getHttpServer())
        .get('/api/empleados')
        .expect(200)
        .then((response) => {
          expect(Array.isArray(response.body)).toBe(true);
          expect(response.body.length).toBeGreaterThan(0);
        });
    });
  });

  describe('/api/empleados/:id (GET)', () => {
    it('should return an empleado by id', () => {
      return request(app.getHttpServer())
        .get(`/api/empleados/${empleadoId}`)
        .expect(200)
        .then((response) => {
          expect(response.body.id).toBe(empleadoId);
          expect(response.body.id_empleado).toBe(testIdEmpleado);
        });
    });

    it('should return 404 for non-existent empleado', () => {
      return request(app.getHttpServer())
        .get('/api/empleados/00000000-0000-0000-0000-000000000000')
        .expect(404);
    });
  });

  describe('/api/empleados/search (GET)', () => {
    it('should search empleados by name', () => {
      return request(app.getHttpServer())
        .get('/api/empleados/search?q=Prueba')
        .expect(200)
        .then((response) => {
          expect(Array.isArray(response.body)).toBe(true);
        });
    });
  });

  describe('/api/empleados/:id (PATCH)', () => {
    it('should update an empleado', () => {
      return request(app.getHttpServer())
        .patch(`/api/empleados/${empleadoId}`)
        .send({
          nombre: 'Empleado Actualizado',
        })
        .expect(200)
        .then((response) => {
          expect(response.body.nombre).toBe('Empleado Actualizado');
        });
    });

    it('should return 404 for non-existent empleado', () => {
      return request(app.getHttpServer())
        .patch('/api/empleados/00000000-0000-0000-0000-000000000000')
        .send({
          nombre: 'Test',
        })
        .expect(404);
    });
  });

  describe('/api/empleados/:id (DELETE)', () => {
    it('should delete an empleado', () => {
      return request(app.getHttpServer())
        .delete(`/api/empleados/${empleadoId}`)
        .expect(200);
    });

    it('should return 404 when deleting non-existent empleado', () => {
      return request(app.getHttpServer())
        .delete('/api/empleados/00000000-0000-0000-0000-000000000000')
        .expect(404);
    });
  });
});
