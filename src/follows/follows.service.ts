import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { I18nService } from 'nestjs-i18n';

import { Follow } from './entities/follow.entity';
import { UsersService } from '../users/users.service';
import { ProfileResponseDto } from '../users/dto/profile-response.dto';

@Injectable()
export class FollowsService {
  constructor(
    @InjectRepository(Follow)
    private readonly followRepository: Repository<Follow>,
    private readonly usersService: UsersService,
    private readonly i18n: I18nService,
  ) {}

  // GET /api/profiles/:username
  async findProfile(
    username: string,
    currentUserId?: string,
  ): Promise<ProfileResponseDto> {
    const user = await this.usersService.findByUsername(username);

    if (!user) {
      throw new NotFoundException(this.i18n.t('users.notFound'));
    }

    const isFollowingUser = currentUserId
      ? await this.isFollowing(currentUserId, user.id)
      : false;

    return new ProfileResponseDto({
      username: user.username,
      bio: user.bio,
      image: user.image,
      following: isFollowingUser,
    });
  }

  // POST /api/profiles/:username/follow
  async follow(
    followerId: string,
    username: string,
  ): Promise<ProfileResponseDto> {
    const user = await this.usersService.findByUsername(username);

    if (!user) {
      throw new NotFoundException(this.i18n.t('users.notFound'));
    }

    if (followerId === user.id) {
      throw new UnprocessableEntityException(
        this.i18n.t('profile.cannotFollowYourself'),
      );
    }

    const isFollowingUser = await this.isFollowing(followerId, user.id);

    if (isFollowingUser) {
      throw new ConflictException(
        this.i18n.t('profile.alreadyFollowingThisUser'),
      );
    }

    const follow = this.followRepository.create({
      followerId,
      followingId: user.id,
    });

    await this.followRepository.save(follow);

    return this.findProfile(username, followerId);
  }

  // DELETE /api/profiles/:username/follow
  async unfollow(
    followerId: string,
    username: string,
  ): Promise<ProfileResponseDto> {
    const user = await this.usersService.findByUsername(username);

    if (!user) {
      throw new NotFoundException(this.i18n.t('users.notFound'));
    }

    const isFollowingUser = await this.isFollowing(followerId, user.id);

    if (!isFollowingUser) {
      throw new NotFoundException(this.i18n.t('profile.notFollowingThisUser'));
    }

    await this.followRepository.delete({
      followerId,
      followingId: user.id,
    });

    return this.findProfile(username, followerId);
  }

  // Kiểm tra quan hệ follow
  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const follow = await this.followRepository.findOne({
      where: {
        followerId,
        followingId,
      },
    });

    return Boolean(follow);
  }
  //
  async getFollowingIds(userId: string): Promise<string[]> {
    const follows = await this.followRepository.find({
      where: {
        followerId: userId,
      },
    });

    return follows.map((follow) => follow.followingId);
  }
  async getFollowingIdsByUserIds(
    followerId: string,
    userIds: string[],
  ): Promise<string[]> {
    if (userIds.length === 0) {
      return [];
    }

    const follows = await this.followRepository.find({
      where: userIds.map((followingId) => ({
        followerId,
        followingId,
      })),
    });

    return follows.map((follow) => follow.followingId);
  }
}
