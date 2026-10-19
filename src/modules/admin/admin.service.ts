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

  await prisma.user.delete({ where: { id } });
  return { message: 'User deleted successfully by admin' };
};
