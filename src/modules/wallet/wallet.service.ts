import { prisma } from '../../lib/prisma';
import { AppError } from '../../middlewares/errorHandler';
import { createPaymentRequest, verifyPayment } from '../../lib/zarinpal';
import * as zarinpalModule from '../../lib/zarinpal';
console.log('Zarinpal module keys:', Object.keys(zarinpalModule));

// ==================== GET WALLET ====================

export const getWallet = async (userId: string) => {
  let wallet = await prisma.wallet.findUnique({
    where: { userId },
    include: {
      transactions: {
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  });


  if (!wallet) {
    wallet = await prisma.wallet.create({
      data: {
        userId,
        balance: 0,
      },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });
  }

  return wallet;
};

// ==================== GET TRANSACTIONS ====================

export const getTransactions = async (
  userId: string,
  page: number = 1,
  limit: number = 10
) => {
  const wallet = await prisma.wallet.findUnique({
    where: { userId },
  });

  if (!wallet) {
    throw new AppError('Wallet not found', 404);
  }

  const skip = (page - 1) * limit;

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where: { walletId: wallet.id },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.transaction.count({
      where: { walletId: wallet.id },
    }),
  ]);

  return {
    transactions,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// ==================== CHARGE WALLET ====================

export const chargeWallet = async (
  userId: string,
  amount: number,
  description?: string
) => {
  if (amount <= 0) {
    throw new AppError('Amount must be greater than 0', 400);
  }


  let wallet = await prisma.wallet.findUnique({
    where: { userId },
  });

  if (!wallet) {
    wallet = await prisma.wallet.create({
      data: { userId, balance: 0 },
    });
  }

  // ==================== تراکنش اتمیک ====================

  const result = await prisma.$transaction(async (tx) => {

    const updatedWallet = await tx.wallet.update({
      where: { id: wallet.id },
      data: {
        balance: {
          increment: amount,
        },
      },
    });


    const transaction = await tx.transaction.create({
      data: {
        walletId: wallet.id,
        amount,
        type: 'DEPOSIT',
        status: 'SUCCESS',
        description: description || 'Wallet charge',
      },
    });

    return { wallet: updatedWallet, transaction };
  });

  return result;
};

// ==================== WITHDRAW WALLET ====================

export const withdrawWallet = async (
  userId: string,
  amount: number,
  description?: string
) => {
  if (amount <= 0) {
    throw new AppError('Amount must be greater than 0', 400);
  }

  const wallet = await prisma.wallet.findUnique({
    where: { userId },
  });

  if (!wallet) {
    throw new AppError('Wallet not found', 404);
  }

  if (wallet.balance < amount) {
    throw new AppError('Insufficient balance', 400);
  }

  // ==================== تراکنش اتمیک ====================

  const result = await prisma.$transaction(async (tx) => {

    const updatedWallet = await tx.wallet.update({
      where: { id: wallet.id },
      data: {
        balance: {
          decrement: amount,
        },
      },
    });


    const transaction = await tx.transaction.create({
      data: {
        walletId: wallet.id,
        amount,
        type: 'WITHDRAW',
        status: 'SUCCESS',
        description: description || 'Wallet withdrawal',
      },
    });

    return { wallet: updatedWallet, transaction };
  });

  return result;
};

// ==================== GET WALLET BALANCE ====================

export const getWalletBalance = async (userId: string) => {
  const wallet = await prisma.wallet.findUnique({
    where: { userId },
    select: {
      id: true,
      balance: true,
      updatedAt: true,
    },
  });

  if (!wallet) {

    const newWallet = await prisma.wallet.create({
      data: { userId, balance: 0 },
      select: {
        id: true,
        balance: true,
        updatedAt: true,
      },
    });
    return newWallet;
  }

  return wallet;
};

// ==================== REQUEST CHARGE (ZARINPAL) ====================

export const requestCharge = async (
  userId: string,
  amount: number,
  description?: string
) => {
  if (amount < 1000) {
    throw new AppError('Minimum charge is 1000', 400);
  }


  let wallet = await prisma.wallet.findUnique({
    where: { userId },
  });

  if (!wallet) {
    wallet = await prisma.wallet.create({
      data: { userId, balance: 0 },
    });
  }


  const callbackUrl =
    process.env.ZARINPAL_CALLBACK_URL ||
    'http://localhost:3000/api/wallet/charge/verify';

const payment = await createPaymentRequest({
  amount,
  description: description || 'Wallet charge',
  callbackUrl,
});

  const transaction = await prisma.transaction.create({
    data: {
      walletId: wallet.id,
      amount,
      type: 'DEPOSIT',
      status: 'PENDING',
      description: description || 'Wallet charge via Zarinpal',
      authority: payment.authority,
    },
  });

  return {
    transaction,
    paymentUrl: payment.url,
    authority: payment.authority,
  };
};

// ==================== VERIFY CHARGE (ZARINPAL CALLBACK) ====================

export const verifyCharge = async (authority: string) => {

  const transaction = await prisma.transaction.findFirst({
    where: {
      authority,
      status: 'PENDING',
    },
    include: { wallet: true },
  });

  if (!transaction) {
    throw new AppError('Transaction not found or already processed', 404);
  }

  const verification = await verifyPayment(authority, transaction.amount);

  // ==================== تراکنش اتمیک ====================

  const result = await prisma.$transaction(async (tx) => {

    const updatedTransaction = await tx.transaction.update({
      where: { id: transaction.id },
      data: {
        status: 'SUCCESS',
        refId: verification.refId,
      },
    });


    const updatedWallet = await tx.wallet.update({
      where: { id: transaction.walletId },
      data: {
        balance: {
          increment: transaction.amount,
        },
      },
    });

    return {
      transaction: updatedTransaction,
      wallet: updatedWallet,
    };
  });

  return result;
};
