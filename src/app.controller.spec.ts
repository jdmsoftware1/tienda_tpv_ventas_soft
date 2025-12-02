import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return API info object', () => {
      const result = appController.getHello();
      expect(result).toHaveProperty('message', 'Sistema de Gestión de Tienda - API');
      expect(result).toHaveProperty('version', '1.0.0');
      expect(result).toHaveProperty('status', 'running');
      expect(result).toHaveProperty('endpoints');
      expect(result).toHaveProperty('documentation');
    });
  });

  describe('debug/oauth', () => {
    it('should return OAuth config', () => {
      const result = appController.getOAuthConfig();
      expect(result).toHaveProperty('clientId');
      expect(result).toHaveProperty('callbackUrl');
      expect(result).toHaveProperty('frontendUrl');
    });
  });
});
