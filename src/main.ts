import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const API_PREFIX = 'api';
  const SWAGGER_PATH = `${API_PREFIX}/docs`;
  app.setGlobalPrefix('api');
  // Mở các CORS để cho phép các yêu cầu từ các nguồn khác nhau
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );
  const config = new DocumentBuilder()
    .setTitle('RealWorld API')
    .setDescription('NestJS Tutorial')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup(SWAGGER_PATH, app, document);
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
