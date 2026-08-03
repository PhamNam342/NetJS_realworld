import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RedisSessionTokenRepository } from './repositories/redis-session-token.repository';
import { RedisTokenBlacklistService } from './services/redis-token-blacklist.service';
import { getJwtSecret } from './config/jwt-secret.config';
@Module({
  imports: [
    UsersModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: getJwtSecret(configService),
        signOptions: { expiresIn: '1h' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    RedisTokenBlacklistService,
    RedisSessionTokenRepository,
  ],
  exports: [AuthService],
})
export class AuthModule {}
