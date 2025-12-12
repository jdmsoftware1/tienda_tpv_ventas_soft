import { Test, TestingModule } from '@nestjs/testing';
import { FestivosService } from './festivos.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Festivo, TipoFestivo } from '../entities/festivo.entity';
import { Repository } from 'typeorm';

describe('FestivosService', () => {
  let service: FestivosService;
  let repository: Repository<Festivo>;

  const mockFestivo = {
    id: '1',
    fecha: new Date('2025-12-25'),
    nombre: 'Navidad',
    tipo: TipoFestivo.NACIONAL,
    hash: 'test-hash',
    hash_anterior: null,
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FestivosService,
        {
          provide: getRepositoryToken(Festivo),
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

    service = module.get<FestivosService>(FestivosService);
    repository = module.get<Repository<Festivo>>(
      getRepositoryToken(Festivo),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a holiday', async () => {
      jest.spyOn(repository, 'find').mockResolvedValue([]);
      jest.spyOn(repository, 'create').mockReturnValue(mockFestivo as any);
      jest.spyOn(repository, 'save').mockResolvedValue(mockFestivo as any);

      const result = await service.create(
        new Date('2025-12-25'),
        'Navidad',
        TipoFestivo.NACIONAL,
      );

      expect(result).toBeDefined();
      expect(repository.save).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all holidays', async () => {
      jest.spyOn(repository, 'find').mockResolvedValue([mockFestivo] as any);

      const result = await service.findAll();

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('findByYear', () => {
    it('should return holidays for a specific year', async () => {
      jest.spyOn(repository, 'find').mockResolvedValue([mockFestivo] as any);

      const result = await service.findByYear(2025);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('isFestivo', () => {
    it('should check if a date is a holiday', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(mockFestivo as any);

      const result = await service.isFestivo(new Date('2025-12-25'));

      expect(result).toBe(true);
    });
  });
});
