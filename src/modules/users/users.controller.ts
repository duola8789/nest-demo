import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  ParseBoolPipe,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto, DeleteUserDto, UserDetailDto } from './users.dto';
import { ApiResponseMessage } from '@/decorators/api-response.decorator';
import { AuthGuard } from '@/guards/roles.guard';

@Controller('user')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * 获取所有用户列表
   * @param includeStats 是否包含统计信息
   */
  @Get('list')
  @ApiResponseMessage('获取用户列表成功')
  findAll(@Query('includeStats', new ParseBoolPipe({ optional: true })) includeStats?: boolean) {
    return this.usersService.findAll(includeStats || false);
  }

  /**
   * 根据ID获取用户详情
   * @param id 用户ID
   * @param includeDetails 是否包含详细信息
   */
  @Get('detail')
  @ApiResponseMessage('获取用户详情成功')
  findOne(
    @Query('id', ParseIntPipe) id: number,
    @Query('includeDetails', new ParseBoolPipe({ optional: true })) includeDetails?: boolean
  ) {
    return this.usersService.findById(id, includeDetails || false);
  }

  /**
   * 创建新用户
   * @param createUserDto 创建用户的数据
   */
  @Post()
  @ApiResponseMessage('创建用户成功')
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  /**
   * 删除用户（安全删除，会检查关联数据）
   * @param deleteUserDto 删除用户的数据
   */
  @Delete('delete')
  @ApiResponseMessage('删除用户成功')
  remove(@Body() deleteUserDto: DeleteUserDto) {
    return this.usersService.remove(deleteUserDto);
  }

  /**
   * 强制删除用户（会删除所有关联数据，需要管理员权限）
   * @param id 用户ID
   */
  @Delete('force-delete/:id')
  @UseGuards(AuthGuard) // 需要管理员权限
  @ApiResponseMessage('强制删除用户成功')
  forceRemove(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.forceRemove(id);
  }

  /**
   * 检查邮箱是否可用
   * @param email 邮箱地址
   * @param excludeUserId 排除的用户ID
   */
  @Get('check-email/:email')
  @ApiResponseMessage('邮箱检查完成')
  async checkEmail(
    @Param('email') email: string,
    @Query('excludeUserId', new ParseIntPipe({ optional: true })) excludeUserId?: number
  ) {
    const exists = await this.usersService.isEmailExists(email, excludeUserId);
    return {
      email,
      available: !exists,
      message: exists ? '邮箱已被使用' : '邮箱可用',
    };
  }
}
