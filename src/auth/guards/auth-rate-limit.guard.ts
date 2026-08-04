import { Injectable } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerModuleOptions } from '@nestjs/throttler';
import type { Request } from 'express';

const AUTH_TTL_MS = 60_000;
const AUTH_LIMIT = 3;
@Injectable()
export class AuthRateLimitGuard extends ThrottlerGuard {
  protected async getTracker(req: Request): Promise<string> {
    const forwardedFor = req.headers['x-forwarded-for'];
    const ip = Array.isArray(forwardedFor)
      ? forwardedFor[0]
      : (forwardedFor ?? req.ip ?? 'unknown');

    return Promise.resolve(String(ip));
  }

  protected async getThrottlerOptions(): Promise<ThrottlerModuleOptions> {
    return Promise.resolve([
      { name: 'auth', ttl: AUTH_TTL_MS, limit: AUTH_LIMIT },
    ]);
  }
}
