import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User, UserRole } from '../entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
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
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        role: user.role,
      },
    };
  }
}
