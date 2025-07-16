import { Injectable } from '@nestjs/common';

@Injectable()
export class CommonService {
  sayHello() {
    console.log('Hello CommonService');
  }
}
