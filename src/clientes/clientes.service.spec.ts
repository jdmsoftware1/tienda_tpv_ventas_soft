import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientesService } from './clientes.service';
import { Cliente } from '../entities/cliente.entity';
import { NotFoundException } from '@nestjs/common';

describe('ClientesService', () => {
  let service: ClientesService;
  let repository: Repository<Cliente>;

  const mockCliente = {
    id: '1',
    num_cliente: 'CLI001',
    nombre: 'Juan Pérez',
    telefono: '123456789',
    empleado_id: 'emp1',
    balance: 0,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClientesService,
        {
          provide: getRepositoryToken(Cliente),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<ClientesService>(ClientesService);
    repository = module.get<Repository<Cliente>>(getRepositoryToken(Cliente));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new cliente', async () => {
      const createDto = {
        num_cliente: 'CLI001',
        nombre: 'Juan Pérez',
        telefono: '123456789',
        empleado_id: 'emp1',
      };

      mockRepository.create.mockReturnValue(mockCliente);
      mockRepository.save.mockResolvedValue(mockCliente);

      const result = await service.create(createDto);

      expect(mockRepository.create).toHaveBeenCalledWith(createDto);
      expect(mockRepository.save).toHaveBeenCalledWith(mockCliente);
      expect(result).toEqual(mockCliente);
    });
  });

  describe('findAll', () => {
    it('should return an array of clientes', async () => {
      const clientes = [{ ...mockCliente, compras: [], pagos: [], devoluciones: [] }];
      mockRepository.find.mockResolvedValue(clientes);

      const result = await service.findAll();

      expect(mockRepository.find).toHaveBeenCalledWith({
        relations: ['empleado', 'compras', 'pagos', 'devoluciones'],
        order: { nombre: 'ASC' },
      });
      expect(result.length).toEqual(1);
    });
  });

  describe('findOne', () => {
    it('should return a cliente by id', async () => {
      const clienteWithRelations = { ...mockCliente, compras: [], pagos: [], devoluciones: [] };
      mockRepository.findOne.mockResolvedValue(clienteWithRelations);

      const result = await service.findOne('1');

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
        relations: ['empleado', 'compras', 'pagos', 'devoluciones'],
      });
      expect(result.id).toEqual('1');
    });

    it('should throw NotFoundException if cliente not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('search', () => {
    it('should search clientes by query', async () => {
      const clienteWithRelations = { ...mockCliente, compras: [], pagos: [], devoluciones: [] };
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([clienteWithRelations]),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.search('Juan');

      expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith('cliente');
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalled();
      expect(mockQueryBuilder.where).toHaveBeenCalled();
      expect(result.length).toEqual(1);
    });
  });

  describe('update', () => {
    it('should update a cliente', async () => {
      const updateDto = { nombre: 'Juan Pérez Updated' };
      const clienteWithRelations = { ...mockCliente, compras: [], pagos: [], devoluciones: [] };
      const updatedCliente = { ...clienteWithRelations, ...updateDto };
      
      mockRepository.findOne.mockResolvedValue(clienteWithRelations);
      mockRepository.save.mockResolvedValue(updatedCliente);

      const result = await service.update('1', updateDto);

      expect(mockRepository.save).toHaveBeenCalled();
      expect(result.nombre).toEqual(updateDto.nombre);
    });

    it('should throw NotFoundException if cliente not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.update('999', {})).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should remove a cliente', async () => {
      const clienteWithRelations = { ...mockCliente, compras: [], pagos: [], devoluciones: [] };
      mockRepository.findOne.mockResolvedValue(clienteWithRelations);
      mockRepository.remove.mockResolvedValue(clienteWithRelations);

      await service.remove('1');

      expect(mockRepository.remove).toHaveBeenCalledWith(clienteWithRelations);
    });

    it('should throw NotFoundException if cliente not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('999')).rejects.toThrow(NotFoundException);
    });
  });
});
