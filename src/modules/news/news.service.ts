import { prisma } from '../../lib/prisma';
import { AppError } from '../../middlewares/errorHandler';
import * as sharedService from '../shared/shared.service';

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

// ==================== COMMENTS (SHARED) ====================

export const addComment = async (
  newsId: string,
  userId: string,
  content: string,
  parentId?: string
) => {
  return await sharedService.addComment('NEWS', newsId, userId, content, parentId);
};

export const deleteComment = async (
  commentId: string,
  userId: string,
  userRole: string
) => {
  return await sharedService.deleteComment(commentId, userId, userRole);
};

// ==================== LIKE / DISLIKE (SHARED) ====================

export const toggleLike = async (
  newsId: string,
  userId: string,
  type: 'LIKE' | 'DISLIKE'
) => {
  return await sharedService.toggleLike('NEWS', newsId, userId, type);
};

// ==================== RATING (SHARED) ====================

export const addRating = async (newsId: string, userId: string, value: number) => {
  return await sharedService.addRating('NEWS', newsId, userId, value);
};
