import bcrypt from 'bcrypt';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../middlewares/errorHandler';
import { generateToken } from '../../utils/jwt';
import redis from '../../lib/redis';
import jwt from 'jsonwebtoken';

// ==================== REGISTER ====================

interface RegisterInput {
  email: string;
  password: string;
  name?: string;
}

export const register = async (data: RegisterInput) => {
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


  const token = generateToken({
    id: user.id,
    email: user.email,
    role: user.role,
  });

  return { user, token };
};

// ==================== LOGIN ====================

interface LoginInput {
  email: string;
  password: string;
}

export const login = async (data: LoginInput) => {
  const { email, password } = data;


  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }


  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new AppError('Invalid email or password', 401);
  }


  const token = generateToken({
    id: user.id,
    email: user.email,
    role: user.role,
  });


  const { password: _, ...userWithoutPassword } = user;

  return { user: userWithoutPassword, token };
};

// ==================== LOGOUT (WITH BLACKLIST) ====================

export const logout = async (token: string) => {
  try {
    const decoded = jwt.decode(token) as { exp: number; jti?: string };

    if (!decoded || !decoded.exp) {
      throw new Error('Invalid token');
    }

    const now = Math.floor(Date.now() / 1000);
    const ttl = decoded.exp - now;

    if (ttl > 0) {
      await redis.set(`revoked:${token}`, '1', 'EX', ttl);
    }

    return { message: 'Logged out successfully' };
  } catch (error) {
    console.error('Logout error:', error);
    return { message: 'Logged out successfully' };
  }
};
