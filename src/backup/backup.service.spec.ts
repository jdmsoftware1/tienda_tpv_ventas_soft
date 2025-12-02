import { Test, TestingModule } from '@nestjs/testing';
import { BackupService } from './backup.service';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';

jest.mock('fs');

describe('BackupService', () => {
  let service: BackupService;
  let dataSource: DataSource;

  const mockEntityMetadata = [
    {
      name: 'Cliente',
      tableName: 'clientes',
    },
  ];

  const mockRepository = {
    find: jest.fn().mockResolvedValue([
      { id: '1', nombre: 'Cliente Test', telefono: '123456789' },
    ]),
  };

  const mockDataSource = {
    entityMetadatas: mockEntityMetadata,
    getRepository: jest.fn().mockReturnValue(mockRepository),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('test-value'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BackupService,
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<BackupService>(BackupService);
    dataSource = module.get<DataSource>(DataSource);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createBackup', () => {
    it('should create a backup file', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.writeFileSync as jest.Mock).mockImplementation(() => {});

      const result = await service.createBackup();

      expect(result).toHaveProperty('filename');
      expect(result).toHaveProperty('path');
      expect(result.filename).toMatch(/^backup-.*\.sql$/);
      expect(fs.writeFileSync).toHaveBeenCalled();
    });

    it('should create backups directory if it does not exist', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      (fs.mkdirSync as jest.Mock).mockImplementation(() => {});
      (fs.writeFileSync as jest.Mock).mockImplementation(() => {});

      await service.createBackup();

      expect(fs.mkdirSync).toHaveBeenCalledWith(
        expect.stringContaining('backups'),
        { recursive: true },
      );
    });
  });

  describe('listBackups', () => {
    it('should return list of backup files', async () => {
      const mockFiles = ['backup-2024-01-01.sql', 'backup-2024-01-02.sql', 'other.txt'];
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readdirSync as jest.Mock).mockReturnValue(mockFiles);

      const result = await service.listBackups();

      expect(result).toEqual(['backup-2024-01-01.sql', 'backup-2024-01-02.sql']);
    });

    it('should return empty array if backups directory does not exist', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      const result = await service.listBackups();

      expect(result).toEqual([]);
    });
  });

  describe('downloadBackup', () => {
    it('should return backup file buffer', async () => {
      const mockBuffer = Buffer.from('-- SQL Backup');
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue(mockBuffer);

      const result = await service.downloadBackup('backup-2024-01-01.sql');

      expect(result).toEqual(mockBuffer);
    });

    it('should throw error if backup file not found', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      await expect(service.downloadBackup('nonexistent.sql')).rejects.toThrow(
        'Backup file not found',
      );
    });
  });
});
