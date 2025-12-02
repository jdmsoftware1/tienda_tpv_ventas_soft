import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('ClientesController (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let clienteId: string;

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

    // Note: In a real scenario, you would authenticate here
    // For now, we'll skip authentication in tests
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/api/clientes (POST)', () => {
    it('should create a new cliente', () => {
      return request(app.getHttpServer())
        .post('/api/clientes')
        .send({
          num_cliente: 'CLI-TEST-001',
          nombre: 'Cliente de Prueba',
          telefono: '123456789',
        })
        .expect(201)
        .then((response) => {
          expect(response.body).toHaveProperty('id');
          expect(response.body.num_cliente).toBe('CLI-TEST-001');
          expect(response.body.nombre).toBe('Cliente de Prueba');
          clienteId = response.body.id;
        });
    });

    it('should fail with duplicate num_cliente', () => {
      return request(app.getHttpServer())
        .post('/api/clientes')
        .send({
          num_cliente: 'CLI-TEST-001',
          nombre: 'Otro Cliente',
          telefono: '987654321',
        })
        .expect(409);
    });

    it('should fail without required fields', () => {
      return request(app.getHttpServer())
        .post('/api/clientes')
        .send({
          telefono: '123456789',
        })
        .expect(400);
    });
  });

  describe('/api/clientes (GET)', () => {
    it('should return all clientes', () => {
      return request(app.getHttpServer())
        .get('/api/clientes')
        .expect(200)
        .then((response) => {
          expect(Array.isArray(response.body)).toBe(true);
          expect(response.body.length).toBeGreaterThan(0);
        });
    });
  });

  describe('/api/clientes/:id (GET)', () => {
    it('should return a cliente by id', () => {
      return request(app.getHttpServer())
        .get(`/api/clientes/${clienteId}`)
        .expect(200)
        .then((response) => {
          expect(response.body.id).toBe(clienteId);
          expect(response.body.num_cliente).toBe('CLI-TEST-001');
        });
    });

    it('should return 404 for non-existent cliente', () => {
      return request(app.getHttpServer())
        .get('/api/clientes/00000000-0000-0000-0000-000000000000')
        .expect(404);
    });
  });

  describe('/api/clientes/search/:query (GET)', () => {
    it('should search clientes by name', () => {
      return request(app.getHttpServer())
        .get('/api/clientes/search/Prueba')
        .expect(200)
        .then((response) => {
          expect(Array.isArray(response.body)).toBe(true);
          expect(response.body.length).toBeGreaterThan(0);
          expect(response.body[0].nombre).toContain('Prueba');
        });
    });

    it('should return empty array for non-matching search', () => {
      return request(app.getHttpServer())
        .get('/api/clientes/search/NoExiste12345')
        .expect(200)
        .then((response) => {
          expect(Array.isArray(response.body)).toBe(true);
          expect(response.body.length).toBe(0);
        });
    });
  });

  describe('/api/clientes/:id (PATCH)', () => {
    it('should update a cliente', () => {
      return request(app.getHttpServer())
        .patch(`/api/clientes/${clienteId}`)
        .send({
          nombre: 'Cliente Actualizado',
          telefono: '111222333',
        })
        .expect(200)
        .then((response) => {
          expect(response.body.nombre).toBe('Cliente Actualizado');
          expect(response.body.telefono).toBe('111222333');
        });
    });

    it('should return 404 for non-existent cliente', () => {
      return request(app.getHttpServer())
        .patch('/api/clientes/00000000-0000-0000-0000-000000000000')
        .send({
          nombre: 'Test',
        })
        .expect(404);
    });
  });

  describe('/api/clientes/:id (DELETE)', () => {
    it('should delete a cliente', () => {
      return request(app.getHttpServer())
        .delete(`/api/clientes/${clienteId}`)
        .expect(200);
    });

    it('should return 404 when deleting non-existent cliente', () => {
      return request(app.getHttpServer())
        .delete('/api/clientes/00000000-0000-0000-0000-000000000000')
        .expect(404);
    });
  });
});
