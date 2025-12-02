import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('ComprasController (e2e)', () => {
  let app: INestApplication;
  let compraId: string;
  let clienteId: string;
  let articuloId: string;

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

    // Create a test cliente
    const clienteResponse = await request(app.getHttpServer())
      .post('/api/clientes')
      .send({
        num_cliente: `CLI-COMPRA-${Date.now()}`,
        nombre: 'Cliente para Compras Test',
        telefono: '123456789',
      });
    clienteId = clienteResponse.body.id;

    // Create a test articulo
    const articuloResponse = await request(app.getHttpServer())
      .post('/api/articulos')
      .send({
        codigo_barras: `ART-COMPRA-${Date.now()}`,
        nombre: 'Artículo para Compras Test',
        precio_compra: 10.00,
        precio_venta: 15.00,
        cantidad: 100,
      });
    articuloId = articuloResponse.body.id;
  });

  afterAll(async () => {
    // Cleanup
    if (clienteId) {
      await request(app.getHttpServer()).delete(`/api/clientes/${clienteId}`);
    }
    if (articuloId) {
      await request(app.getHttpServer()).delete(`/api/articulos/${articuloId}`);
    }
    await app.close();
  });

  describe('/api/compras (POST)', () => {
    it('should create a compra with es_varios=true', () => {
      return request(app.getHttpServer())
        .post('/api/compras')
        .send({
          cliente_id: clienteId,
          total: 50.00,
          descripcion: 'Compra de varios productos',
          es_varios: true,
        })
        .expect(201)
        .then((response) => {
          expect(response.body).toHaveProperty('id');
          expect(response.body.cliente_id).toBe(clienteId);
          expect(parseFloat(response.body.total)).toBe(50.00);
          expect(response.body.es_varios).toBe(true);
          compraId = response.body.id;
        });
    });

    it('should create a compra with articulos', () => {
      return request(app.getHttpServer())
        .post('/api/compras')
        .send({
          cliente_id: clienteId,
          total: 30.00,
          articulos: [
            {
              articulo_id: articuloId,
              cantidad: 2,
              precio_unitario: 15.00,
            },
          ],
        })
        .expect(201)
        .then((response) => {
          expect(response.body).toHaveProperty('id');
          expect(response.body.articulos).toBeDefined();
        });
    });

    it('should fail without cliente_id', () => {
      return request(app.getHttpServer())
        .post('/api/compras')
        .send({
          total: 50.00,
          es_varios: true,
        })
        .expect(400);
    });
  });

  describe('/api/compras (GET)', () => {
    it('should return all compras', () => {
      return request(app.getHttpServer())
        .get('/api/compras')
        .expect(200)
        .then((response) => {
          expect(Array.isArray(response.body)).toBe(true);
          expect(response.body.length).toBeGreaterThan(0);
        });
    });
  });

  describe('/api/compras/:id (GET)', () => {
    it('should return a compra by id', () => {
      return request(app.getHttpServer())
        .get(`/api/compras/${compraId}`)
        .expect(200)
        .then((response) => {
          expect(response.body.id).toBe(compraId);
          expect(response.body).toHaveProperty('cliente');
        });
    });

    it('should return 404 for non-existent compra', () => {
      return request(app.getHttpServer())
        .get('/api/compras/00000000-0000-0000-0000-000000000000')
        .expect(404);
    });
  });

  describe('/api/compras/cliente/:clienteId (GET)', () => {
    it('should return compras by cliente_id', () => {
      return request(app.getHttpServer())
        .get(`/api/compras/cliente/${clienteId}`)
        .expect(200)
        .then((response) => {
          expect(Array.isArray(response.body)).toBe(true);
          expect(response.body.length).toBeGreaterThan(0);
          response.body.forEach((compra: any) => {
            expect(compra.cliente_id).toBe(clienteId);
          });
        });
    });
  });

  describe('/api/compras/:id (DELETE)', () => {
    it('should delete a compra', () => {
      return request(app.getHttpServer())
        .delete(`/api/compras/${compraId}`)
        .expect(200);
    });

    it('should return 404 when deleting non-existent compra', () => {
      return request(app.getHttpServer())
        .delete('/api/compras/00000000-0000-0000-0000-000000000000')
        .expect(404);
    });
  });
});
