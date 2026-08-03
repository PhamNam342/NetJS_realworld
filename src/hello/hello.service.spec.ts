import { Test, TestingModule } from '@nestjs/testing';
import { I18nService } from 'nestjs-i18n';
import { HelloService } from './hello.service';

describe('HelloService', () => {
  let service: HelloService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HelloService,
        {
          provide: I18nService,
          useValue: {
            t: jest.fn().mockReturnValue('Hello World!'),
          },
        },
      ],
    }).compile();

    service = module.get<HelloService>(HelloService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
