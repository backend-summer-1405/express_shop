import { prisma } from '../../lib/prisma';
import { AppError } from '../../middlewares/errorHandler';

// ==================== TYPES ====================

interface CreateNewsInput {
  title: string;
  content: string;
  image?: string;
  authorId: string;
}

interface UpdateNewsInput {
  title?: string;
  content?: string;
  image?: string;
}

// ==================== CRUD NEWS ====================

export const createNews = async (data: CreateNewsInput) => {
  const news = await prisma.news.create({
    data: {
      title: data.title,
      content: data.content,
      image: data.image,
      authorId: data.authorId,
    },
    include: {
      author: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  return news;
};

export const getAllNews = async (
  page: number = 1,
  limit: number = 10,
  userId?: string
) => {
  const skip = (page - 1) * limit;

  const [news, total] = await Promise.all([
    prisma.news.findMany({
      skip,
      take: limit,
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.news.count(),
  ]);

  const newsWithStats = await Promise.all(
    news.map(async (item) => {
      const [commentCount, likeCount, dislikeCount, ratingAvg] = await Promise.all([
        prisma.comment.count({ where: { entityType: 'NEWS', entityId: item.id } }),
        prisma.like.count({ where: { entityType: 'NEWS', entityId: item.id, type: 'LIKE' } }),
        prisma.like.count({ where: { entityType: 'NEWS', entityId: item.id, type: 'DISLIKE' } }),
        prisma.rating.aggregate({
          where: { entityType: 'NEWS', entityId: item.id },
          _avg: { value: true },
          _count: { value: true },
        }),
      ]);

      // ==================== isLiked و userRating ====================

      let isLiked = false;
      let userRating: number | null = null;

      if (userId) {
        const [userLike, userRatingData] = await Promise.all([
          prisma.like.findUnique({
            where: {
              entityType_entityId_userId: {
                entityType: 'NEWS',
                entityId: item.id,
                userId,
              },
            },
          }),
          prisma.rating.findUnique({
            where: {
              entityType_entityId_userId: {
                entityType: 'NEWS',
                entityId: item.id,
                userId,
              },
            },
          }),
        ]);

        isLiked = userLike?.type === 'LIKE';
        userRating = userRatingData?.value || null;
      }

      return {
        ...item,
        isLiked,
        userRating,
        stats: {
          comments: commentCount,
          likes: likeCount,
          dislikes: dislikeCount,
          rating: ratingAvg._avg.value || 0,
          ratingCount: ratingAvg._count.value,
        },
      };
    })
  );

  return {
    news: newsWithStats,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getNewsById = async (id: string, userId?: string) => {
  const news = await prisma.news.findUnique({
    where: { id },
    include: {
      author: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  if (!news) {
    throw new AppError('News not found', 404);
  }

  const [comments, likes, dislikes, ratingAvg] = await Promise.all([
    prisma.comment.findMany({
      where: { entityType: 'NEWS', entityId: id, parentId: null },
      include: {
        user: { select: { id: true, name: true } },
        replies: {
          include: {
            user: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.like.count({ where: { entityType: 'NEWS', entityId: id, type: 'LIKE' } }),
    prisma.like.count({ where: { entityType: 'NEWS', entityId: id, type: 'DISLIKE' } }),
    prisma.rating.aggregate({
      where: { entityType: 'NEWS', entityId: id },
      _avg: { value: true },
      _count: { value: true },
    }),
  ]);

  // ==================== isLiked و userRating ====================

  let isLiked = false;
  let userRating: number | null = null;

  if (userId) {
    const [userLike, userRatingData] = await Promise.all([
      prisma.like.findUnique({
        where: {
          entityType_entityId_userId: {
            entityType: 'NEWS',
            entityId: id,
            userId,
          },
        },
      }),
      prisma.rating.findUnique({
        where: {
          entityType_entityId_userId: {
            entityType: 'NEWS',
            entityId: id,
            userId,
          },
        },
      }),
    ]);

    isLiked = userLike?.type === 'LIKE';
    userRating = userRatingData?.value || null;
  }

  return {
    ...news,
    comments,
    isLiked,
    userRating,
    stats: {
      likes,
      dislikes,
      rating: ratingAvg._avg.value || 0,
      ratingCount: ratingAvg._count.value,
      commentCount: comments.length,
    },
  };
};

export const updateNews = async (id: string, data: UpdateNewsInput) => {
  const existingNews = await prisma.news.findUnique({
    where: { id },
  });

  if (!existingNews) {
    throw new AppError('News not found', 404);
  }

  const news = await prisma.news.update({
    where: { id },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.content !== undefined && { content: data.content }),
      ...(data.image !== undefined && { image: data.image }),
    },
    include: {
      author: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  return news;
};

export const deleteNews = async (id: string) => {
  const existingNews = await prisma.news.findUnique({
    where: { id },
  });

  if (!existingNews) {
    throw new AppError('News not found', 404);
  }

  await prisma.$transaction([
    prisma.comment.deleteMany({ where: { entityType: 'NEWS', entityId: id } }),
    prisma.like.deleteMany({ where: { entityType: 'NEWS', entityId: id } }),
    prisma.rating.deleteMany({ where: { entityType: 'NEWS', entityId: id } }),
    prisma.news.delete({ where: { id } }),
  ]);

  return { message: 'News deleted successfully' };
};

// ==================== COMMENTS ====================

export const addComment = async (
  newsId: string,
  userId: string,
  content: string,
  parentId?: string
) => {
  const news = await prisma.news.findUnique({ where: { id: newsId } });
  if (!news) {
    throw new AppError('News not found', 404);
  }

  if (parentId) {
    const parent = await prisma.comment.findUnique({ where: { id: parentId } });
    if (!parent) {
      throw new AppError('Parent comment not found', 404);
    }
    if (parent.entityType !== 'NEWS' || parent.entityId !== newsId) {
      throw new AppError('Parent comment does not belong to this news', 400);
    }
  }

  const comment = await prisma.comment.create({
    data: {
      entityType: 'NEWS',
      entityId: newsId,
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

  await prisma.comment.delete({
    where: { id: commentId },
  });

  return { message: 'Comment deleted successfully' };
};

// ==================== LIKE / DISLIKE ====================

export const toggleLike = async (
  newsId: string,
  userId: string,
  type: 'LIKE' | 'DISLIKE'
) => {
  const news = await prisma.news.findUnique({ where: { id: newsId } });
  if (!news) {
    throw new AppError('News not found', 404);
  }

  const existing = await prisma.like.findUnique({
    where: {
      entityType_entityId_userId: {
        entityType: 'NEWS',
        entityId: newsId,
        userId,
      },
    },
  });

  if (existing) {
    if (existing.type === type) {
      await prisma.like.delete({ where: { id: existing.id } });
      return { message: `${type} removed`, action: 'removed', isLiked: false };
    }

    const updated = await prisma.like.update({
      where: { id: existing.id },
      data: { type },
    });
    return {
      message: `Changed to ${type}`,
      action: 'updated',
      isLiked: type === 'LIKE',
      data: updated,
    };
  }

  const like = await prisma.like.create({
    data: {
      entityType: 'NEWS',
      entityId: newsId,
      userId,
      type,
    },
  });

  return {
    message: `${type} added`,
    action: 'created',
    isLiked: type === 'LIKE',
    data: like,
  };
};

// ==================== RATING ====================

export const addRating = async (newsId: string, userId: string, value: number) => {
  const news = await prisma.news.findUnique({ where: { id: newsId } });
  if (!news) {
    throw new AppError('News not found', 404);
  }

  if (value < 1 || value > 5) {
    throw new AppError('Rating value must be between 1 and 5', 400);
  }

  const existing = await prisma.rating.findUnique({
    where: {
      entityType_entityId_userId: {
        entityType: 'NEWS',
        entityId: newsId,
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
      entityType: 'NEWS',
      entityId: newsId,
      userId,
      value,
    },
  });

  return { message: 'Rating added', data: rating };
};
