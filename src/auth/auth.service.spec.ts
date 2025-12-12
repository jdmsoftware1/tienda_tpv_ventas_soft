import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User, UserRole } from '../entities/user.entity';
import { TokenBlacklist } from '../entities/token-blacklist.entity';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';

describe('AuthService - Security Tests', () => {
  let service: AuthService;
  let userRepository: Repository<User>;
  let tokenBlacklistRepository: Repository<TokenBlacklist>;
  let jwtService: JwtService;
  let configService: ConfigService;

  const mockUser = {
    id: '1',
    email: 'authorized@example.com',
    nombre: 'Test User',
    google_id: 'google123',
    role: UserRole.EMPLOYEE,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(TokenBlacklist),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(() => 'mock-jwt-token'),
            decode: jest.fn(() => ({ exp: Math.floor(Date.now() / 1000) + 7200 })),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'AUTHORIZED_EMAILS') return 'authorized@example.com,admin@example.com';
              if (key === 'ADMIN_EMAILS') return 'admin@example.com';
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    tokenBlacklistRepository = module.get<Repository<TokenBlacklist>>(
      getRepositoryToken(TokenBlacklist),
    );
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Security: Email Authorization', () => {
    it('should reject unauthorized email', async () => {
      const unauthorizedUser = {
        email: 'unauthorized@example.com',
        nombre: 'Unauthorized',
        google_id: 'google456',
      };

      await expect(
        service.validateGoogleUser(unauthorizedUser),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should accept authorized email', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(userRepository, 'create').mockReturnValue(mockUser as any);
      jest.spyOn(userRepository, 'save').mockResolvedValue(mockUser as any);

      const authorizedUser = {
        email: 'authorized@example.com',
        nombre: 'Authorized',
        google_id: 'google123',
      };

      const result = await service.validateGoogleUser(authorizedUser);

      expect(result).toBeDefined();
      expect(result.email).toBe('authorized@example.com');
    });

    it('should assign ADMIN role to admin emails', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);
      const adminUser = {
        ...mockUser,
        email: 'admin@example.com',
        role: UserRole.ADMIN,
      };
      jest.spyOn(userRepository, 'create').mockReturnValue(adminUser as any);
      jest.spyOn(userRepository, 'save').mockResolvedValue(adminUser as any);

      const result = await service.validateGoogleUser({
        email: 'admin@example.com',
        nombre: 'Admin',
        google_id: 'google789',
      });

      expect(result.role).toBe(UserRole.ADMIN);
    });
  });

  describe('Security: Token Management', () => {
    it('should generate JWT token with 2 hour expiration', async () => {
      const loginData = await service.login(mockUser as User);

      expect(loginData.access_token).toBeDefined();
      expect(loginData.expires_in).toBe(7200); // 2 horas en segundos
      expect(jwtService.sign).toHaveBeenCalled();
    });

    it('should add token to blacklist on logout', async () => {
      const token = 'mock-jwt-token';
      jest.spyOn(tokenBlacklistRepository, 'create').mockReturnValue({} as any);
      jest.spyOn(tokenBlacklistRepository, 'save').mockResolvedValue({} as any);
      jest.spyOn(tokenBlacklistRepository, 'delete').mockResolvedValue({} as any);

      await service.logout(token, mockUser.id);

      expect(tokenBlacklistRepository.create).toHaveBeenCalled();
      expect(tokenBlacklistRepository.save).toHaveBeenCalled();
    });

    it('should detect blacklisted tokens', async () => {
      const token = 'blacklisted-token';
      jest.spyOn(tokenBlacklistRepository, 'findOne').mockResolvedValue({
        id: '1',
        token,
        user_id: mockUser.id,
        reason: 'logout',
        expires_at: new Date(),
        created_at: new Date(),
      });

      const isBlacklisted = await service.isTokenBlacklisted(token);

      expect(isBlacklisted).toBe(true);
    });

    it('should not detect non-blacklisted tokens', async () => {
      const token = 'valid-token';
      jest.spyOn(tokenBlacklistRepository, 'findOne').mockResolvedValue(null);

      const isBlacklisted = await service.isTokenBlacklisted(token);

      expect(isBlacklisted).toBe(false);
    });
  });

  describe('Security: Session Validation', () => {
    it('should validate user by ID', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser as any);

      const result = await service.validateUserById(mockUser.id);

      expect(result).toBeDefined();
      expect(result?.id).toBe(mockUser.id);
    });

    it('should return null for invalid user ID', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      const result = await service.validateUserById('invalid-id');

      expect(result).toBeNull();
    });

    it('should throw error on logout with invalid token', async () => {
      jest.spyOn(jwtService, 'decode').mockReturnValue(null);

      await expect(
        service.logout('invalid-token', mockUser.id),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('Security: Google OAuth Integration', () => {
    it('should create new user on first Google login', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(userRepository, 'create').mockReturnValue(mockUser as any);
      jest.spyOn(userRepository, 'save').mockResolvedValue(mockUser as any);

      const googleUser = {
        email: 'authorized@example.com',
        nombre: 'New User',
        google_id: 'google999',
      };

      const result = await service.validateGoogleUser(googleUser);

      expect(userRepository.create).toHaveBeenCalled();
      expect(userRepository.save).toHaveBeenCalled();
      expect(result.email).toBe(googleUser.email);
    });

    it('should update google_id for existing user without it', async () => {
      const existingUser = { ...mockUser, google_id: null };
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(existingUser as any);
      jest.spyOn(userRepository, 'save').mockResolvedValue({
        ...existingUser,
        google_id: 'google123',
      } as any);

      const result = await service.validateGoogleUser({
        email: mockUser.email,
        nombre: mockUser.nombre,
        google_id: 'google123',
      });

      expect(userRepository.save).toHaveBeenCalled();
      expect(result.google_id).toBe('google123');
    });
  });
});
