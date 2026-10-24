import { Request, Response, NextFunction } from 'express';
import * as authService from './auth.service';
import { sendEmail } from '../../lib/mailer';

// ==================== REGISTER ====================

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password, name } = req.body;

    const result = await authService.register({ email, password, name });


    try {
      await sendEmail({
        to: result.user.email,
        subject: 'Welcome to Express Shop! 🎉',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333;">Welcome ${result.user.name || 'to Express Shop'}! 🎉</h1>
            <p>Thank you for registering with <strong>Express Shop</strong>.</p>
            <p>Your account has been created successfully.</p>
            <ul>
              <li><strong>Email:</strong> ${result.user.email}</li>
              <li><strong>Name:</strong> ${result.user.name || 'Not provided'}</li>
              <li><strong>Role:</strong> ${result.user.role}</li>
            </ul>
            <p>You can now login and start shopping!</p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
    }

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// ==================== LOGIN ====================

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body;

    const result = await authService.login({ email, password });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// ==================== LOGOUT ====================

export const logout = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];

    if (!token) {
      throw new AppError('Token not provided', 400);
    }

    const result = await authService.logout(token);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};
