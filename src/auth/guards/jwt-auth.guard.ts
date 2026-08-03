import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
//kích hoạt JwtStrategy trước khi chạy Controller.
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
