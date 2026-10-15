import { Response, NextFunction } from 'express';
import * as walletService from './wallet.service';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { AppError } from '../../middlewares/errorHandler';

// ==================== GET WALLET ====================

export const getWallet = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const wallet = await walletService.getWallet(req.user.id);

    res.status(200).json({
      success: true,
      data: wallet,
    });
  } catch (error) {
    next(error);
  }
};

// ==================== CHARGE WALLET ====================

export const chargeWallet = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const { amount, description } = req.body;

    if (!amount || amount <= 0) {
      throw new AppError('Amount must be greater than 0', 400);
    }

    const result = await walletService.chargeWallet(
      req.user.id,
      amount,
      description
    );

    res.status(200).json({
      success: true,
      message: 'Wallet charged successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// ==================== WITHDRAW WALLET ====================

export const withdrawWallet = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const { amount, description } = req.body;

    if (!amount || amount <= 0) {
      throw new AppError('Amount must be greater than 0', 400);
    }

    const result = await walletService.withdrawWallet(
      req.user.id,
      amount,
      description
    );

    res.status(200).json({
      success: true,
      message: 'Withdrawal successful',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// ==================== GET TRANSACTIONS ====================

export const getTransactions = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await walletService.getTransactions(req.user.id, page, limit);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// ==================== GET BALANCE ====================

export const getBalance = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const balance = await walletService.getWalletBalance(req.user.id);

    res.status(200).json({
      success: true,
      data: balance,
    });
  } catch (error) {
    next(error);
  }
};
