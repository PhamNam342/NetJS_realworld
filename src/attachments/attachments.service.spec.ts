import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AttachmentsService } from './attachments.service';
import { Attachment } from './entities/attachment.entity';

describe('AttachmentsService', () => {
  let service: AttachmentsService;
  let repository: {
    create: jest.Mock;
    save: jest.Mock;
  };

  beforeEach(async () => {
    repository = {
      create: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttachmentsService,
        {
          provide: getRepositoryToken(Attachment),
          useValue: repository,
        },
      ],
    }).compile();

    service = module.get<AttachmentsService>(AttachmentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create an attachment', async () => {
    const payload = {
      fileName: 'avatar.png',
      fileType: 'image/png',
      fileSize: 123,
      url: '/uploads/avatar/avatar.png',
      attachableId: 'user-1',
      attachableType: 'USER',
    };

    const entity = { id: 'attachment-1', ...payload } as Attachment;
    repository.create.mockReturnValue(entity);
    repository.save.mockResolvedValue(entity);

    await expect(service.create(payload)).resolves.toEqual(entity);
    expect(repository.create).toHaveBeenCalledWith(payload);
    expect(repository.save).toHaveBeenCalledWith(entity);
  });
});
