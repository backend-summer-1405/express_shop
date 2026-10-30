import { prisma } from '../../lib/prisma';
import { AppError } from '../../middlewares/errorHandler';
import { Prisma, Role } from '@prisma/client';

// ==================== GET ALL USERS ====================
export const getAllUsers = async (params: {
  page?: number;
  limit?: number;
  search?: string;
  role?: Role;
  isVerified?: string;
  sortBy?: 'createdAt' | 'name' | 'email';
  order?: 'asc' | 'desc';
}) => {
  const {
    page = 1,
    limit = 10,
    search,
    role,
    isVerified,
    sortBy = 'createdAt',
    order = 'desc',
  } = params;

  const skip = (page - 1) * limit;


  const where: Prisma.UserWhereInput = {};

  if (search) {
    where.OR = [
      { email: { contains: search, mode: 'insensitive' } },
      { name: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (role) {
    where.role = role;
  }

  if (isVerified === 'true') {
    where.isActive = true;
  } else if (isVerified === 'false') {
    where.isActive = false;
  }


  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: order },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    }),
    prisma.user.count({ where }),
  ]);


  const usersWithStats = await Promise.all(
    users.map(async (user) => {
      const [purchasesCount, commentsCount] = await Promise.all([
        prisma.coursePurchase.count({ where: { userId: user.id } }),
        prisma.comment.count({ where: { userId: user.id } }),
      ]);

      return {
        ...user,
        isVerified: user.isActive,
        isActive: undefined,
        stats: {
          enrollments: purchasesCount,
          comments: commentsCount,
        },
      };
    })
  );

  return {
    items: usersWithStats,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// ==================== CHANGE USER ROLE ====================
export const changeUserRole = async (id: string, role: 'USER' | 'TEACHER' | 'ADMIN') => {
  const existingUser = await prisma.user.findUnique({ where: { id } });
  if (!existingUser) throw new AppError('User not found', 404);

  if (existingUser.role === 'ADMIN') {
    throw new AppError('You cannot change the role of an admin', 403);
  }

  return await prisma.user.update({
    where: { id },
    data: { role },
    select: { id: true, email: true, name: true, role: true },
  });
};
// ==================== DELETE USER BY ID ====================
export const deleteUserById = async (targetUserId: string, currentAdminId: string) => {
  const existingUser = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!existingUser) throw new AppError('User not found', 404);

  if (existingUser.role === 'ADMIN' && existingUser.id !== currentAdminId) {
    throw new AppError('You cannot delete another admin user', 403);
  }

  await prisma.user.delete({ where: { id: targetUserId } });

  return { message: 'User deleted successfully' };
};

// ==================== GET RECENT USERS ====================
export const getRecentUsers = async (days: number = 7, limit: number = 10) => {
  const pastDate = new Date();
  pastDate.setDate(pastDate.getDate() - days);

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where: { createdAt: { gte: pastDate } },
      take: limit,
      select: { id: true, name: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count({
      where: { createdAt: { gte: pastDate } },
    }),
  ]);

  return { days, total, users };
};
