import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/db/prisma.service';
import { CreateUserDto, UpdateUserDto, DeleteUserDto, IUser, IUserWithDetails } from './users.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 根据ID获取用户详情
   * @param id 用户ID
   * @param includeDetails 是否包含详细信息（猫咪、文章等）
   * @returns 用户信息
   */
  async findById(id: number, includeDetails: boolean = false): Promise<IUserWithDetails> {
    const includeOptions = includeDetails
      ? {
          cats: {
            where: {
              deletedAt: null, // 只包含未删除的猫咪
            },
            select: {
              id: true,
              name: true,
              age: true,
              deletedAt: true,
            },
            orderBy: {
              name: 'asc' as const,
            },
          },
          posts: {
            select: {
              id: true,
              title: true,
              published: true,
            },
            orderBy: {
              createdAt: 'desc' as const,
            },
          },
          _count: {
            select: {
              cats: {
                where: {
                  deletedAt: null,
                },
              },
              posts: true,
            },
          },
        }
      : undefined;

    const user = await this.prisma.user.findUnique({
      where: { id },
      include: includeOptions,
    });

    if (!user) {
      throw new NotFoundException(`ID为 ${id} 的用户不存在`);
    }

    return user;
  }

  /**
   * 获取所有用户列表
   * @param includeStats 是否包含统计信息
   * @returns 用户列表
   */
  async findAll(includeStats: boolean = false): Promise<IUserWithDetails[]> {
    const includeOptions = includeStats
      ? {
          _count: {
            select: {
              cats: {
                where: {
                  deletedAt: null,
                },
              },
              posts: true,
            },
          },
        }
      : undefined;

    return this.prisma.user.findMany({
      include: includeOptions,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * 创建新用户
   * @param createUserDto 创建用户的数据
   * @returns 创建的用户信息
   */
  async create(createUserDto: CreateUserDto): Promise<IUser> {
    try {
      return await this.prisma.user.create({
        data: createUserDto,
      });
    } catch (error) {
      this.handlePrismaError(error, createUserDto);
      throw error;
    }
  }

  /**
   * 删除用户（会检查是否有关联数据）
   * @param deleteUserDto 删除用户的数据
   * @returns 删除结果
   */
  async remove(deleteUserDto: DeleteUserDto): Promise<{ message: string; user: IUser }> {
    const { userId } = deleteUserDto;

    try {
      const result = await this.prisma.$transaction(async prisma => {
        // 1. 检查用户是否存在
        const user = await prisma.user.findUnique({
          where: { id: userId },
          include: {
            _count: {
              select: {
                cats: {
                  where: {
                    deletedAt: null, // 只计算未删除的猫咪
                  },
                },
                posts: true,
              },
            },
          },
        });

        if (!user) {
          throw new NotFoundException(`ID为 ${userId} 的用户不存在`);
        }

        // 2. 检查是否有关联的猫咪
        if (user._count.cats > 0) {
          throw new ConflictException(
            `无法删除用户 ${user.name}，该用户还拥有 ${user._count.cats} 只猫咪。请先处理猫咪的归属问题。`
          );
        }

        // 3. 检查是否有关联的文章
        if (user._count.posts > 0) {
          throw new ConflictException(
            `无法删除用户 ${user.name}，该用户还有 ${user._count.posts} 篇文章。请先处理文章的归属问题。`
          );
        }

        // 4. 执行删除
        const deletedUser = await prisma.user.delete({
          where: { id: userId },
        });

        return deletedUser;
      });

      return {
        message: `用户 ${result.name || result.email} 已成功删除`,
        user: result,
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      this.handleDeleteError(error, deleteUserDto);
      throw error;
    }
  }

  /**
   * 强制删除用户（会删除所有关联数据）
   * @param userId 用户ID
   * @returns 删除结果
   */
  async forceRemove(userId: number): Promise<{ message: string; deletedData: any }> {
    try {
      const result = await this.prisma.$transaction(async prisma => {
        // 1. 检查用户是否存在
        const user = await prisma.user.findUnique({
          where: { id: userId },
          include: {
            _count: {
              select: {
                cats: true,
                posts: true,
              },
            },
          },
        });

        if (!user) {
          throw new NotFoundException(`ID为 ${userId} 的用户不存在`);
        }

        // 2. 删除关联的猫咪（设置ownerId为null）
        const updatedCats = await prisma.cat.updateMany({
          where: { ownerId: userId },
          data: { ownerId: null },
        });

        // 3. 删除关联的文章
        const deletedPosts = await prisma.post.deleteMany({
          where: { authorId: userId },
        });

        // 4. 删除用户
        const deletedUser = await prisma.user.delete({
          where: { id: userId },
        });

        return {
          user: deletedUser,
          catsAffected: updatedCats.count,
          postsDeleted: deletedPosts.count,
        };
      });

      return {
        message: `用户 ${result.user.name || result.user.email} 及其所有关联数据已被删除`,
        deletedData: {
          user: result.user,
          catsAffected: result.catsAffected,
          postsDeleted: result.postsDeleted,
        },
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('强制删除用户失败');
    }
  }

  /**
   * 检查邮箱是否已存在
   * @param email 邮箱地址
   * @param excludeUserId 排除的用户ID（用于更新时检查）
   * @returns 是否存在
   */
  async isEmailExists(email: string, excludeUserId?: number): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) return false;
    if (excludeUserId && user.id === excludeUserId) return false;
    return true;
  }

  // 处理 Prisma 错误的方法
  private handlePrismaError(error: unknown, data: any): void {
    if (this.isPrismaError(error)) {
      switch (error.code) {
        case 'P2002':
          if (typeof error.meta?.target === 'string' && error.meta?.target?.includes('email')) {
            throw new ConflictException(`邮箱 ${data.email} 已经被使用`);
          }
          throw new ConflictException('数据冲突，请检查输入信息');
        case 'P2025':
          throw new NotFoundException('用户不存在');
        default:
          console.error('Prisma error:', error.code, error.message);
      }
    }
  }

  // 处理删除用户时的错误
  private handleDeleteError(error: unknown, deleteUserDto: DeleteUserDto): void {
    if (this.isPrismaError(error)) {
      switch (error.code) {
        case 'P2003':
          throw new ConflictException('无法删除用户，存在外键约束');
        case 'P2025':
          throw new NotFoundException(`用户 ${deleteUserDto.userId} 不存在`);
        default:
          console.error('Prisma error in deleteUser:', error.code, error.message);
      }
    }
  }

  // 类型守卫：检查是否为 Prisma 错误
  private isPrismaError(error: unknown): error is Prisma.PrismaClientKnownRequestError {
    return error instanceof Prisma.PrismaClientKnownRequestError;
  }
}
