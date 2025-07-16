import { IsEmail, IsOptional, IsNotEmpty, IsBoolean } from 'class-validator';
import { IsUserId, IsRequiredString, IsOptionalString } from '@/decorators/validation.decorators';
import { User } from '@prisma/client';

// 用户基本信息类型
export type IUser = User;

// 创建用户 DTO
export class CreateUserDto {
  @IsRequiredString('用户名')
  name: string;

  @IsNotEmpty({ message: '邮箱不能为空' })
  @IsEmail({}, { message: '邮箱格式不正确' })
  email: string;
}

// 更新用户 DTO
export class UpdateUserDto {
  @IsUserId()
  userId: number;

  @IsOptionalString()
  name?: string;

  @IsOptional()
  @IsEmail({}, { message: '邮箱格式不正确' })
  email?: string;
}

// 删除用户 DTO
export class DeleteUserDto {
  @IsUserId()
  userId: number;

  @IsOptionalString()
  reason?: string; // 删除原因
}

// 用户详情查询参数
export class UserDetailDto {
  @IsUserId()
  id: number;

  @IsOptional()
  @IsBoolean()
  includeDetails: boolean;
}

// 用户详情返回类型（包含关联数据）
export interface IUserWithDetails extends IUser {
  cats?: Array<{
    id: number;
    name: string;
    age: number;
    deletedAt: Date | null;
  }>;
  posts?: Array<{
    id: number;
    title: string;
    published: boolean;
  }>;
  _count?: {
    cats: number;
    posts: number;
  };
}
