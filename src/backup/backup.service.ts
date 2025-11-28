import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class BackupService {
  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
    private configService: ConfigService,
  ) {}

  async createBackup(): Promise<{ filename: string; path: string }> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup-${timestamp}.sql`;
    const backupDir = path.join(process.cwd(), 'backups');
    const backupPath = path.join(backupDir, filename);

    // Create backups directory if it doesn't exist
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // Get all entities
    const entities = this.dataSource.entityMetadatas;
    let sqlDump = '-- Database Backup\n';
    sqlDump += `-- Created at: ${new Date().toISOString()}\n\n`;

    for (const entity of entities) {
      const tableName = entity.tableName;
      const repository = this.dataSource.getRepository(entity.name);
      const data = await repository.find();

      if (data.length > 0) {
        sqlDump += `-- Table: ${tableName}\n`;
        sqlDump += `DELETE FROM "${tableName}";\n`;

        for (const row of data) {
          const columns = Object.keys(row);
          const values = columns.map((col) => {
            const value = row[col];
            if (value === null) return 'NULL';
            if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
            if (value instanceof Date) return `'${value.toISOString()}'`;
            return value;
          });

          sqlDump += `INSERT INTO "${tableName}" (${columns.map(c => `"${c}"`).join(', ')}) VALUES (${values.join(', ')});\n`;
        }
        sqlDump += '\n';
      }
    }

    fs.writeFileSync(backupPath, sqlDump, 'utf8');

    return {
      filename,
      path: backupPath,
    };
  }

  async listBackups(): Promise<string[]> {
    const backupDir = path.join(process.cwd(), 'backups');

    if (!fs.existsSync(backupDir)) {
      return [];
    }

    return fs.readdirSync(backupDir).filter((file) => file.endsWith('.sql'));
  }

  async downloadBackup(filename: string): Promise<Buffer> {
    const backupPath = path.join(process.cwd(), 'backups', filename);

    if (!fs.existsSync(backupPath)) {
      throw new Error('Backup file not found');
    }

    return fs.readFileSync(backupPath);
  }
}
