import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User, UserRole } from '../entities/user.entity';
import { TokenBlacklist } from '../entities/token-blacklist.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(TokenBlacklist)
    private tokenBlacklistRepository: Repository<TokenBlacklist>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async validateGoogleUser(googleUser: any): Promise<User> {
    const { email, nombre, google_id } = googleUser;

    // Check if email is authorized
    const authorizedEmails = this.configService
      .get('AUTHORIZED_EMAILS')
      .split(',')
      .map((e: string) => e.trim());

    if (!authorizedEmails.includes(email)) {
      throw new ForbiddenException('Email not authorized');
    }

    // Check if user exists
    let user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      // Create new user
      const adminEmails = this.configService
        .get('ADMIN_EMAILS')
        .split(',')
        .map((e: string) => e.trim());

      const role = adminEmails.includes(email)
        ? UserRole.ADMIN
        : UserRole.EMPLOYEE;

      user = this.userRepository.create({
        email,
        nombre,
        google_id,
        role,
      });
      await this.userRepository.save(user);
    } else {
      // Update google_id if needed
      if (!user.google_id) {
        user.google_id = google_id;
        await this.userRepository.save(user);
      }
    }

    return user;
  }

  async validateUserById(userId: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id: userId } });
  }

  async login(user: User) {
    const payload = { email: user.email, sub: user.id, role: user.role };
    const token = this.jwtService.sign(payload);
    
    return {
      access_token: token,
      expires_in: 7200, // 2 horas en segundos
      user: {
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        role: user.role,
      },
    };
  }

  async logout(token: string, userId: string): Promise<void> {
    try {
      // Decodificar token para obtener fecha de expiración
      const decoded = this.jwtService.decode(token) as any;
      const expiresAt = new Date(decoded.exp * 1000);

      // Añadir token a la blacklist
      const blacklistedToken = this.tokenBlacklistRepository.create({
        token,
        user_id: userId,
        reason: 'logout',
        expires_at: expiresAt,
      });

      await this.tokenBlacklistRepository.save(blacklistedToken);

      // Limpiar tokens expirados (tarea de mantenimiento)
      await this.cleanExpiredTokens();
    } catch (error) {
      throw new UnauthorizedException('Error al cerrar sesión');
    }
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    const blacklisted = await this.tokenBlacklistRepository.findOne({
      where: { token },
    });
    return !!blacklisted;
  }

  private async cleanExpiredTokens(): Promise<void> {
    // Eliminar tokens que ya expiraron hace más de 1 día
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    await this.tokenBlacklistRepository.delete({
      expires_at: LessThan(oneDayAgo),
    });
  }
}
