import { ConfigService } from '@nestjs/config';
const JWT_CONFIG_KEY = 'JWT_SECRET';
class JwtSecretConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'JwtSecretConfigurationError';
  }
}
export function getJwtSecret(configService: ConfigService): string {
  const jwtSecret = configService.get<string>(JWT_CONFIG_KEY);

  if (!jwtSecret) {
    throw new JwtSecretConfigurationError(`${JWT_CONFIG_KEY} is required`);
  }
  return jwtSecret;
}
