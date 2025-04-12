import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Enable CORS
  app.enableCors();

  // Глобальная валидация
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));

  // Swagger конфигурация
  const config = new DocumentBuilder()
    .setTitle('HypeTrain API')
    .setDescription('Authentication and Authorization API')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication and Authorization')
    .addTag('workspace', 'Workspace Management')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // Настройка микросервиса
  app.connectMicroservice({
    transport: Transport.TCP,
    options: {
      host: configService.get('AUTH_SERVICE_HOST'),
      port: configService.get('AUTH_SERVICE_PORT'),
    },
  });

  // Запуск микросервиса и HTTP сервера
  await app.startAllMicroservices();
  const port = configService.get('PORT') || 3000;
  await app.listen(port);
  console.log(`Application is running on port ${port}`);
  console.log(`Swagger documentation is available at http://localhost:${port}/api`);
}
bootstrap();
