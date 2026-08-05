import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Attachment } from './entities/attachment.entity';

@Injectable()
export class AttachmentsService {
  constructor(
    @InjectRepository(Attachment)
    private readonly attachmentRepository: Repository<Attachment>,
  ) {}

  async create(data: Partial<Attachment>): Promise<Attachment> {
    const attachment = this.attachmentRepository.create(data);
    return this.attachmentRepository.save(attachment);
  }
}
