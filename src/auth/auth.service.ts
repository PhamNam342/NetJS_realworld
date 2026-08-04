import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'crypto';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { AuthenticatedUser } from './interfaces/authenticated-user.interface';
import { RedisTokenBlacklistService } from './services/redis-token-blacklist.service';
const JWT_ACCESS_TOKEN_EXPIRES_IN = '1h';

type AuthUserResponse = {
  user: {
    id: string;
    username: string;
    email: string;
    bio?: string | null;
    image?: string | null;
    token?: string;
  };
};

type LogoutResponse = {
  message: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UsersService,
    private readonly jwtService: JwtService,
    private readonly tokenBlacklistService: RedisTokenBlacklistService,
    private readonly i18n: I18nService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthUserResponse> {
    const existedUser = await this.userService.findByEmail(dto.email);
    if (existedUser) {
      throw new ConflictException(this.i18n.t('auth.userAlreadyExists'));
    }
    const hashPassword = await bcrypt.hash(dto.password, 10);
    const user = await this.userService.create({
      username: dto.username,
      email: dto.email,
      password: hashPassword,
    });

    const { token, jti } = this.signToken(user);
    await this.tokenBlacklistService.recordActiveSession(user.id, jti);

    return this.toAuthUserResponse(user, token);
  }

  async login(dto: LoginDto): Promise<AuthUserResponse> {
    const user = await this.userService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException(this.i18n.t('auth.invalidCredentials'));
    }
    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException(this.i18n.t('auth.invalidCredentials'));
    }
    // ghi nhận phiên đăng nhập mới và lưu jti vào Redis
    const { token, jti } = this.signToken(user);
    await this.tokenBlacklistService.recordActiveSession(user.id, jti);
    return this.toAuthUserResponse(user, token);
  }

  async endSession(user: AuthenticatedUser): Promise<LogoutResponse> {
    // Thu hồi token hiện tại bằng cách lưu jti vào Redis với TTL.
    await Promise.all([
      this.tokenBlacklistService.invalidateToken(user.jti, user.exp),
      this.tokenBlacklistService.delete(user.id),
    ]);
    return {
      message: this.i18n.t('auth.loggedOutSuccessfully'),
    };
  }

  private signToken(user: User): { token: string; jti: string } {
    const jti = randomUUID();
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      username: user.username,
      jti,
    };

    return {
      token: this.jwtService.sign(payload, {
        expiresIn: JWT_ACCESS_TOKEN_EXPIRES_IN,
      }),
      jti,
    };
  }
  // Chuyển đổi thông tin người dùng thành định dạng phản hồi AuthUserResponse
  private toAuthUserResponse(user: User, token?: string): AuthUserResponse {
    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        bio: user.bio ?? null,
        image: user.image ?? null,
        ...(token ? { token } : {}),
      },
    };
  }
}
