import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { I18nService } from 'nestjs-i18n';
import { UsersService } from '../../users/users.service';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { AuthenticatedUser } from '../interfaces/authenticated-user.interface';
import { RedisTokenBlacklistService } from '../services/redis-token-blacklist.service';
import { getJwtSecret } from '../config/jwt-secret.config';
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly tokenBlacklistService: RedisTokenBlacklistService,
    private readonly i18n: I18nService,
  ) {
    super({
      // Chỉ lấy JWT từ Authorization: Bearer <token>
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: getJwtSecret(configService),
    });
  }
  // Được gọi sau khi Passport xác thực chữ ký và thời gian hết hạn của JWT
  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    // Kiểm tra token đã bị thu hồi (logout) hay chưa
    const isTokenRevoked = await this.tokenBlacklistService.isTokenRevoked(
      payload.jti,
    );

    if (isTokenRevoked) {
      throw new UnauthorizedException(this.i18n.t('auth.invalidToken'));
    }
    // Kiểm tra người dùng còn tồn tại trong hệ thống
    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException(this.i18n.t('auth.invalidToken'));
    }
    // Thông tin này sẽ được gán vào request.user
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      bio: user.bio ?? null,
      image: user.image ?? null,
      jti: payload.jti,
      exp: payload.exp ?? 0,
    };
  }
}
