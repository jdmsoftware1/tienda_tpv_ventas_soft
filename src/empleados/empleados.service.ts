import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Empleado } from '../entities/empleado.entity';
import { CreateEmpleadoDto } from './dto/create-empleado.dto';
import { UpdateEmpleadoDto } from './dto/update-empleado.dto';
import { authenticator } from 'otplib';
import * as QRCode from 'qrcode';

@Injectable()
export class EmpleadosService {
  constructor(
    @InjectRepository(Empleado)
    private empleadoRepository: Repository<Empleado>,
  ) {}

  async create(createEmpleadoDto: CreateEmpleadoDto): Promise<Empleado> {
    const exists = await this.empleadoRepository.findOne({
      where: { id_empleado: createEmpleadoDto.id_empleado },
    });

    if (exists) {
      throw new ConflictException('El ID de empleado ya existe');
    }

    const empleado = this.empleadoRepository.create(createEmpleadoDto);
    return this.empleadoRepository.save(empleado);
  }

  async findAll(): Promise<Empleado[]> {
    return this.empleadoRepository.find({
      relations: ['clientes'],
      order: { nombre: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Empleado> {
    const empleado = await this.empleadoRepository.findOne({
      where: { id },
      relations: ['clientes'],
    });

    if (!empleado) {
      throw new NotFoundException('Empleado no encontrado');
    }

    return empleado;
  }

  async update(id: string, updateEmpleadoDto: UpdateEmpleadoDto): Promise<Empleado> {
    const empleado = await this.findOne(id);

    if (updateEmpleadoDto.id_empleado && updateEmpleadoDto.id_empleado !== empleado.id_empleado) {
      const exists = await this.empleadoRepository.findOne({
        where: { id_empleado: updateEmpleadoDto.id_empleado },
      });

      if (exists) {
        throw new ConflictException('El ID de empleado ya existe');
      }
    }

    Object.assign(empleado, updateEmpleadoDto);
    return this.empleadoRepository.save(empleado);
  }

  async remove(id: string): Promise<void> {
    const empleado = await this.findOne(id);
    await this.empleadoRepository.remove(empleado);
  }

  async search(query: string): Promise<Empleado[]> {
    return this.empleadoRepository
      .createQueryBuilder('empleado')
      .where('empleado.nombre ILIKE :query OR empleado.id_empleado ILIKE :query', {
        query: `%${query}%`,
      })
      .getMany();
  }

  // Generar secreto TOTP y QR para empleado
  async generateTOTP(id: string): Promise<{ secret: string; qrCode: string; otpauth: string }> {
    const empleado = await this.findOne(id);
    
    // Generar secreto
    const secret = authenticator.generateSecret();
    
    // Crear URL otpauth
    const otpauth = authenticator.keyuri(
      empleado.id_empleado,
      'Tienda - Fichajes',
      secret,
    );
    
    // Generar QR code
    const qrCode = await QRCode.toDataURL(otpauth);
    
    // Guardar secreto (pero no habilitar aún)
    empleado.totp_secret = secret;
    empleado.totp_enabled = false;
    await this.empleadoRepository.save(empleado);
    
    return { secret, qrCode, otpauth };
  }

  // Habilitar TOTP verificando el primer código
  async enableTOTP(id: string, token: string): Promise<Empleado> {
    const empleado = await this.findOne(id);
    
    if (!empleado.totp_secret) {
      throw new ConflictException('Primero debe generar el código QR');
    }
    
    // Verificar token
    const isValid = authenticator.verify({
      token,
      secret: empleado.totp_secret,
    });
    
    if (!isValid) {
      throw new ConflictException('Código de verificación inválido');
    }
    
    empleado.totp_enabled = true;
    return this.empleadoRepository.save(empleado);
  }

  // Deshabilitar TOTP
  async disableTOTP(id: string): Promise<Empleado> {
    const empleado = await this.findOne(id);
    
    empleado.totp_enabled = false;
    empleado.totp_secret = null;
    return this.empleadoRepository.save(empleado);
  }

  // Obtener estado TOTP del empleado
  async getTOTPStatus(id: string): Promise<{ enabled: boolean; hasSecret: boolean }> {
    const empleado = await this.findOne(id);
    
    return {
      enabled: empleado.totp_enabled,
      hasSecret: !!empleado.totp_secret,
    };
  }
}
