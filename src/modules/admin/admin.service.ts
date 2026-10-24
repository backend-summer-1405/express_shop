import { prisma } from '../../lib/prisma';
import { AppError } from '../../middlewares/errorHandler';

// ==================== GET ALL USERS ====================
export const getAllUsers = async (page: number = 1, limit: number = 10) => {
  const skip = (page - 1) * limit;
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      skip,
      take: limit,
      select: { id: true, email: true, name: true, role: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count(),
  ]);
  return { users, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
};

// ==================== CHANGE USER ROLE ====================
export const changeUserRole = async (id: string, role: 'USER' | 'TEACHER') => {
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
export const deleteUserById = async (id: string) => {
  const existingUser = await prisma.user.findUnique({ where: { id } });
  if (!existingUser) throw new AppError('User not found', 404);


  if (existingUser.role === 'ADMIN') {
    throw new AppError('You cannot delete an admin user', 403);
  }


  await prisma.$transaction([
    prisma.comment.deleteMany({ where: { userId: id } }),
    prisma.like.deleteMany({ where: { userId: id } }),
    prisma.rating.deleteMany({ where: { userId: id } }),
    prisma.favorite.deleteMany({ where: { userId: id } }),
    prisma.podcastPlay.deleteMany({ where: { userId: id } }),
    prisma.transaction.deleteMany({ where: { userId: id } }),
    prisma.coursePurchase.deleteMany({ where: { userId: id } }),
    prisma.wallet.deleteMany({ where: { userId: id } }),
    prisma.user.delete({ where: { id } }),
  ]);

  return { message: 'User deleted successfully by admin' };
};


// ==================== GET RECENT USERS ====================

export const getRecentUsers = async (days: number = 7, limit: number = 10) => {

  const pastDate = new Date();
  pastDate.setDate(pastDate.getDate() - days);

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where: {
        createdAt: {
          gte: pastDate,
        },
      },
      take: limit,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count({
      where: {
        createdAt: {
          gte: pastDate,
        },
      },
    }),
  ]);

  return {
    days,
    total,
    users,
  };
};
