import { Logger, Module, OnModuleInit } from '@nestjs/common';
import { CatsController } from '@/modules/cats/cats.controller';
import { CatsService } from '@/modules/cats/cats.service';
import { CommonService } from '@/modules/common/common.service';

@Module({
  controllers: [CatsController],
  providers: [CatsService, CommonService],
})
export class CatsModule implements OnModuleInit {
  private readonly logger = new Logger(CatsModule.name);

  onModuleInit() {
    this.logger.log('--------- Cats Module Init -----------');
  }
}
