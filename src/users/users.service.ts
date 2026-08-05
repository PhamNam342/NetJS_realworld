import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { I18nService } from 'nestjs-i18n';
import { CreateUserDto } from './dto/create-user.dto';
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
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
  async update(id: string, data: Partial<User>): Promise<User> {
    await this.userRepository.update(id, data);
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException(this.i18n.t('users.notFound'));
    }
    return user;
  }
  async delete(id: string): Promise<void> {
    await this.userRepository.delete(id);
  }
}
