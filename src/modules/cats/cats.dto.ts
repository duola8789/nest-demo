import { Cat as PrismaCat } from '@prisma/client';
import { IsNotEmpty, IsPositive, IsInt } from 'class-validator';
import { IsCatId, IsOwnerId, IsOptionalString, IsRequiredString } from '@/decorators/validation.decorators';

// 删除猫咪DTO
export class DeleteCatDto {
  @IsCatId()
  catId: number;

  @IsOptionalString()
  reason?: string; // 删除原因
}

// 创建一个支持 undefined 的 CreateCatDto 类型
export class CreateCatDto {
  @IsRequiredString('猫咪名称')
  name: string;

  @IsInt()
  @IsNotEmpty()
  @IsPositive()
  age: number;

  @IsOwnerId('ownerId')
  ownerId?: number;

  sayHi() {
    console.log('sayHi', this.name, this.age);
  }
}

// 收养猫咪DTO
export class AdoptCatDto {
  @IsCatId()
  catId: number;

  @IsOwnerId('userId')
  userId: number;

  @IsOptionalString()
  reason?: string;
}

// 丢弃猫咪DTO
export class DiscardCatDto {
  @IsCatId()
  catId: number;

  @IsOptionalString()
  note?: string;
}

// 恢复猫咪DTO
export class RestoreCatDto {
  @IsCatId()
  catId: number;

  @IsOptionalString()
  reason?: string; // 恢复原因
}

// 查询猫咪详情返回的数据类型（包含主人信息）
export interface ICatWithOwner extends ICat {
  owner?: {
    id: number;
    name: string | null;
    email: string;
  } | null;
}

// 扩展 ICat 类型以包含软删除字段
export type ICat = Omit<PrismaCat, 'ownerId' | 'deletedAt'> & {
  ownerId?: PrismaCat['ownerId'] | undefined;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
};
