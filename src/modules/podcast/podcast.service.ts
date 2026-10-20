import { prisma } from '../../lib/prisma';
import { AppError } from '../../middlewares/errorHandler';
import * as sharedService from '../shared/shared.service'

// ==================== TYPES ====================

interface CreatePodcastInput {
  title: string;
  description?: string;
  audioFile: string;
  coverImage?: string;
  authorId: string;
}

interface UpdatePodcastInput {
  title?: string;
  description?: string;
  coverImage?: string;
}

// ==================== CRUD PODCAST ====================

export const createPodcast = async (data: CreatePodcastInput) => {
  const podcast = await prisma.podcast.create({
    data: {
      title: data.title,
      description: data.description,
      audioFile: data.audioFile,
      coverImage: data.coverImage,
      authorId: data.authorId,
    },
    include: {
      author: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  return podcast;
};

export const getAllPodcasts = async (
  page: number = 1,
  limit: number = 10,
  userId?: string
) => {
  const skip = (page - 1) * limit;

  const [podcasts, total] = await Promise.all([
    prisma.podcast.findMany({
      skip,
      take: limit,
      include: {
        author: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.podcast.count(),
  ]);

  const podcastsWithStats = await Promise.all(
    podcasts.map(async (podcast) => {
      const [commentCount, likeCount, ratingAvg, playCount] = await Promise.all([
        prisma.comment.count({ where: { entityType: 'PODCAST', entityId: podcast.id } }),
        prisma.like.count({ where: { entityType: 'PODCAST', entityId: podcast.id, type: 'LIKE' } }),
        prisma.rating.aggregate({
          where: { entityType: 'PODCAST', entityId: podcast.id },
          _avg: { value: true },
          _count: { value: true },
        }),
        prisma.podcastPlay.count({ where: { podcastId: podcast.id } }),
      ]);

      // چک isLiked, userRating
      let isLiked = false;
      let userRating: number | null = null;

      if (userId) {
        const [userLike, userRatingData] = await Promise.all([
          prisma.like.findUnique({
            where: {
              entityType_entityId_userId: {
                entityType: 'PODCAST',
                entityId: podcast.id,
                userId,
              },
            },
          }),
          prisma.rating.findUnique({
            where: {
              entityType_entityId_userId: {
                entityType: 'PODCAST',
                entityId: podcast.id,
                userId,
              },
            },
          }),
        ]);

        isLiked = userLike?.type === 'LIKE';
        userRating = userRatingData?.value || null;
      }

      return {
        ...podcast,
        isLiked,
        userRating,
        stats: {
          comments: commentCount,
          likes: likeCount,
          rating: ratingAvg._avg.value || 0,
          ratingCount: ratingAvg._count.value,
          plays: playCount,
        },
      };
    })
  );

  return {
    podcasts: podcastsWithStats,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getPodcastById = async (id: string, userId?: string) => {
  const podcast = await prisma.podcast.findUnique({
    where: { id },
    include: {
      author: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  if (!podcast) {
    throw new AppError('Podcast not found', 404);
  }

  const [comments, likes, ratingAvg, playCount] = await Promise.all([
    prisma.comment.findMany({
      where: { entityType: 'PODCAST', entityId: id, parentId: null },
      include: {
        user: { select: { id: true, name: true } },
        replies: {
          include: { user: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.like.count({ where: { entityType: 'PODCAST', entityId: id, type: 'LIKE' } }),
    prisma.rating.aggregate({
      where: { entityType: 'PODCAST', entityId: id },
      _avg: { value: true },
      _count: { value: true },
    }),
    prisma.podcastPlay.count({ where: { podcastId: id } }),
  ]);

  let isLiked = false;
  let userRating: number | null = null;

  if (userId) {
    const [userLike, userRatingData] = await Promise.all([
      prisma.like.findUnique({
        where: {
          entityType_entityId_userId: {
            entityType: 'PODCAST',
            entityId: id,
            userId,
          },
        },
      }),
      prisma.rating.findUnique({
        where: {
          entityType_entityId_userId: {
            entityType: 'PODCAST',
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
    ...podcast,
    comments,
    isLiked,
    userRating,
    stats: {
      likes,
      rating: ratingAvg._avg.value || 0,
      ratingCount: ratingAvg._count.value,
      commentCount: comments.length,
      plays: playCount,
    },
  };
};

export const updatePodcast = async (id: string, data: UpdatePodcastInput) => {
  const existingPodcast = await prisma.podcast.findUnique({
    where: { id },
  });

  if (!existingPodcast) {
    throw new AppError('Podcast not found', 404);
  }

  const podcast = await prisma.podcast.update({
    where: { id },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.coverImage !== undefined && { coverImage: data.coverImage }),
    },
    include: {
      author: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  return podcast;
};

export const deletePodcast = async (id: string) => {
  const existingPodcast = await prisma.podcast.findUnique({
    where: { id },
  });

  if (!existingPodcast) {
    throw new AppError('Podcast not found', 404);
  }

  await prisma.$transaction([
    prisma.comment.deleteMany({ where: { entityType: 'PODCAST', entityId: id } }),
    prisma.like.deleteMany({ where: { entityType: 'PODCAST', entityId: id } }),
    prisma.rating.deleteMany({ where: { entityType: 'PODCAST', entityId: id } }),
    prisma.podcastPlay.deleteMany({ where: { podcastId: id } }),
    prisma.podcast.delete({ where: { id } }),
  ]);

  return { message: 'Podcast deleted successfully' };
};

// ==================== RECORD PLAY ====================

export const recordPlay = async (
  podcastId: string,
  userId?: string,
  ipAddress?: string
) => {
  const podcast = await prisma.podcast.findUnique({ where: { id: podcastId } });
  if (!podcast) {
    throw new AppError('Podcast not found', 404);
  }

  const play = await prisma.podcastPlay.create({
    data: {
      podcastId,
      userId,
      ipAddress,
    },
  });

  return { message: 'Play recorded', data: play };
};

// ==================== GET STATS ====================

export const getPodcastStats = async (podcastId: string) => {
  const podcast = await prisma.podcast.findUnique({ where: { id: podcastId } });
  if (!podcast) {
    throw new AppError('Podcast not found', 404);
  }

  const [totalPlays, uniqueListeners, likeCount, ratingAvg] = await Promise.all([
    prisma.podcastPlay.count({ where: { podcastId } }),
    prisma.podcastPlay.groupBy({
      by: ['userId'],
      where: { podcastId, userId: { not: null } },
    }),
    prisma.like.count({ where: { entityType: 'PODCAST', entityId: podcastId, type: 'LIKE' } }),
    prisma.rating.aggregate({
      where: { entityType: 'PODCAST', entityId: podcastId },
      _avg: { value: true },
      _count: { value: true },
    }),
  ]);

  return {
    totalPlays,
    uniqueListeners: uniqueListeners.length,
    likes: likeCount,
    rating: ratingAvg._avg.value || 0,
    ratingCount: ratingAvg._count.value,
  };
};

// ==================== COMMENTS ====================

export const addComment = async (
  podcastId: string,
  userId: string,
  content: string,
  parentId?: string
) => {
  return await sharedService.addComment('PODCAST', podcastId, userId, content, parentId);
};

export const deleteComment = async (
  commentId: string,
  userId: string,
  userRole: string
) => {
  return await sharedService.deleteComment(commentId, userId, userRole);
};

// ==================== LIKE / DISLIKE ====================

export const toggleLike = async (
  podcastId: string,
  userId: string,
  type: 'LIKE' | 'DISLIKE'
) => {
  return await sharedService.toggleLike('PODCAST', podcastId, userId, type);
};

// ==================== RATING ====================

export const addRating = async (podcastId: string, userId: string, value: number) => {
  return await sharedService.addRating('PODCAST', podcastId, userId, value);
};
