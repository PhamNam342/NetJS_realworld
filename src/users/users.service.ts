import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { I18nService } from 'nestjs-i18n';
import { CreateUserDto } from './dto/create-user.dto';
import { DataSource, IsNull } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UpdateUserDto } from './dto/update-user.dto';
import { Attachment } from '../attachments/entities/attachment.entity';
import { AttachmentsService } from '../attachments/attachments.service';
const ATTACHABLE_TYPE_USER = 'USER';
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly dataSource: DataSource,
    private readonly attachmentsService: AttachmentsService,
    private readonly i18n: I18nService,
  ) {}
  async findAll(): Promise<User[]> {
    return this.userRepository.find();
  }
  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }
  async findByUsername(username: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: {
        username,
      },
    });
  }
  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }
  async create(data: CreateUserDto): Promise<User> {
    const user = this.userRepository.create(data);
    return this.userRepository.save(user);
  }
  // update user
  async updateProfile(
    userId: string,
    dto: UpdateUserDto,
    file?: Express.Multer.File,
  ): Promise<User> {
    return this.dataSource.transaction(async (manager) => {
      const userRepository = manager.getRepository(User);
      const attachmentRepository = manager.getRepository(Attachment);

      const user = await userRepository.findOne({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException(this.i18n.t('users.notFound'));
      }

      const updateData: Partial<User> = {
        ...dto,
      };

      if (dto.password) {
        updateData.password = await bcrypt.hash(dto.password, 10);
      }

      if (file) {
        const oldAttachment = await attachmentRepository.findOne({
          where: {
            attachableId: userId,
            attachableType: ATTACHABLE_TYPE_USER,
            deletedAt: IsNull(),
          },
        });

        if (oldAttachment) {
          oldAttachment.deletedAt = new Date();
          await attachmentRepository.save(oldAttachment);
        }

        const attachment = await this.attachmentsService.create(
          {
            fileName: file.filename,
            fileType: file.mimetype,
            fileSize: file.size,
            url: `/uploads/avatar/${file.filename}`,
            attachableId: userId,
            attachableType: ATTACHABLE_TYPE_USER,
          },
          manager,
        );

        updateData.image = attachment.url;
      }
      await userRepository.update(userId, updateData);
      const updatedUser = await userRepository.findOne({
        where: { id: userId },
      });
      if (!updatedUser) {
        throw new NotFoundException(this.i18n.t('users.notFound'));
      }
      return updatedUser;
    });
  }
  async delete(id: string): Promise<void> {
    await this.userRepository.delete(id);
  }
}
