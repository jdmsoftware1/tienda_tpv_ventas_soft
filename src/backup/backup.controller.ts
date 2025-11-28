import {
  Controller,
  Get,
  Post,
  Param,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { BackupService } from './backup.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../entities/user.entity';

@Controller('backup')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class BackupController {
  constructor(private readonly backupService: BackupService) {}

  @Post()
  async createBackup() {
    return this.backupService.createBackup();
  }

  @Get()
  async listBackups() {
    return this.backupService.listBackups();
  }

  @Get(':filename')
  async downloadBackup(
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    const fileBuffer = await this.backupService.downloadBackup(filename);
    res.setHeader('Content-Type', 'application/sql');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(fileBuffer);
  }
}
