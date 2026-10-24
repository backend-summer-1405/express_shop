import bcrypt from 'bcrypt';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../middlewares/errorHandler';
import { CreateUserInput, UpdateUserInput } from './user.types';
import fs from 'fs';
import path from 'path';

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

// ==================== UPDATE USER ====================

export const updateUser = async (id: string, data: UpdateUserInput) => {
  const existingUser = await prisma.user.findUnique({
    where: { id },
  });

  if (!existingUser) {
    throw new AppError('User not found', 404);
  }

  const hasNameChanged = data.name !== undefined && data.name !== existingUser.name;
  const hasEmailChanged = data.email !== undefined && data.email !== existingUser.email;
  const hasPasswordChanged = !!data.password;

  if (!hasNameChanged && !hasEmailChanged && !hasPasswordChanged) {
    throw new AppError('No changes detected', 400);
  }

  if (hasEmailChanged) {
    const emailTaken = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (emailTaken) {
      throw new AppError('Email already in use', 409);
    }
  }

  let hashedPassword: string | undefined;
  if (hasPasswordChanged) {
    hashedPassword = await bcrypt.hash(data.password!, 12);
  }

  const user = await prisma.user.update({
    where: { id },
    data: {
      ...(hasNameChanged && { name: data.name }),
      ...(hasEmailChanged && { email: data.email }),
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

// ==================== DELETE ACCOUNT (SELF) ====================

export const deleteAccount = async (id: string) => {
  const existingUser = await prisma.user.findUnique({
    where: { id },
  });

  if (!existingUser) {
    throw new AppError('User not found', 404);
  }

  await prisma.user.delete({
    where: { id },
  });

  return { message: 'Your account has been deleted successfully' };
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

// ==================== ADD PROFILE IMAGE ====================

export const addProfileImage = async (userId: string, imageUrl: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { profiles: true },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  let profileId: string;

  if (user.profiles.length === 0) {
    const newProfile = await prisma.profile.create({
      data: {
        userId: user.id,
        bio: '',
        avatar: imageUrl,
      },
    });
    profileId = newProfile.id;
  } else {
    profileId = user.profiles[0].id;
  }

  const image = await prisma.profileImage.create({
    data: {
      profileId,
      url: imageUrl,
    },
  });

  return image;
};


// ==================== DELETE PROFILE IMAGE ====================

export const deleteProfileImage = async (userId: string, imageId: string) => {
  const image = await prisma.profileImage.findUnique({
    where: { id: imageId },
    include: {
      profile: {
        select: { userId: true },
      },
    },
  });

  if (!image) {
    throw new AppError('Image not found', 404);
  }

  if (image.profile.userId !== userId) {
    throw new AppError('You can only delete your own images', 403);
  }

  const filePath = path.join(process.cwd(), image.url);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  await prisma.profileImage.delete({
    where: { id: imageId },
  });

  return { message: 'Profile image deleted successfully' };
};

// ==================== GET PROFILE IMAGES ====================
export const getProfileImages = async (userId: string) => {

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      profiles: {
        select: { id: true },
        take: 1,
      },
    },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }


  if (!user.profiles || user.profiles.length === 0) {
    return {
      user: { id: user.id, name: user.name },
      images: [],
      total: 0,
    };
  }

  const profileId = user.profiles[0].id;


  const images = await prisma.profileImage.findMany({
    where: { profileId: profileId },
    select: {
      id: true,
      url: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return {
    user: {
      id: user.id,
      name: user.name,
    },
    images,
    total: images.length,
  };
};
