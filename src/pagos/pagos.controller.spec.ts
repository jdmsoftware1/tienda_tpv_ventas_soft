import { Test, TestingModule } from '@nestjs/testing';
import { PagosController } from './pagos.controller';
import { PagosService } from './pagos.service';
import { CreatePagoDto } from './dto/create-pago.dto';

describe('PagosController', () => {
  let controller: PagosController;
  let service: PagosService;

  const mockPago = {
    id: '1',
    cliente_id: 'cliente-1',
    monto: 50.00,
    descripcion: 'Pago de prueba',
    created_at: new Date(),
    cliente: {
      id: 'cliente-1',
      nombre: 'Cliente Test',
    },
  };

  const mockPagosService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByCliente: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PagosController],
      providers: [
        {
          provide: PagosService,
          useValue: mockPagosService,
        },
      ],
    }).compile();

    controller = module.get<PagosController>(PagosController);
    service = module.get<PagosService>(PagosService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new pago', async () => {
      const createDto: CreatePagoDto = {
        cliente_id: 'cliente-1',
        monto: 50.00,
        descripcion: 'Pago de prueba',
      };

      mockPagosService.create.mockResolvedValue(mockPago);

      const result = await controller.create(createDto);

      expect(service.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(mockPago);
    });
  });

  describe('findAll', () => {
    it('should return an array of pagos', async () => {
      const pagos = [mockPago];
      mockPagosService.findAll.mockResolvedValue(pagos);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual(pagos);
    });
  });

  describe('findOne', () => {
    it('should return a pago by id', async () => {
      mockPagosService.findOne.mockResolvedValue(mockPago);

      const result = await controller.findOne('1');

      expect(service.findOne).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockPago);
    });
  });

  describe('findByCliente', () => {
    it('should return pagos by cliente_id', async () => {
      const pagos = [mockPago];
      mockPagosService.findByCliente.mockResolvedValue(pagos);

      const result = await controller.findByCliente('cliente-1');

      expect(service.findByCliente).toHaveBeenCalledWith('cliente-1');
      expect(result).toEqual(pagos);
    });
  });

  describe('remove', () => {
    it('should remove a pago', async () => {
      mockPagosService.remove.mockResolvedValue(undefined);

      await controller.remove('1');

      expect(service.remove).toHaveBeenCalledWith('1');
    });
  });
});
