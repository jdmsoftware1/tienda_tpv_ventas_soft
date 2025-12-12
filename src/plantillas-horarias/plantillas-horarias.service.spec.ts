import { Test, TestingModule } from '@nestjs/testing';
import { PlantillasHorariasService } from './plantillas-horarias.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PlantillaHoraria } from '../entities/plantilla-horaria.entity';
import { Repository } from 'typeorm';

describe('PlantillasHorariasService', () => {
  let service: PlantillasHorariasService;
  let repository: Repository<PlantillaHoraria>;

  const mockPlantilla = {
    id: '1',
    nombre: 'Jornada Partida',
    descripcion: 'Horario con descanso al mediodía',
    horarios: [
      {
        dia_semana: 'lunes',
        hora_entrada_manana: '09:00',
        hora_salida_manana: '14:00',
        hora_entrada_tarde: '16:00',
        hora_salida_tarde: '20:00',
        es_dia_libre: false,
      },
    ],
    hash: 'test-hash',
    hash_anterior: null,
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlantillasHorariasService,
        {
          provide: getRepositoryToken(PlantillaHoraria),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PlantillasHorariasService>(PlantillasHorariasService);
    repository = module.get<Repository<PlantillaHoraria>>(
      getRepositoryToken(PlantillaHoraria),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a template', async () => {
      jest.spyOn(repository, 'find').mockResolvedValue([]);
      jest.spyOn(repository, 'create').mockReturnValue(mockPlantilla as any);
      jest.spyOn(repository, 'save').mockResolvedValue(mockPlantilla as any);

      const result = await service.create({
        nombre: 'Jornada Partida',
        descripcion: 'Test',
        horarios: [],
      });

      expect(result).toBeDefined();
      expect(repository.save).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all templates', async () => {
      jest.spyOn(repository, 'find').mockResolvedValue([mockPlantilla] as any);

      const result = await service.findAll();

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('findOne', () => {
    it('should return a template by id', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(mockPlantilla as any);

      const result = await service.findOne('1');

      expect(result).toBeDefined();
      expect(result?.id).toBe('1');
    });
  });

  describe('remove', () => {
    it('should delete a template', async () => {
      jest.spyOn(repository, 'delete').mockResolvedValue({ affected: 1 } as any);

      await service.remove('1');

      expect(repository.delete).toHaveBeenCalledWith('1');
    });
  });
});
