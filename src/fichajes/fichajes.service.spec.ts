import { Test, TestingModule } from '@nestjs/testing';
import { FichajesService } from './fichajes.service';

describe('FichajesService', () => {
  let service: FichajesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FichajesService],
    }).compile();

    service = module.get<FichajesService>(FichajesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
