import { Test, TestingModule } from '@nestjs/testing';
import { ComprasController } from './compras.controller';
import { ComprasService } from './compras.service';
import { CreateCompraDto } from './dto/create-compra.dto';

describe('ComprasController', () => {
  let controller: ComprasController;
  let service: ComprasService;

  const mockCompra = {
    id: '1',
    cliente_id: 'cliente-1',
    total: 100.00,
    descripcion: 'Compra de prueba',
    es_varios: false,
    created_at: new Date(),
    cliente: {
      id: 'cliente-1',
      nombre: 'Cliente Test',
    },
    articulos: [],
  };

  const mockComprasService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByCliente: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ComprasController],
      providers: [
        {
          provide: ComprasService,
          useValue: mockComprasService,
        },
      ],
    }).compile();

    controller = module.get<ComprasController>(ComprasController);
    service = module.get<ComprasService>(ComprasService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new compra', async () => {
      const createDto: CreateCompraDto = {
        cliente_id: 'cliente-1',
        total: 100.00,
        descripcion: 'Compra de prueba',
        es_varios: false,
        articulos: [
          { articulo_id: 'art-1', cantidad: 2, precio_unitario: 50.00 },
        ],
      };

      mockComprasService.create.mockResolvedValue(mockCompra);

      const result = await controller.create(createDto);

      expect(service.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(mockCompra);
    });
  });

  describe('findAll', () => {
    it('should return an array of compras', async () => {
      const compras = [mockCompra];
      mockComprasService.findAll.mockResolvedValue(compras);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual(compras);
    });
  });

  describe('findOne', () => {
    it('should return a compra by id', async () => {
      mockComprasService.findOne.mockResolvedValue(mockCompra);

      const result = await controller.findOne('1');

      expect(service.findOne).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockCompra);
    });
  });

  describe('findByCliente', () => {
    it('should return compras by cliente_id', async () => {
      const compras = [mockCompra];
      mockComprasService.findByCliente.mockResolvedValue(compras);

      const result = await controller.findByCliente('cliente-1');

      expect(service.findByCliente).toHaveBeenCalledWith('cliente-1');
      expect(result).toEqual(compras);
    });
  });

  describe('remove', () => {
    it('should remove a compra', async () => {
      mockComprasService.remove.mockResolvedValue(undefined);

      await controller.remove('1');

      expect(service.remove).toHaveBeenCalledWith('1');
    });
  });
});
