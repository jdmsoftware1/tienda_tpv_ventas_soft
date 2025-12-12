import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserRole } from '../entities/user.entity';

describe('AuthController - Security Tests', () => {
  let controller: AuthController;
  let service: AuthService;

  const mockUser = {
    id: '1',
    email: 'test@example.com',
    nombre: 'Test User',
    role: UserRole.EMPLOYEE,
  };

  const mockAuthService = {
    validateGoogleUser: jest.fn(),
    login: jest.fn(),
    logout: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('Security: Google OAuth Callback', () => {
    it('should redirect with token on successful authentication', async () => {
      const mockResponse = {
        redirect: jest.fn(),
      } as any;

      const mockRequest = {
        user: {
          email: 'test@example.com',
          nombre: 'Test',
          google_id: 'google123',
        },
      };

      mockAuthService.validateGoogleUser.mockResolvedValue(mockUser);
      mockAuthService.login.mockResolvedValue({
        access_token: 'mock-token',
        expires_in: 7200,
        user: mockUser,
      });

      await controller.googleAuthRedirect(mockRequest, mockResponse);

      expect(mockResponse.redirect).toHaveBeenCalled();
      expect(mockResponse.redirect).toHaveBeenCalledWith(
        expect.stringContaining('token=mock-token'),
      );
      expect(mockResponse.redirect).toHaveBeenCalledWith(
        expect.stringContaining('expires_in=7200'),
      );
    });
  });

  describe('Security: Logout', () => {
    it('should call logout service and return success message', async () => {
      const mockRequest = {
        user: mockUser,
      };

      const authHeader = 'Bearer mock-token';
      mockAuthService.logout.mockResolvedValue(undefined);

      const result = await controller.logout(mockRequest, authHeader);

      expect(service.logout).toHaveBeenCalledWith('mock-token', mockUser.id);
      expect(result.message).toBe('Sesión cerrada correctamente');
    });

    it('should handle logout without authorization header', async () => {
      const mockRequest = {
        user: mockUser,
      };

      mockAuthService.logout.mockResolvedValue(undefined);

      const result = await controller.logout(mockRequest, undefined as any);

      expect(service.logout).toHaveBeenCalled();
      expect(result.message).toBe('Sesión cerrada correctamente');
    });
  });

  describe('Security: Profile Access', () => {
    it('should return user profile for authenticated user', async () => {
      const mockRequest = {
        user: mockUser,
      };

      const result = await controller.getProfile(mockRequest);

      expect(result).toEqual(mockUser);
    });
  });
});
