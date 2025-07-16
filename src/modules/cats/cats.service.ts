import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { CreateCatDto, ICat, ICatWithOwner, AdoptCatDto, DeleteCatDto, RestoreCatDto } from '@/modules/cats/cats.dto';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/db/prisma.service';

@Injectable()
export class CatsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDetail(id: number): Promise<ICatWithOwner> {
    // 从数据库中查找猫，包含主人信息
    const cat = await this.prisma.cat.findUnique({
      where: {
        id,
        deletedAt: null, // 只查询未删除的猫咪
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // 如果未找到猫，抛出异常
    if (!cat) {
      throw new NotFoundException(`ID为 ${id} 的猫猫不存在`);
    }

    // 返回猫
    return cat;
  }

  getCatsNum(): Promise<number> {
    // 获取数据库中所有未删除猫的数量
    return this.prisma.cat.count({
      where: {
        deletedAt: null,
      },
    });
  }

  /**
   * 收养猫咪
   * @param adoptCatDto 收养猫咪的数据
   * @returns 更新后的猫咪信息
   */
  async adoptCat(adoptCatDto: AdoptCatDto): Promise<ICatWithOwner> {
    const { catId, userId } = adoptCatDto;

    try {
      // 使用事务确保数据一致性
      const result = await this.prisma.$transaction(async prisma => {
        // 1. 检查猫咪是否存在
        const cat = await prisma.cat.findUnique({
          where: { id: catId },
          include: {
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        });

        if (!cat) {
          throw new NotFoundException(`ID为 ${catId} 的猫猫不存在`);
        }

        // 2. 检查猫咪是否已经被收养
        if (cat.ownerId) {
          throw new ConflictException(`猫咪 ${cat.name} 已经被收养，当前主人: ${cat.owner?.name || '未知'}`);
        }

        // 3. 检查用户是否存在
        const user = await prisma.user.findUnique({
          where: { id: userId },
        });

        if (!user) {
          throw new NotFoundException(`ID为 ${userId} 的用户不存在`);
        }

        // 4. 更新猫咪的主人
        const updatedCat = await prisma.cat.update({
          where: { id: catId },
          data: { ownerId: userId },
          include: {
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        });

        return updatedCat;
      });

      return result;
    } catch (error) {
      this.handleAdoptError(error, adoptCatDto);
      throw error;
    }
  }

  /**
   * 删除猫咪
   * @param deleteCatDto 删除猫咪的数据
   * @returns 删除结果
   */
  async deleteCat(deleteCatDto: DeleteCatDto): Promise<{ message: string; cat: ICatWithOwner }> {
    const { catId } = deleteCatDto;

    try {
      const result = await this.prisma.$transaction(async prisma => {
        // 1. 检查猫咪是否存在且未被删除
        const cat = await prisma.cat.findUnique({
          where: { id: catId },
          include: {
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        });

        if (!cat) {
          throw new NotFoundException(`ID为 ${catId} 的猫猫不存在`);
        }

        if (cat.deletedAt) {
          throw new ConflictException(`猫咪 ${cat.name} 已经被删除`);
        }

        // 2. 执行软删除
        const deletedCat = await prisma.cat.update({
          where: { id: catId },
          data: {
            deletedAt: new Date(),
            ownerId: null, // 删除时清除主人关系
          },
          include: {
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        });

        return deletedCat;
      });

      return {
        message: `猫咪 ${result.name} 已成功删除`,
        cat: result,
      };
    } catch (error) {
      this.handleDeleteError(error, deleteCatDto);
      throw error;
    }
  }

  /**
   * 获取已删除的猫咪列表
   * @returns 已删除的猫咪列表
   */
  async getDeletedCats(): Promise<ICat[]> {
    return this.prisma.cat.findMany({
      where: {
        deletedAt: {
          not: null,
        },
      },
      orderBy: {
        deletedAt: 'desc',
      },
    });
  }

  /**
   * 获取所有可收养的猫咪（没有主人且未删除的猫咪）
   * @returns 可收养的猫咪列表
   */
  async getAvailableCats(): Promise<ICat[]> {
    return this.prisma.cat.findMany({
      where: {
        ownerId: null,
        deletedAt: null, // 只显示未删除的猫咪
      },
      orderBy: {
        id: 'asc',
      },
    });
  }

  /**
   * 获取用户收养的所有猫咪
   * @param userId 用户ID
   * @returns 用户收养的猫咪列表
   */
  async getCatsByOwner(userId: number): Promise<ICat[]> {
    // 先检查用户是否存在
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`ID为 ${userId} 的用户不存在`);
    }

    return this.prisma.cat.findMany({
      where: {
        ownerId: userId,
        deletedAt: null, // 只显示未删除的猫咪
      },
      orderBy: {
        id: 'asc',
      },
    });
  }

  async insertCat(cat: CreateCatDto): Promise<ICat> {
    try {
      return await this.prisma.cat.create({ data: cat });
    } catch (error) {
      this.handlePrismaError(error, cat);
      throw error; // 如果不是已知的 Prisma 错误，重新抛出
    }
  }

  // 处理删除猫咪时的错误
  private handleDeleteError(error: unknown, deleteCatDto: DeleteCatDto): void {
    if (this.isPrismaError(error)) {
      switch (error.code) {
        case 'P2025':
          throw new NotFoundException(`猫咪 ${deleteCatDto.catId} 不存在`);
        default:
          console.error('Prisma error in deleteCat:', error.code, error.message);
      }
    }
  }

  // 处理收养猫咪时的错误
  private handleAdoptError(error: unknown, adoptCatDto: AdoptCatDto): void {
    if (this.isPrismaError(error)) {
      switch (error.code) {
        case 'P2003':
          throw new NotFoundException(`用户 ${adoptCatDto.userId} 不存在`);
        case 'P2025':
          throw new NotFoundException(`猫咪 ${adoptCatDto.catId} 不存在`);
        default:
          console.error('Prisma error in adoptCat:', error.code, error.message);
      }
    }
  }

  // 处理 Prisma 错误的方法
  private handlePrismaError(error: unknown, cat: CreateCatDto): void {
    if (this.isPrismaError(error)) {
      switch (error.code) {
        case 'P2003':
          throw new NotFoundException(`Owner ${cat.ownerId} 不存在`);
        case 'P2002':
          throw new NotFoundException('猫咪名称已存在');
        case 'P2025':
          throw new NotFoundException('记录不存在');
        default:
          console.error('Prisma error:', error.code, error.message);
      }
    }
  }

  // 类型守卫：检查是否为 Prisma 错误
  private isPrismaError(error: unknown): error is Prisma.PrismaClientKnownRequestError {
    return error instanceof Prisma.PrismaClientKnownRequestError;
  }
}
