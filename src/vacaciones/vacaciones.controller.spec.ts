import { Test, TestingModule } from '@nestjs/testing';
import { VacacionesController } from './vacaciones.controller';
import { VacacionesService } from './vacaciones.service';

describe('VacacionesController', () => {
  let controller: VacacionesController;
  let service: VacacionesService;

  const mockService = {
    solicitar: jest.fn(),
    aprobar: jest.fn(),
    rechazar: jest.fn(),
    findAll: jest.fn(),
    findByEmpleado: jest.fn(),
    findPendientes: jest.fn(),
    verifyChainIntegrity: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VacacionesController],
      providers: [
        {
          provide: VacacionesService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<VacacionesController>(VacacionesController);
    service = module.get<VacacionesService>(VacacionesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('solicitar', () => {
    it('should create a vacation request', async () => {
      const mockVacacion = { id: '1', estado: 'pendiente' };
      mockService.solicitar.mockResolvedValue(mockVacacion);

      const result = await controller.solicitar({
        empleadoId: '1',
        fecha_inicio: '2025-12-20',
        fecha_fin: '2025-12-27',
        motivo: 'Navidad',
      });

      expect(result).toEqual(mockVacacion);
      expect(service.solicitar).toHaveBeenCalled();
    });
  });

  describe('aprobar', () => {
    it('should approve a vacation', async () => {
      const mockVacacion = { id: '1', estado: 'aprobada' };
      mockService.aprobar.mockResolvedValue(mockVacacion);

      const req = { user: { id: 'user1' } };
      const result = await controller.aprobar('1', { observaciones: 'OK' }, req);

      expect(result).toEqual(mockVacacion);
      expect(service.aprobar).toHaveBeenCalledWith('1', 'user1', 'OK');
    });
  });

  describe('rechazar', () => {
    it('should reject a vacation', async () => {
      const mockVacacion = { id: '1', estado: 'rechazada' };
      mockService.rechazar.mockResolvedValue(mockVacacion);

      const req = { user: { id: 'user1' } };
      const result = await controller.rechazar('1', { observaciones: 'No' }, req);

      expect(result).toEqual(mockVacacion);
      expect(service.rechazar).toHaveBeenCalledWith('1', 'user1', 'No');
    });
  });

  describe('findAll', () => {
    it('should return all vacations', async () => {
      const mockVacaciones = [{ id: '1' }];
      mockService.findAll.mockResolvedValue(mockVacaciones);

      const result = await controller.findAll();

      expect(result).toEqual(mockVacaciones);
      expect(service.findAll).toHaveBeenCalled();
    });
  });
});
