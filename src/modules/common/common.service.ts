import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class CommonService {
  private readonly logger = new Logger(CommonService.name);
  sayHello() {
    this.logger.log('Hello CommonService');
  }
}
