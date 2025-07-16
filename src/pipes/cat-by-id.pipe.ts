import { Injectable, PipeTransform, BadRequestException } from '@nestjs/common';

@Injectable()
export class CatByIdPipe implements PipeTransform<string, number> {
  transform(value: string): number {
    const val = parseInt(value, 10);
    if (isNaN(val) || val <= 0) {
      throw new BadRequestException('无效的猫猫ID');
    }
    return val;
  }
}
