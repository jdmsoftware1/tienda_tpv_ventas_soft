import { Test, TestingModule } from '@nestjs/testing';
import { BajasMedicasController } from './bajas-medicas.controller';
import { BajasMedicasService } from './bajas-medicas.service';

describe('BajasMedicasController', () => {
  let controller: BajasMedicasController;
  let service: BajasMedicasService;

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findByEmpleado: jest.fn(),
    findActivas: jest.fn(),
    verifyIntegrity: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BajasMedicasController],
      providers: [
        {
          provide: BajasMedicasService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<BajasMedicasController>(BajasMedicasController);
    service = module.get<BajasMedicasService>(BajasMedicasService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a medical leave', async () => {
      const mockBaja = { id: '1', tipo: 'enfermedad_comun' };
      mockService.create.mockResolvedValue(mockBaja);

      const result = await controller.create({
        empleadoId: '1',
        fecha_inicio: new Date(),
        fecha_fin: new Date(),
        tipo: 'enfermedad_comun' as any,
        diagnostico: 'Test',
        observaciones: '',
        documento_justificativo: '',
      });

      expect(result).toEqual(mockBaja);
      expect(service.create).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all medical leaves', async () => {
      const mockBajas = [{ id: '1' }];
      mockService.findAll.mockResolvedValue(mockBajas);

      const result = await controller.findAll();

      expect(result).toEqual(mockBajas);
      expect(service.findAll).toHaveBeenCalled();
    });
  });
});
