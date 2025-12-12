import { Test, TestingModule } from '@nestjs/testing';
import { HorariosController } from './horarios.controller';
import { HorariosService } from './horarios.service';

describe('HorariosController', () => {
  let controller: HorariosController;
  let service: HorariosService;

  const mockHorariosService = {
    setHorarioSemanal: jest.fn(),
    getHorarioSemana: jest.fn(),
    getHorarioEmpleado: jest.fn(),
    copiarHorario: jest.fn(),
    getAllHorarios: jest.fn(),
    verifyChainIntegrity: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HorariosController],
      providers: [
        {
          provide: HorariosService,
          useValue: mockHorariosService,
        },
      ],
    }).compile();

    controller = module.get<HorariosController>(HorariosController);
    service = module.get<HorariosService>(HorariosService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('setHorarioSemanal', () => {
    it('should create a weekly schedule', async () => {
      const mockHorario = { id: '1', numero_semana: 50 };
      mockHorariosService.setHorarioSemanal.mockResolvedValue(mockHorario);

      const result = await controller.setHorarioSemanal('1', {
        anio: 2025,
        numero_semana: 50,
        horarios: [],
      });

      expect(result).toEqual(mockHorario);
      expect(service.setHorarioSemanal).toHaveBeenCalled();
    });
  });

  describe('getHorarioSemana', () => {
    it('should get schedule for a specific week', async () => {
      const mockHorario = { id: '1', numero_semana: 50 };
      mockHorariosService.getHorarioSemana.mockResolvedValue(mockHorario);

      const result = await controller.getHorarioSemana('1', '2025', '50');

      expect(result).toEqual(mockHorario);
      expect(service.getHorarioSemana).toHaveBeenCalledWith('1', 2025, 50);
    });
  });

  describe('copiarHorario', () => {
    it('should copy schedule between weeks', async () => {
      const mockHorario = { id: '2', numero_semana: 51 };
      mockHorariosService.copiarHorario.mockResolvedValue(mockHorario);

      const result = await controller.copiarHorario('1', {
        anio_origen: 2025,
        semana_origen: 50,
        anio_destino: 2025,
        semana_destino: 51,
      });

      expect(result).toEqual(mockHorario);
      expect(service.copiarHorario).toHaveBeenCalled();
    });
  });
});
