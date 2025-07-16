import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 开始数据播种...');

  // 清理现有数据（按照外键依赖顺序）
  await prisma.cat.deleteMany();
  await prisma.post.deleteMany();
  await prisma.user.deleteMany();

  console.log('🧹 清理旧数据完成');

  // 创建用户数据（同时创建关联的猫咪和文章）
  const users = await Promise.all([
    prisma.user.create({
      data: {
        name: 'Alice Johnson',
        email: 'alice@example.com',
        posts: {
          create: [
            {
              title: 'Alice的第一篇博客',
              content: '这是Alice写的第一篇博客文章，介绍了她的技术之路。',
              published: true,
            },
            {
              title: 'TypeScript 最佳实践',
              content: '在这篇文章中，我将分享一些TypeScript开发的最佳实践。',
              published: true,
            },
            {
              title: '草稿：未来计划',
              content: '这是一篇关于未来技术发展计划的草稿。',
              published: false,
            },
          ],
        },
        cats: {
          create: [
            {
              name: 'Whiskers',
              age: 3,
            },
            {
              name: 'Shadow',
              age: 2,
            },
          ],
        },
      },
    }),
    prisma.user.create({
      data: {
        name: 'Bob Smith',
        email: 'bob@example.com',
        posts: {
          create: [
            {
              title: 'Node.js 性能优化',
              content: '分享一些Node.js应用性能优化的技巧和经验。',
              published: true,
            },
            {
              title: 'NestJS 入门指南',
              content: '从零开始学习NestJS框架的完整指南。',
              published: true,
            },
          ],
        },
        cats: {
          create: [
            {
              name: 'Mittens',
              age: 4,
            },
            {
              name: 'Tiger',
              age: 1,
            },
          ],
        },
      },
    }),
    prisma.user.create({
      data: {
        name: 'Charlie Brown',
        email: 'charlie@example.com',
        posts: {
          create: [
            {
              title: 'Prisma 数据库操作',
              content: '深入了解Prisma ORM的高级用法和最佳实践。',
              published: false,
            },
          ],
        },
        cats: {
          create: [
            {
              name: 'Luna',
              age: 5,
            },
            {
              name: 'Max',
              age: 3,
            },
            {
              name: 'Bella',
              age: 2,
            },
          ],
        },
      },
    }),
    prisma.user.create({
      data: {
        name: 'Diana Prince',
        email: 'diana@example.com',
        cats: {
          create: [
            {
              name: 'Wonder Cat',
              age: 4,
            },
          ],
        },
      },
    }),
    prisma.user.create({
      data: {
        name: 'Eva Green',
        email: 'eva@example.com',
        // 没有文章和猫咪的用户
      },
    }),
  ]);

  // 创建一些没有主人的流浪猫
  const strayCats = await Promise.all([
    prisma.cat.create({
      data: {
        name: 'Street Tom',
        age: 3,
        // ownerId: null (没有主人，默认为null)
      },
    }),
    prisma.cat.create({
      data: {
        name: 'Alley Cat',
        age: 2,
      },
    }),
    prisma.cat.create({
      data: {
        name: 'Orange Tabby',
        age: 4,
      },
    }),
    prisma.cat.create({
      data: {
        name: 'Fluffy',
        age: 1,
      },
    }),
    prisma.cat.create({
      data: {
        name: 'Smokey',
        age: 6,
      },
    }),
  ]);

  console.log(`✅ 创建了 ${users.length} 个用户`);
  console.log(`✅ 创建了 ${strayCats.length} 只流浪猫`);

  // 获取统计信息
  const userCount = await prisma.user.count();
  const postCount = await prisma.post.count();
  const publishedPostCount = await prisma.post.count({
    where: { published: true },
  });
  const catCount = await prisma.cat.count();
  const ownedCatsCount = await prisma.cat.count({
    where: { ownerId: { not: null } },
  });
  const strayCatsCount = await prisma.cat.count({
    where: { ownerId: null },
  });

  // 按年龄统计猫咪
  const catsByAge = await prisma.cat.groupBy({
    by: ['age'],
    _count: {
      age: true,
    },
    orderBy: {
      age: 'asc',
    },
  });

  // 统计每个用户的猫咪数量
  const usersWithCatCount = await prisma.user.findMany({
    select: {
      name: true,
      _count: {
        select: { cats: true, posts: true },
      },
    },
    orderBy: {
      cats: {
        _count: 'desc',
      },
    },
  });

  console.log(`\n📊 数据播种完成:`);
  console.log(`   - 用户总数: ${userCount}`);
  console.log(`   - 文章总数: ${postCount}`);
  console.log(`   - 已发布文章: ${publishedPostCount}`);
  console.log(`   - 草稿文章: ${postCount - publishedPostCount}`);
  console.log(`   - 猫咪总数: ${catCount}`);
  console.log(`   - 有主人的猫: ${ownedCatsCount}`);
  console.log(`   - 流浪猫: ${strayCatsCount}`);

  console.log(`\n🐱 按年龄分布:`);
  catsByAge.forEach(group => {
    console.log(`   ${group.age} 岁: ${group._count.age} 只`);
  });

  console.log(`\n👥 用户猫咪统计:`);
  usersWithCatCount.forEach(user => {
    console.log(`   ${user.name}: ${user._count.cats} 只猫, ${user._count.posts} 篇文章`);
  });

  // 显示详细的猫咪信息
  const allCatsWithOwners = await prisma.cat.findMany({
    include: {
      owner: {
        select: {
          name: true,
        },
      },
    },
    orderBy: [{ ownerId: { sort: 'asc', nulls: 'last' } }, { name: 'asc' }],
  });

  console.log(`\n🐾 所有猫咪详情:`);
  allCatsWithOwners.forEach(cat => {
    const ownerInfo = cat.owner ? `主人: ${cat.owner.name}` : '流浪猫';
    console.log(`   ${cat.name} (${cat.age}岁) - ${ownerInfo}`);
  });

  console.log('\n🎉 数据播种完成！');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async e => {
    console.error('❌ 数据播种失败:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
