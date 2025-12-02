import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ArticulosService } from './articulos.service';
import { Articulo } from '../entities/articulo.entity';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('ArticulosService', () => {
  let service: ArticulosService;
  let repository: Repository<Articulo>;

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

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArticulosService,
        {
          provide: getRepositoryToken(Articulo),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<ArticulosService>(ArticulosService);
    repository = module.get<Repository<Articulo>>(getRepositoryToken(Articulo));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new articulo', async () => {
      const createDto = {
        codigo_barras: '1234567890123',
        nombre: 'Producto Test',
        precio_compra: 10.00,
        precio_venta: 15.00,
        cantidad: 100,
      };

      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(mockArticulo);
      mockRepository.save.mockResolvedValue(mockArticulo);

      const result = await service.create(createDto);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { codigo_barras: createDto.codigo_barras },
      });
      expect(mockRepository.create).toHaveBeenCalledWith(createDto);
      expect(mockRepository.save).toHaveBeenCalledWith(mockArticulo);
      expect(result).toEqual(mockArticulo);
    });

    it('should throw ConflictException if codigo_barras already exists', async () => {
      const createDto = {
        codigo_barras: '1234567890123',
        nombre: 'Producto Test',
        precio_compra: 10.00,
        precio_venta: 15.00,
        cantidad: 100,
      };

      mockRepository.findOne.mockResolvedValue(mockArticulo);

      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return an array of articulos', async () => {
      const articulos = [mockArticulo];
      mockRepository.find.mockResolvedValue(articulos);

      const result = await service.findAll();

      expect(mockRepository.find).toHaveBeenCalledWith({
        order: { nombre: 'ASC' },
      });
      expect(result).toEqual(articulos);
    });
  });

  describe('findOne', () => {
    it('should return an articulo by id', async () => {
      mockRepository.findOne.mockResolvedValue(mockArticulo);

      const result = await service.findOne('1');

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
      });
      expect(result).toEqual(mockArticulo);
    });

    it('should throw NotFoundException if articulo not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByCodigoBarras', () => {
    it('should return an articulo by codigo_barras', async () => {
      mockRepository.findOne.mockResolvedValue(mockArticulo);

      const result = await service.findByCodigoBarras('1234567890123');

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { codigo_barras: '1234567890123' },
      });
      expect(result).toEqual(mockArticulo);
    });

    it('should throw NotFoundException if articulo not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findByCodigoBarras('0000000000000')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('search', () => {
    it('should search articulos by query', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockArticulo]),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.search('Producto');

      expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith('articulo');
      expect(mockQueryBuilder.where).toHaveBeenCalled();
      expect(result).toEqual([mockArticulo]);
    });
  });

  describe('update', () => {
    it('should update an articulo', async () => {
      const updateDto = { nombre: 'Producto Actualizado' };
      const updatedArticulo = { ...mockArticulo, ...updateDto };

      mockRepository.findOne.mockResolvedValue(mockArticulo);
      mockRepository.save.mockResolvedValue(updatedArticulo);

      const result = await service.update('1', updateDto);

      expect(mockRepository.save).toHaveBeenCalled();
      expect(result.nombre).toEqual(updateDto.nombre);
    });

    it('should throw NotFoundException if articulo not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.update('999', {})).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if new codigo_barras already exists', async () => {
      const updateDto = { codigo_barras: '9999999999999' };
      const existingArticulo = { ...mockArticulo, id: '2', codigo_barras: '9999999999999' };

      mockRepository.findOne
        .mockResolvedValueOnce(mockArticulo) // findOne for update
        .mockResolvedValueOnce(existingArticulo); // findOne for duplicate check

      await expect(service.update('1', updateDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('should remove an articulo', async () => {
      mockRepository.findOne.mockResolvedValue(mockArticulo);
      mockRepository.remove.mockResolvedValue(mockArticulo);

      await service.remove('1');

      expect(mockRepository.remove).toHaveBeenCalledWith(mockArticulo);
    });

    it('should throw NotFoundException if articulo not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateStock', () => {
    it('should update stock quantity', async () => {
      const articuloWithNewStock = { ...mockArticulo, cantidad: 110 };

      mockRepository.findOne.mockResolvedValue(mockArticulo);
      mockRepository.save.mockResolvedValue(articuloWithNewStock);

      const result = await service.updateStock('1', 10);

      expect(mockRepository.save).toHaveBeenCalled();
      expect(result.cantidad).toEqual(110);
    });

    it('should decrease stock quantity', async () => {
      const articuloWithNewStock = { ...mockArticulo, cantidad: 90 };

      mockRepository.findOne.mockResolvedValue({ ...mockArticulo });
      mockRepository.save.mockResolvedValue(articuloWithNewStock);

      const result = await service.updateStock('1', -10);

      expect(result.cantidad).toEqual(90);
    });
  });
});
