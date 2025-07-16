import { MiddlewareConsumer, Module } from '@nestjs/common';
import { RequestMethod } from '@nestjs/common/enums';
import { ConfigModule } from '@nestjs/config';
import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';
import { LoggerMiddleware } from '@/middlewares/logger.middleware';
import { CatsModule } from '@/modules/cats/cats.module';
import { UsersModule } from '@/modules/users/users.module';
import { DbModule } from '@/db/db.module';
import configuration from '@/config/configuration';

@Module({
  imports: [DbModule, CatsModule, UsersModule, ConfigModule.forRoot({ load: [configuration], isGlobal: true })],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes({ path: 'cats/{*abc}', method: RequestMethod.ALL });
  }
}
