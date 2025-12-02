import { Test, TestingModule } from '@nestjs/testing';
import { ClientesController } from './clientes.controller';
import { ClientesService } from './clientes.service';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';

describe('ClientesController', () => {
  let controller: ClientesController;
  let service: ClientesService;

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

  const mockClientesService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    search: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClientesController],
      providers: [
        {
          provide: ClientesService,
          useValue: mockClientesService,
        },
      ],
    }).compile();

    controller = module.get<ClientesController>(ClientesController);
    service = module.get<ClientesService>(ClientesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new cliente', async () => {
      const createDto: CreateClienteDto = {
        num_cliente: 'CLI001',
        nombre: 'Juan Pérez',
        telefono: '123456789',
        empleado_id: 'emp1',
      };

      mockClientesService.create.mockResolvedValue(mockCliente);

      const result = await controller.create(createDto);

      expect(service.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(mockCliente);
    });
  });

  describe('findAll', () => {
    it('should return an array of clientes', async () => {
      const clientes = [mockCliente];
      mockClientesService.findAll.mockResolvedValue(clientes);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual(clientes);
    });
  });

  describe('findOne', () => {
    it('should return a cliente by id', async () => {
      mockClientesService.findOne.mockResolvedValue(mockCliente);

      const result = await controller.findOne('1');

      expect(service.findOne).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockCliente);
    });
  });

  describe('search', () => {
    it('should search clientes by query', async () => {
      const clientes = [mockCliente];
      mockClientesService.search.mockResolvedValue(clientes);

      const result = await controller.search('Juan');

      expect(service.search).toHaveBeenCalledWith('Juan');
      expect(result).toEqual(clientes);
    });
  });

  describe('update', () => {
    it('should update a cliente', async () => {
      const updateDto: UpdateClienteDto = {
        nombre: 'Juan Pérez Updated',
      };
      const updatedCliente = { ...mockCliente, ...updateDto };

      mockClientesService.update.mockResolvedValue(updatedCliente);

      const result = await controller.update('1', updateDto);

      expect(service.update).toHaveBeenCalledWith('1', updateDto);
      expect(result).toEqual(updatedCliente);
    });
  });

  describe('remove', () => {
    it('should remove a cliente', async () => {
      mockClientesService.remove.mockResolvedValue(undefined);

      await controller.remove('1');

      expect(service.remove).toHaveBeenCalledWith('1');
    });
  });
});
