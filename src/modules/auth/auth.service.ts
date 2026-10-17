import bcrypt from 'bcrypt';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../middlewares/errorHandler';
import { generateToken } from '../../utils/jwt';

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
