import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe, Logger, LogLevel } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ResponseInterceptor } from '@/interceptors/response.interceptor';
import { HttpExceptionFilter } from '@/filters/http-exception.filter';
import { AppModule } from './app.module';

// 根据环境定义日志级别
const getLogLevels = (environment: string): LogLevel[] => {
  switch (environment) {
    case 'local':
      return ['verbose', 'debug', 'log', 'warn', 'error', 'fatal']; // 本地环境：所有级别
    case 'development':
      return ['debug', 'log', 'warn', 'error', 'fatal']; // 开发环境
    case 'test':
      return ['debug', 'log', 'warn', 'error', 'fatal']; // 测试环境
    case 'production':
      return ['log', 'warn', 'error', 'fatal']; // 生产环境：精简日志（排除调试信息）
    default:
      return ['log', 'warn', 'error', 'fatal'];
  }
};

// 获取当前环境（默认开发环境）
const env = process.env.NODE_ENV || 'production';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { logger: getLogLevels(env) });

  // 获取配置服务
  const configService = app.get(ConfigService);
  const nodeEnv = configService.get<string>('nodeEnv', 'production');
  const port = configService.get<number>('serverPort', 3000);
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
