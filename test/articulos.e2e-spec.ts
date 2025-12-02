import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('ArticulosController (e2e)', () => {
  let app: INestApplication;
  let articuloId: string;
  const testCodigoBarras = `TEST-${Date.now()}`;

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

  describe('/api/articulos (POST)', () => {
    it('should create a new articulo', () => {
      return request(app.getHttpServer())
        .post('/api/articulos')
        .send({
          codigo_barras: testCodigoBarras,
          nombre: 'Artículo de Prueba',
          precio_compra: 10.50,
          precio_venta: 15.99,
          cantidad: 50,
        })
        .expect(201)
        .then((response) => {
          expect(response.body).toHaveProperty('id');
          expect(response.body.codigo_barras).toBe(testCodigoBarras);
          expect(response.body.nombre).toBe('Artículo de Prueba');
          expect(parseFloat(response.body.precio_compra)).toBe(10.50);
          expect(parseFloat(response.body.precio_venta)).toBe(15.99);
          expect(response.body.cantidad).toBe(50);
          articuloId = response.body.id;
        });
    });

    it('should fail with duplicate codigo_barras', () => {
      return request(app.getHttpServer())
        .post('/api/articulos')
        .send({
          codigo_barras: testCodigoBarras,
          nombre: 'Otro Artículo',
          precio_compra: 5.00,
          precio_venta: 10.00,
          cantidad: 20,
        })
        .expect(409);
    });

    it('should fail without required fields', () => {
      return request(app.getHttpServer())
        .post('/api/articulos')
        .send({
          nombre: 'Artículo sin código',
        })
        .expect(400);
    });
  });

  describe('/api/articulos (GET)', () => {
    it('should return all articulos', () => {
      return request(app.getHttpServer())
        .get('/api/articulos')
        .expect(200)
        .then((response) => {
          expect(Array.isArray(response.body)).toBe(true);
          expect(response.body.length).toBeGreaterThan(0);
        });
    });
  });

  describe('/api/articulos/:id (GET)', () => {
    it('should return an articulo by id', () => {
      return request(app.getHttpServer())
        .get(`/api/articulos/${articuloId}`)
        .expect(200)
        .then((response) => {
          expect(response.body.id).toBe(articuloId);
          expect(response.body.codigo_barras).toBe(testCodigoBarras);
        });
    });

    it('should return 404 for non-existent articulo', () => {
      return request(app.getHttpServer())
        .get('/api/articulos/00000000-0000-0000-0000-000000000000')
        .expect(404);
    });
  });

  describe('/api/articulos/barcode/:codigo (GET)', () => {
    it('should return an articulo by codigo_barras', () => {
      return request(app.getHttpServer())
        .get(`/api/articulos/barcode/${testCodigoBarras}`)
        .expect(200)
        .then((response) => {
          expect(response.body.codigo_barras).toBe(testCodigoBarras);
          expect(response.body.nombre).toBe('Artículo de Prueba');
        });
    });

    it('should return 404 for non-existent codigo_barras', () => {
      return request(app.getHttpServer())
        .get('/api/articulos/barcode/0000000000000')
        .expect(404);
    });
  });

  describe('/api/articulos/search (GET)', () => {
    it('should search articulos by name', () => {
      return request(app.getHttpServer())
        .get('/api/articulos/search?q=Prueba')
        .expect(200)
        .then((response) => {
          expect(Array.isArray(response.body)).toBe(true);
          expect(response.body.length).toBeGreaterThan(0);
        });
    });

    it('should return empty array for non-matching search', () => {
      return request(app.getHttpServer())
        .get('/api/articulos/search?q=NoExisteEsteArticulo12345')
        .expect(200)
        .then((response) => {
          expect(Array.isArray(response.body)).toBe(true);
          expect(response.body.length).toBe(0);
        });
    });
  });

  describe('/api/articulos/:id (PATCH)', () => {
    it('should update an articulo', () => {
      return request(app.getHttpServer())
        .patch(`/api/articulos/${articuloId}`)
        .send({
          nombre: 'Artículo Actualizado',
          precio_venta: 19.99,
          cantidad: 75,
        })
        .expect(200)
        .then((response) => {
          expect(response.body.nombre).toBe('Artículo Actualizado');
          expect(parseFloat(response.body.precio_venta)).toBe(19.99);
          expect(response.body.cantidad).toBe(75);
        });
    });

    it('should return 404 for non-existent articulo', () => {
      return request(app.getHttpServer())
        .patch('/api/articulos/00000000-0000-0000-0000-000000000000')
        .send({
          nombre: 'Test',
        })
        .expect(404);
    });
  });

  describe('/api/articulos/:id (DELETE)', () => {
    it('should delete an articulo', () => {
      return request(app.getHttpServer())
        .delete(`/api/articulos/${articuloId}`)
        .expect(200);
    });

    it('should return 404 when deleting non-existent articulo', () => {
      return request(app.getHttpServer())
        .delete('/api/articulos/00000000-0000-0000-0000-000000000000')
        .expect(404);
    });
  });
});
