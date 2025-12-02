import { Test, TestingModule } from '@nestjs/testing';
import { DevolucionesController } from './devoluciones.controller';
import { DevolucionesService } from './devoluciones.service';
import { CreateDevolucionDto } from './dto/create-devolucion.dto';

describe('DevolucionesController', () => {
  let controller: DevolucionesController;
  let service: DevolucionesService;

  const mockDevolucion = {
    id: '1',
    cliente_id: 'cliente-1',
    monto: 25.00,
    descripcion: 'Devolución de prueba',
    created_at: new Date(),
    cliente: {
      id: 'cliente-1',
      nombre: 'Cliente Test',
    },
  };

  const mockDevolucionesService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByCliente: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DevolucionesController],
      providers: [
        {
          provide: DevolucionesService,
          useValue: mockDevolucionesService,
        },
      ],
    }).compile();

    controller = module.get<DevolucionesController>(DevolucionesController);
    service = module.get<DevolucionesService>(DevolucionesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new devolucion', async () => {
      const createDto: CreateDevolucionDto = {
        cliente_id: 'cliente-1',
        monto: 25.00,
        descripcion: 'Devolución de prueba',
      };

      mockDevolucionesService.create.mockResolvedValue(mockDevolucion);

      const result = await controller.create(createDto);

      expect(service.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(mockDevolucion);
    });
  });

  describe('findAll', () => {
    it('should return an array of devoluciones', async () => {
      const devoluciones = [mockDevolucion];
      mockDevolucionesService.findAll.mockResolvedValue(devoluciones);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual(devoluciones);
    });
  });

  describe('findOne', () => {
    it('should return a devolucion by id', async () => {
      mockDevolucionesService.findOne.mockResolvedValue(mockDevolucion);

      const result = await controller.findOne('1');

      expect(service.findOne).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockDevolucion);
    });
  });

  describe('findByCliente', () => {
    it('should return devoluciones by cliente_id', async () => {
      const devoluciones = [mockDevolucion];
      mockDevolucionesService.findByCliente.mockResolvedValue(devoluciones);

      const result = await controller.findByCliente('cliente-1');

      expect(service.findByCliente).toHaveBeenCalledWith('cliente-1');
      expect(result).toEqual(devoluciones);
    });
  });

  describe('remove', () => {
    it('should remove a devolucion', async () => {
      mockDevolucionesService.remove.mockResolvedValue(undefined);

      await controller.remove('1');

      expect(service.remove).toHaveBeenCalledWith('1');
    });
  });
});
