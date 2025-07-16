import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ResponseInterceptor } from '@/interceptors/response.interceptor';
import { HttpExceptionFilter } from '@/filters/http-exception.filter';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 获取配置服务
  const configService = app.get(ConfigService);
  const nodeEnv = configService.get<string>('nodeEnv', 'production');
  const port = configService.get<number>('port', 3000);
  const isProduction = configService.get<boolean>('isProduction', true);

  // 获取 Reflector 实例
  const reflector = app.get(Reflector);

  // 全局应用响应拦截器
  app.useGlobalInterceptors(new ResponseInterceptor(reflector));

  // 全局应用异常过滤器
  app.useGlobalFilters(new HttpExceptionFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      disableErrorMessages: isProduction,
      whitelist: true,
      transform: true,
    })
  );

  await app.listen(port);

  Logger.log(`🚀 Application is running on: http://localhost:${port}`, 'Bootstrap');
  Logger.log(`🌍 Environment: ${nodeEnv}`, 'Bootstrap');
}

bootstrap();
