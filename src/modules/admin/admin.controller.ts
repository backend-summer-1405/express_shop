import { Response, NextFunction } from 'express';
import * as adminService from './admin.service';
import { AuthRequest } from '../../middlewares/auth.middleware';

export const getAllUsers = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const result = await adminService.getAllUsers(page, limit);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const changeUserRole = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { role } = req.body;
    const user = await adminService.changeUserRole(id, role);
    res.status(200).json({ success: true, message: 'User role updated successfully', data: user });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const result = await adminService.deleteUserById(id);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    next(error);
  }
};
