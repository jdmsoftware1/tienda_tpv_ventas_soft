import { Test, TestingModule } from '@nestjs/testing';
import { BackupController } from './backup.controller';
import { BackupService } from './backup.service';

describe('BackupController', () => {
  let controller: BackupController;
  let service: BackupService;

  const mockBackupService = {
    createBackup: jest.fn(),
    listBackups: jest.fn(),
    downloadBackup: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BackupController],
      providers: [
        {
          provide: BackupService,
          useValue: mockBackupService,
        },
      ],
    }).compile();

    controller = module.get<BackupController>(BackupController);
    service = module.get<BackupService>(BackupService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createBackup', () => {
    it('should create a backup', async () => {
      const backupResult = {
        filename: 'backup-2024-01-01.sql',
        path: '/backups/backup-2024-01-01.sql',
      };

      mockBackupService.createBackup.mockResolvedValue(backupResult);

      const result = await controller.createBackup();

      expect(service.createBackup).toHaveBeenCalled();
      expect(result).toEqual(backupResult);
    });
  });

  describe('listBackups', () => {
    it('should return list of backups', async () => {
      const backups = ['backup-2024-01-01.sql', 'backup-2024-01-02.sql'];

      mockBackupService.listBackups.mockResolvedValue(backups);

      const result = await controller.listBackups();

      expect(service.listBackups).toHaveBeenCalled();
      expect(result).toEqual(backups);
    });
  });

  describe('downloadBackup', () => {
    it('should download a backup file', async () => {
      const mockBuffer = Buffer.from('-- SQL Backup');
      const mockResponse = {
        setHeader: jest.fn(),
        send: jest.fn(),
      };

      mockBackupService.downloadBackup.mockResolvedValue(mockBuffer);

      await controller.downloadBackup('backup-2024-01-01.sql', mockResponse as any);

      expect(service.downloadBackup).toHaveBeenCalledWith('backup-2024-01-01.sql');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Type', 'application/sql');
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        'attachment; filename="backup-2024-01-01.sql"',
      );
      expect(mockResponse.send).toHaveBeenCalledWith(mockBuffer);
    });
  });
});
