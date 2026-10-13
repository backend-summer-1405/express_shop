import bcrypt from 'bcrypt';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../middlewares/errorHandler';

// ==================== TYPES ====================

interface CreateUserInput {
  email: string;
  password: string;
  name?: string;
}

interface UpdateUserInput {
  email?: string;
  password?: string;
  name?: string;
}

// ==================== CREATE USER ====================

export const createUser = async (data: CreateUserInput) => {
  const { email, password, name } = data;

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new AppError('Email already exists', 409);
  }


  const hashedPassword = await bcrypt.hash(password, 12);


  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
    },
  });

  return user;
};

// ==================== GET USER BY ID ====================

export const getUserById = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      updatedAt: true,
      profiles: {
        select: {
          id: true,
          bio: true,
          avatar: true,
          images: {
            select: { id: true, url: true },
          },
        },
      },
      wallet: {
        select: { id: true, balance: true },
      },
    },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  return user;
};

// ==================== GET USER BY EMAIL ====================

export const getUserByEmail = async (email: string) => {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  return user;
};

// ==================== GET ALL USERS ====================

export const getAllUsers = async (page: number = 1, limit: number = 10) => {
  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      skip,
      take: limit,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count(),
  ]);

  return {
    users,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// ==================== UPDATE USER ====================

export const updateUser = async (id: string, data: UpdateUserInput) => {
  const existingUser = await prisma.user.findUnique({
    where: { id },
  });

  if (!existingUser) {
    throw new AppError('User not found', 404);
  }

  if (data.email && data.email !== existingUser.email) {
    const emailTaken = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (emailTaken) {
      throw new AppError('Email already in use', 409);
    }
  }

  let hashedPassword: string | undefined;
  if (data.password) {
    hashedPassword = await bcrypt.hash(data.password, 12);
  }

  const user = await prisma.user.update({
    where: { id },
    data: {
      ...(data.email && { email: data.email }),
      ...(data.name !== undefined && { name: data.name }),
      ...(hashedPassword && { password: hashedPassword }),
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      updatedAt: true,
    },
  });

  return user;
};

// ==================== DELETE USER ====================

export const deleteUser = async (id: string) => {
  const existingUser = await prisma.user.findUnique({
    where: { id },
  });

  if (!existingUser) {
    throw new AppError('User not found', 404);
  }

  await prisma.user.delete({
    where: { id },
  });

  return { message: 'User deleted successfully' };
};

// ==================== CHANGE PASSWORD ====================

export const changePassword = async (
  id: string,
  currentPassword: string,
  newPassword: string
) => {
  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

  if (!isPasswordValid) {
    throw new AppError('Current password is incorrect', 401);
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);

  await prisma.user.update({
    where: { id },
    data: { password: hashedPassword },
  });

  return { message: 'Password changed successfully' };
};
