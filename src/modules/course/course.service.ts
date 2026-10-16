import { prisma } from '../../lib/prisma';
import { AppError } from '../../middlewares/errorHandler';

// ==================== TYPES ====================

interface CreateCourseInput {
  title: string;
  description?: string;
  price: number;
  image?: string;
  authorId: string;
}

interface UpdateCourseInput {
  title?: string;
  description?: string;
  price?: number;
  image?: string;
  isPublished?: boolean;
}

// ==================== CRUD COURSE ====================

export const createCourse = async (data: CreateCourseInput) => {
  const course = await prisma.course.create({
    data: {
      title: data.title,
      description: data.description,
      price: data.price,
      image: data.image,
      authorId: data.authorId,
    },
    include: {
      author: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  return course;
};

export const getAllCourses = async (page: number = 1, limit: number = 10) => {
  const skip = (page - 1) * limit;

  const [courses, total] = await Promise.all([
    prisma.course.findMany({
      where: { isPublished: true },
      skip,
      take: limit,
      include: {
        author: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.course.count({ where: { isPublished: true } }),
  ]);

  // اضافه کردن آمار
  const coursesWithStats = await Promise.all(
    courses.map(async (course) => {
      const [commentCount, likeCount, ratingAvg, purchaseCount] = await Promise.all([
        prisma.comment.count({ where: { entityType: 'COURSE', entityId: course.id } }),
        prisma.like.count({ where: { entityType: 'COURSE', entityId: course.id, type: 'LIKE' } }),
        prisma.rating.aggregate({
          where: { entityType: 'COURSE', entityId: course.id },
          _avg: { value: true },
          _count: { value: true },
        }),
        prisma.coursePurchase.count({ where: { courseId: course.id, status: 'APPROVED' } }),
      ]);

      return {
        ...course,
        stats: {
          comments: commentCount,
          likes: likeCount,
          rating: ratingAvg._avg.value || 0,
          ratingCount: ratingAvg._count.value,
          purchases: purchaseCount,
        },
      };
    })
  );

  return {
    courses: coursesWithStats,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getCourseById = async (id: string) => {
  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      author: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  if (!course) {
    throw new AppError('Course not found', 404);
  }


  const [comments, likes, ratingAvg] = await Promise.all([
    prisma.comment.findMany({
      where: { entityType: 'COURSE', entityId: id, parentId: null },
      include: {
        user: { select: { id: true, name: true } },
        replies: {
          include: { user: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.like.count({ where: { entityType: 'COURSE', entityId: id, type: 'LIKE' } }),
    prisma.rating.aggregate({
      where: { entityType: 'COURSE', entityId: id },
      _avg: { value: true },
      _count: { value: true },
    }),
  ]);

  return {
    ...course,
    comments,
    stats: {
      likes,
      rating: ratingAvg._avg.value || 0,
      ratingCount: ratingAvg._count.value,
      commentCount: comments.length,
    },
  };
};

export const updateCourse = async (id: string, data: UpdateCourseInput) => {
  const existingCourse = await prisma.course.findUnique({
    where: { id },
  });

  if (!existingCourse) {
    throw new AppError('Course not found', 404);
  }

  const course = await prisma.course.update({
    where: { id },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.price !== undefined && { price: data.price }),
      ...(data.image !== undefined && { image: data.image }),
      ...(data.isPublished !== undefined && { isPublished: data.isPublished }),
    },
    include: {
      author: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  return course;
};

export const deleteCourse = async (id: string) => {
  const existingCourse = await prisma.course.findUnique({
    where: { id },
  });

  if (!existingCourse) {
    throw new AppError('Course not found', 404);
  }

  await prisma.$transaction([
    prisma.comment.deleteMany({ where: { entityType: 'COURSE', entityId: id } }),
    prisma.like.deleteMany({ where: { entityType: 'COURSE', entityId: id } }),
    prisma.rating.deleteMany({ where: { entityType: 'COURSE', entityId: id } }),
    prisma.coursePurchase.deleteMany({ where: { courseId: id } }),
    prisma.course.delete({ where: { id } }),
  ]);

  return { message: 'Course deleted successfully' };
};

// ==================== COMMENTS ====================

export const addComment = async (
  courseId: string,
  userId: string,
  content: string,
  parentId?: string
) => {
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) {
    throw new AppError('Course not found', 404);
  }

  if (parentId) {
    const parent = await prisma.comment.findUnique({ where: { id: parentId } });
    if (!parent) {
      throw new AppError('Parent comment not found', 404);
    }
    if (parent.entityType !== 'COURSE' || parent.entityId !== courseId) {
      throw new AppError('Parent comment does not belong to this course', 400);
    }
  }

  const comment = await prisma.comment.create({
    data: {
      entityType: 'COURSE',
      entityId: courseId,
      userId,
      content,
      parentId,
    },
    include: {
      user: { select: { id: true, name: true } },
    },
  });

  return comment;
};

export const deleteComment = async (commentId: string, userId: string, userRole: string) => {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
  });

  if (!comment) {
    throw new AppError('Comment not found', 404);
  }

  if (comment.userId !== userId && userRole !== 'ADMIN') {
    throw new AppError('You are not authorized to delete this comment', 403);
  }

  await prisma.comment.delete({ where: { id: commentId } });

  return { message: 'Comment deleted successfully' };
};

// ==================== LIKE / DISLIKE ====================

export const toggleLike = async (
  courseId: string,
  userId: string,
  type: 'LIKE' | 'DISLIKE'
) => {
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) {
    throw new AppError('Course not found', 404);
  }

  const existing = await prisma.like.findUnique({
    where: {
      entityType_entityId_userId: {
        entityType: 'COURSE',
        entityId: courseId,
        userId,
      },
    },
  });

  if (existing) {
    if (existing.type === type) {
      await prisma.like.delete({ where: { id: existing.id } });
      return { message: `${type} removed`, action: 'removed' };
    }

    const updated = await prisma.like.update({
      where: { id: existing.id },
      data: { type },
    });
    return { message: `Changed to ${type}`, action: 'updated', data: updated };
  }

  const like = await prisma.like.create({
    data: {
      entityType: 'COURSE',
      entityId: courseId,
      userId,
      type,
    },
  });

  return { message: `${type} added`, action: 'created', data: like };
};

// ==================== RATING ====================

export const addRating = async (courseId: string, userId: string, value: number) => {
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) {
    throw new AppError('Course not found', 404);
  }

  if (value < 1 || value > 5) {
    throw new AppError('Rating value must be between 1 and 5', 400);
  }

  const existing = await prisma.rating.findUnique({
    where: {
      entityType_entityId_userId: {
        entityType: 'COURSE',
        entityId: courseId,
        userId,
      },
    },
  });

  if (existing) {
    const updated = await prisma.rating.update({
      where: { id: existing.id },
      data: { value },
    });
    return { message: 'Rating updated', data: updated };
  }

  const rating = await prisma.rating.create({
    data: {
      entityType: 'COURSE',
      entityId: courseId,
      userId,
      value,
    },
  });

  return { message: 'Rating added', data: rating };
};

// ==================== PURCHASE COURSE ====================

export const purchaseCourse = async (courseId: string, userId: string) => {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
  });

  if (!course) {
    throw new AppError('Course not found', 404);
  }

  if (!course.isPublished) {
    throw new AppError('Course is not published yet', 400);
  }

  const existingPurchase = await prisma.coursePurchase.findUnique({
    where: {
      userId_courseId: {
        userId,
        courseId,
      },
    },
  });

  if (existingPurchase) {
    throw new AppError('You already purchased this course', 409);
  }


  const wallet = await prisma.wallet.findUnique({
    where: { userId },
  });

  if (!wallet) {
    throw new AppError('Wallet not found. Please charge your wallet first.', 400);
  }


  if (wallet.balance < course.price) {
    throw new AppError('Insufficient balance', 400);
  }

  const result = await prisma.$transaction(async (tx) => {

    const updatedWallet = await tx.wallet.update({
      where: { id: wallet.id },
      data: { balance: { decrement: course.price } },
    });


    const purchase = await tx.coursePurchase.create({
      data: {
        userId,
        courseId,
        price: course.price,
        status: 'PENDING',
      },
    });


    const transaction = await tx.transaction.create({
      data: {
        walletId: wallet.id,
        amount: course.price,
        type: 'PURCHASE',
        status: 'SUCCESS',
        description: `Purchase course: ${course.title}`,
        refId: purchase.id,
      },
    });

    return { wallet: updatedWallet, purchase, transaction };
  });

  return result;
};

// ==================== APPROVE PURCHASE (ADMIN) ====================

export const approvePurchase = async (purchaseId: string, status: 'APPROVED' | 'REJECTED') => {
  const purchase = await prisma.coursePurchase.findUnique({
    where: { id: purchaseId },
    include: { course: true, user: true },
  });

  if (!purchase) {
    throw new AppError('Purchase not found', 404);
  }

  if (purchase.status !== 'PENDING') {
    throw new AppError('Purchase already processed', 400);
  }


  if (status === 'REJECTED') {
    const wallet = await prisma.wallet.findUnique({
      where: { userId: purchase.userId },
    });

    if (!wallet) {
      throw new AppError('Wallet not found', 404);
    }

    await prisma.$transaction([

      prisma.wallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: purchase.price } },
      }),

      prisma.transaction.create({
        data: {
          walletId: wallet.id,
          amount: purchase.price,
          type: 'REFUND',
          status: 'SUCCESS',
          description: `Refund for rejected course: ${purchase.course.title}`,
          refId: purchase.id,
        },
      }),

      prisma.coursePurchase.update({
        where: { id: purchaseId },
        data: { status },
      }),
    ]);
  } else {

    await prisma.coursePurchase.update({
      where: { id: purchaseId },
      data: { status },
    });
  }

  return { message: `Purchase ${status.toLowerCase()} successfully` };
};

// ==================== GET MY PURCHASES ====================

export const getMyPurchases = async (userId: string) => {
  const purchases = await prisma.coursePurchase.findMany({
    where: { userId },
    include: {
      course: {
        select: {
          id: true,
          title: true,
          image: true,
          price: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return purchases;
};

// ==================== GET PENDING PURCHASES (ADMIN) ====================

export const getPendingPurchases = async () => {
  const purchases = await prisma.coursePurchase.findMany({
    where: { status: 'PENDING' },
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
      course: {
        select: { id: true, title: true, price: true },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  return purchases;
};
