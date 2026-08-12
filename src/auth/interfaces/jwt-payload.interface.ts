export interface JwtPayload {
  sub: string; // user id
  email: string;
  username: string;
  jti: string; // id riêng của token, dùng để xác định token trong danh sách đen
  iat?: number;
  exp?: number;
}
