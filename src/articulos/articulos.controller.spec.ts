import { Test, TestingModule } from '@nestjs/testing';
import { ArticulosController } from './articulos.controller';
import { ArticulosService } from './articulos.service';
import { CreateArticuloDto } from './dto/create-articulo.dto';
import { UpdateArticuloDto } from './dto/update-articulo.dto';

describe('ArticulosController', () => {
  let controller: ArticulosController;
  let service: ArticulosService;

  const mockArticulo = {
    id: '1',
    codigo_barras: '1234567890123',
    nombre: 'Producto Test',
    precio_compra: 10.00,
    precio_venta: 15.00,
    cantidad: 100,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockArticulosService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByCodigoBarras: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    search: jest.fn(),
    updateStock: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ArticulosController],
      providers: [
        {
          provide: ArticulosService,
          useValue: mockArticulosService,
        },
      ],
    }).compile();

    controller = module.get<ArticulosController>(ArticulosController);
    service = module.get<ArticulosService>(ArticulosService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new articulo', async () => {
      const createDto: CreateArticuloDto = {
        codigo_barras: '1234567890123',
        nombre: 'Producto Test',
        precio_compra: 10.00,
        precio_venta: 15.00,
        cantidad: 100,
      };

      mockArticulosService.create.mockResolvedValue(mockArticulo);

      const result = await controller.create(createDto);

      expect(service.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(mockArticulo);
    });
  });

  describe('findAll', () => {
    it('should return an array of articulos', async () => {
      const articulos = [mockArticulo];
      mockArticulosService.findAll.mockResolvedValue(articulos);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual(articulos);
    });
  });

  describe('findOne', () => {
    it('should return an articulo by id', async () => {
      mockArticulosService.findOne.mockResolvedValue(mockArticulo);

      const result = await controller.findOne('1');

      expect(service.findOne).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockArticulo);
    });
  });

  describe('findByBarcode', () => {
    it('should return an articulo by codigo_barras', async () => {
      mockArticulosService.findByCodigoBarras.mockResolvedValue(mockArticulo);

      const result = await controller.findByBarcode('1234567890123');

      expect(service.findByCodigoBarras).toHaveBeenCalledWith('1234567890123');
      expect(result).toEqual(mockArticulo);
    });
  });

  describe('search', () => {
    it('should search articulos by query', async () => {
      const articulos = [mockArticulo];
      mockArticulosService.search.mockResolvedValue(articulos);

      const result = await controller.search('Producto');

      expect(service.search).toHaveBeenCalledWith('Producto');
      expect(result).toEqual(articulos);
    });
  });

  describe('update', () => {
    it('should update an articulo', async () => {
      const updateDto: UpdateArticuloDto = {
        nombre: 'Producto Actualizado',
        precio_venta: 20.00,
      };
      const updatedArticulo = { ...mockArticulo, ...updateDto };

      mockArticulosService.update.mockResolvedValue(updatedArticulo);

      const result = await controller.update('1', updateDto);

      expect(service.update).toHaveBeenCalledWith('1', updateDto);
      expect(result).toEqual(updatedArticulo);
    });
  });

  describe('remove', () => {
    it('should remove an articulo', async () => {
      mockArticulosService.remove.mockResolvedValue(undefined);

      await controller.remove('1');

      expect(service.remove).toHaveBeenCalledWith('1');
    });
  });
});
