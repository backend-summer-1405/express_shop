import { Response, NextFunction } from 'express';
import * as adminService from './admin.service';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { AppError } from '../../middlewares/errorHandler';
import { Role } from '@prisma/client';

// ==================== GET ALL USERS ====================
export const getAllUsers = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await adminService.getAllUsers({
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 10,
      search: req.query.search as string,
      role: req.query.role as Role,
      isVerified: req.query.isVerified as string,
      sortBy: req.query.sortBy as 'createdAt' | 'name' | 'email',
      order: req.query.order as 'asc' | 'desc',
    });

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

// ==================== CHANGE USER ROLE ====================
export const changeUserRole = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { role } = req.body as { role: 'USER' | 'TEACHER' | 'ADMIN' };
    const user = await adminService.changeUserRole(id, role);
    res.status(200).json({ success: true, message: 'User role updated successfully', data: user });
  } catch (error) {
    next(error);
  }
};

// ==================== DELETE USER ====================
export const deleteUser = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const targetUserId = req.params.id as string;
    if (!req.user) throw new AppError('Authentication required', 401);
    const result = await adminService.deleteUserById(targetUserId, req.user.id);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    next(error);
  }
};

// ==================== GET RECENT USERS ====================
export const getRecentUsers = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const days = parseInt(req.query.days as string) || 7;
    const limit = parseInt(req.query.limit as string) || 10;
    const result = await adminService.getRecentUsers(days, limit);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};
