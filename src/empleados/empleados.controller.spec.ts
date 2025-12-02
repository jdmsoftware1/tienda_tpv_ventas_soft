import { Test, TestingModule } from '@nestjs/testing';
import { EmpleadosController } from './empleados.controller';
import { EmpleadosService } from './empleados.service';
import { CreateEmpleadoDto } from './dto/create-empleado.dto';
import { UpdateEmpleadoDto } from './dto/update-empleado.dto';

describe('EmpleadosController', () => {
  let controller: EmpleadosController;
  let service: EmpleadosService;

  const mockEmpleado = {
    id: '1',
    id_empleado: 'EMP001',
    nombre: 'Juan Empleado',
    clientes: [],
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockEmpleadosService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    search: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmpleadosController],
      providers: [
        {
          provide: EmpleadosService,
          useValue: mockEmpleadosService,
        },
      ],
    }).compile();

    controller = module.get<EmpleadosController>(EmpleadosController);
    service = module.get<EmpleadosService>(EmpleadosService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new empleado', async () => {
      const createDto: CreateEmpleadoDto = {
        id_empleado: 'EMP001',
        nombre: 'Juan Empleado',
      };

      mockEmpleadosService.create.mockResolvedValue(mockEmpleado);

      const result = await controller.create(createDto);

      expect(service.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(mockEmpleado);
    });
  });

  describe('findAll', () => {
    it('should return an array of empleados', async () => {
      const empleados = [mockEmpleado];
      mockEmpleadosService.findAll.mockResolvedValue(empleados);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual(empleados);
    });
  });

  describe('findOne', () => {
    it('should return an empleado by id', async () => {
      mockEmpleadosService.findOne.mockResolvedValue(mockEmpleado);

      const result = await controller.findOne('1');

      expect(service.findOne).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockEmpleado);
    });
  });

  describe('search', () => {
    it('should search empleados by query', async () => {
      const empleados = [mockEmpleado];
      mockEmpleadosService.search.mockResolvedValue(empleados);

      const result = await controller.search('Juan');

      expect(service.search).toHaveBeenCalledWith('Juan');
      expect(result).toEqual(empleados);
    });
  });

  describe('update', () => {
    it('should update an empleado', async () => {
      const updateDto: UpdateEmpleadoDto = {
        nombre: 'Juan Actualizado',
      };
      const updatedEmpleado = { ...mockEmpleado, ...updateDto };

      mockEmpleadosService.update.mockResolvedValue(updatedEmpleado);

      const result = await controller.update('1', updateDto);

      expect(service.update).toHaveBeenCalledWith('1', updateDto);
      expect(result).toEqual(updatedEmpleado);
    });
  });

  describe('remove', () => {
    it('should remove an empleado', async () => {
      mockEmpleadosService.remove.mockResolvedValue(undefined);

      await controller.remove('1');

      expect(service.remove).toHaveBeenCalledWith('1');
    });
  });
});
