import { applyDecorators } from '@nestjs/common';
import { IsInt, IsPositive, IsOptional, IsString, IsNotEmpty } from 'class-validator';

// Cat ID 验证装饰器
export function IsCatId() {
  return applyDecorators(IsInt({ message: 'catId 必须是一个整数' }), IsPositive({ message: 'catId 必须是一个正整数' }));
}

// Owner ID 验证装饰器
export function IsOwnerId(type: 'userId' | 'ownerId') {
  const isForUser = type === 'userId';
  return applyDecorators(
    isForUser ? IsOptional() : IsNotEmpty(),
    IsInt({ message: `${type} 必须是一个整数` }),
    IsPositive({ message: `${type} 必须是一个正整数` })
  );
}

// User ID 验证装饰器
export function IsUserId() {
  return applyDecorators(
    IsInt({ message: 'userId 必须是一个整数' }),
    IsPositive({ message: 'userId 必须是一个正整数' })
  );
}

// 必填字符串验证装饰器
export function IsRequiredString(fieldName: string = '字段') {
  return applyDecorators(
    IsNotEmpty({ message: `${fieldName}不能为空` }),
    IsString({ message: `${fieldName}必须是字符串` })
  );
}

// 可选字符串验证装饰器
export function IsOptionalString() {
  return applyDecorators(IsOptional(), IsString());
}
