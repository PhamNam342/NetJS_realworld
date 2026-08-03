import { Injectable } from '@nestjs/common';
import { RedisSessionTokenRepository } from '../repositories/redis-session-token.repository';

@Injectable()
export class RedisTokenBlacklistService {
  constructor(
    private readonly sessionTokenRepository: RedisSessionTokenRepository,
  ) {}
  // Revoke the current token by storing its JTI in Redis with a TTL.
  async invalidateToken(jti: string, expiresAt: number): Promise<void> {
    const ttl = expiresAt - Math.floor(Date.now() / 1000);

    if (ttl <= 0) {
      return;
    }

    await this.sessionTokenRepository.saveRevokedTokenId(jti, ttl);
  }

  async blacklistToken(jti: string, expiresAt: number): Promise<void> {
    await this.invalidateToken(jti, expiresAt);
  }

  // Ghi nhận phiên đăng nhập mới và lưu jti vào Redis
  async recordActiveSession(userId: string, jti: string): Promise<void> {
    await this.sessionTokenRepository.saveActiveIdentity(userId, jti);
  }

  async delete(userId: string): Promise<void> {
    await this.sessionTokenRepository.deleteSessionData(userId);
  }

  // Xóa dữ liệu liên quan đến phiên đăng nhập của người dùng
  async clearSessionData(userId: string): Promise<void> {
    await this.delete(userId);
  }
  // Kiểm tra xem token có bị thu hồi hay không
  async isTokenRevoked(jti: string): Promise<boolean> {
    const value = await this.sessionTokenRepository.findRevokedTokenId(jti);

    return value === '1';
  }
}
