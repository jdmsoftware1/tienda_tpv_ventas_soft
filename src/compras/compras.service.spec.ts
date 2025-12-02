import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ComprasService } from './compras.service';
import { Compra } from '../entities/compra.entity';
import { CompraArticulo } from '../entities/compra-articulo.entity';
import { ArticulosService } from '../articulos/articulos.service';
import { NotFoundException } from '@nestjs/common';

describe('ComprasService', () => {
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

  const mockCompraRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  };

  const mockCompraArticuloRepository = {
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockArticulosService = {
    updateStock: jest.fn(),
  };

  const mockQueryRunner = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: {
      save: jest.fn(),
    },
  };

  const mockDataSource = {
    createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ComprasService,
        {
          provide: getRepositoryToken(Compra),
          useValue: mockCompraRepository,
        },
        {
          provide: getRepositoryToken(CompraArticulo),
          useValue: mockCompraArticuloRepository,
        },
        {
          provide: ArticulosService,
          useValue: mockArticulosService,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<ComprasService>(ComprasService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new compra without articulos (es_varios)', async () => {
      const createDto = {
        cliente_id: 'cliente-1',
        total: 50.00,
        descripcion: 'Compra varios',
        es_varios: true,
      };

      mockCompraRepository.create.mockReturnValue(mockCompra);
      mockQueryRunner.manager.save.mockResolvedValue(mockCompra);
      mockCompraRepository.findOne.mockResolvedValue(mockCompra);

      const result = await service.create(createDto);

      expect(mockQueryRunner.connect).toHaveBeenCalled();
      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
      expect(result).toEqual(mockCompra);
    });

    it('should create a compra with articulos and update stock', async () => {
      const createDto = {
        cliente_id: 'cliente-1',
        total: 100.00,
        articulos: [
          { articulo_id: 'art-1', cantidad: 2, precio_unitario: 50.00 },
        ],
      };

      const mockCompraArticulo = {
        compra_id: '1',
        articulo_id: 'art-1',
        cantidad: 2,
        precio_unitario: 50.00,
        subtotal: 100.00,
      };

      mockCompraRepository.create.mockReturnValue(mockCompra);
      mockCompraArticuloRepository.create.mockReturnValue(mockCompraArticulo);
      mockQueryRunner.manager.save.mockResolvedValue(mockCompra);
      mockCompraRepository.findOne.mockResolvedValue(mockCompra);
      mockArticulosService.updateStock.mockResolvedValue({});

      const result = await service.create(createDto);

      expect(mockArticulosService.updateStock).toHaveBeenCalledWith('art-1', -2);
      expect(result).toEqual(mockCompra);
    });

    it('should rollback transaction on error', async () => {
      const createDto = {
        cliente_id: 'cliente-1',
        total: 100.00,
      };

      mockCompraRepository.create.mockReturnValue(mockCompra);
      mockQueryRunner.manager.save.mockRejectedValue(new Error('DB Error'));

      await expect(service.create(createDto)).rejects.toThrow('DB Error');
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return an array of compras', async () => {
      const compras = [mockCompra];
      mockCompraRepository.find.mockResolvedValue(compras);

      const result = await service.findAll();

      expect(mockCompraRepository.find).toHaveBeenCalledWith({
        relations: ['cliente', 'articulos', 'articulos.articulo'],
        order: { created_at: 'DESC' },
      });
      expect(result).toEqual(compras);
    });
  });

  describe('findOne', () => {
    it('should return a compra by id', async () => {
      mockCompraRepository.findOne.mockResolvedValue(mockCompra);

      const result = await service.findOne('1');

      expect(mockCompraRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
        relations: ['cliente', 'articulos', 'articulos.articulo'],
      });
      expect(result).toEqual(mockCompra);
    });

    it('should throw NotFoundException if compra not found', async () => {
      mockCompraRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByCliente', () => {
    it('should return compras by cliente_id', async () => {
      const compras = [mockCompra];
      mockCompraRepository.find.mockResolvedValue(compras);

      const result = await service.findByCliente('cliente-1');

      expect(mockCompraRepository.find).toHaveBeenCalledWith({
        where: { cliente_id: 'cliente-1' },
        relations: ['articulos', 'articulos.articulo'],
        order: { created_at: 'DESC' },
      });
      expect(result).toEqual(compras);
    });
  });

  describe('remove', () => {
    it('should remove a compra', async () => {
      mockCompraRepository.findOne.mockResolvedValue(mockCompra);
      mockCompraRepository.remove.mockResolvedValue(mockCompra);

      await service.remove('1');

      expect(mockCompraRepository.remove).toHaveBeenCalledWith(mockCompra);
    });

    it('should throw NotFoundException if compra not found', async () => {
      mockCompraRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('999')).rejects.toThrow(NotFoundException);
    });
  });
});
