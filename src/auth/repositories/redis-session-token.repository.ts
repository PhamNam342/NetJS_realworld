// sunlint-disable S041
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';
// Cấu hình các khóa Redis cho việc quản lý token bị thu hồi và phiên đăng nhập
const AUTH_REVOKED_KEY_NAMESPACE = 'auth:revoked';
const AUTH_SESSION_KEY_NAMESPACE = 'auth:session';
@Injectable()
export class RedisSessionTokenRepository
  implements OnModuleInit, OnModuleDestroy
{
  private readonly client: RedisClientType;

  constructor() {
    this.client = createClient({
      url: process.env.REDIS_URL ?? 'redis://localhost:6379',
    });
  }
  // Kết nối đến Redis khi module được khởi tạo
  async onModuleInit(): Promise<void> {
    await this.client.connect();
  }
  async onModuleDestroy(): Promise<void> {
    if (this.client.isOpen) {
      await this.client.quit();
    }
  }

  async saveRevokedTokenId(jti: string, ttl: number): Promise<void> {
    await this.client.set(this.getRevokedTokenKey(jti), '1', {
      EX: ttl,
    });
  }

  async findRevokedTokenId(jti: string): Promise<string | null> {
    return this.client.get(this.getRevokedTokenKey(jti));
  }

  async saveActiveIdentity(userId: string, jti: string): Promise<void> {
    await this.client.set(this.getSessionKey(userId), jti);
  }

  async deleteSessionData(userId: string): Promise<void> {
    await this.client.del(this.getSessionKey(userId));
  }

  async deleteIdentityData(userId: string): Promise<void> {
    await this.deleteSessionData(userId);
  }

  async clearSessionData(userId: string): Promise<void> {
    await this.deleteSessionData(userId);
  }

  private getRevokedTokenKey(jti: string): string {
    return `${AUTH_REVOKED_KEY_NAMESPACE}:${jti}`;
  }

  private getSessionKey(userId: string): string {
    return `${AUTH_SESSION_KEY_NAMESPACE}:${userId}`;
  }
}
