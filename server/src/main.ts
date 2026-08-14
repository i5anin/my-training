import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.setGlobalPrefix('api');
  // Без этого onModuleDestroy не вызывается: long-poll бота не закрывается
  // корректно, и быстрый рестарт получает 409 от Telegram
  app.enableShutdownHooks();
  await app.listen(3778, '0.0.0.0');
  console.log('🏋️ Gym+ API running at http://localhost:3778');
}
bootstrap();
