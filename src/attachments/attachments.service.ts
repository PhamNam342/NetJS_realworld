import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Attachment } from './entities/attachment.entity';
@Injectable()
export class AttachmentsService {
  constructor(
    @InjectRepository(Attachment)
    private readonly attachmentRepository: Repository<Attachment>,
  ) {}

  async create(
    data: Partial<Attachment>,
    manager?: EntityManager,
  ): Promise<Attachment> {
    const repository = manager
      ? manager.getRepository(Attachment)
      : this.attachmentRepository;
    const attachment = repository.create(data);
    return repository.save(attachment);
  }
}
