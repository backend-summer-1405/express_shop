import bcrypt from 'bcrypt';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../middlewares/errorHandler';
import { generateToken } from '../../utils/jwt';
import redis from '../../lib/redis';
import jwt from 'jsonwebtoken';
import { sendOtpEmail } from '../../lib/mailer';

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
  if (!user.isActive) {
    throw new AppError('Please verify your email first', 401);
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

// ==================== REGISTER INITIATE (STEP 1) ====================
export const registerInitiate = async (email: string, password: string, name?: string) => {
  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser && existingUser.isActive) {
    throw new AppError('User with this email already exists', 409);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

  if (existingUser) {
    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword, name, otpCode, otpExpiresAt },
    });
  } else {
    await prisma.user.create({
      data: { email, password: hashedPassword, name, otpCode, otpExpiresAt },
    });
  }

  await sendOtpEmail(email, otpCode);

  return { message: 'Verification code sent to your email' };
};

// ==================== REGISTER VERIFY (STEP 2) ====================
export const registerVerify = async (email: string, code: string) => {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) throw new AppError('User not found', 404);
  if (user.isActive) throw new AppError('User already verified', 400);

  if (!user.otpExpiresAt || user.otpExpiresAt < new Date()) {
    throw new AppError('Verification code has expired', 400);
  }

  if (user.otpCode !== code) {
    throw new AppError('Invalid verification code', 400);
  }

  await prisma.user.update({
    where: { email },
    data: { isActive: true, otpCode: null, otpExpiresAt: null },
  });

  const token = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET as string,
    { expiresIn: '7d' }
  );

  return { message: 'Registration completed successfully', token };
};
