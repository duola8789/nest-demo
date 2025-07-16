import { Module, OnModuleInit } from '@nestjs/common';
import { CatsController } from '@/modules/cats/cats.controller';
import { CatsService } from '@/modules/cats/cats.service';
import { CommonService } from '@/modules/common/common.service';

@Module({
  controllers: [CatsController],
  providers: [CatsService, CommonService],
})
export class CatsModule implements OnModuleInit {
  onModuleInit() {
    console.log('--------- Cats Module Init -----------');
  }
}
