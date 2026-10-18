import { prisma } from '../../lib/prisma';
import { AppError } from '../../middlewares/errorHandler';

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

// ==================== COMMENTS ====================

export const addComment = async (
  podcastId: string,
  userId: string,
  content: string,
  parentId?: string
) => {
  const podcast = await prisma.podcast.findUnique({ where: { id: podcastId } });
  if (!podcast) {
    throw new AppError('Podcast not found', 404);
  }

  if (parentId) {
    const parent = await prisma.comment.findUnique({ where: { id: parentId } });
    if (!parent) {
      throw new AppError('Parent comment not found', 404);
    }
    if (parent.entityType !== 'PODCAST' || parent.entityId !== podcastId) {
      throw new AppError('Parent comment does not belong to this podcast', 400);
    }
  }

  const comment = await prisma.comment.create({
    data: {
      entityType: 'PODCAST',
      entityId: podcastId,
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
  podcastId: string,
  userId: string,
  type: 'LIKE' | 'DISLIKE'
) => {
  const podcast = await prisma.podcast.findUnique({ where: { id: podcastId } });
  if (!podcast) {
    throw new AppError('Podcast not found', 404);
  }

  const existing = await prisma.like.findUnique({
    where: {
      entityType_entityId_userId: {
        entityType: 'PODCAST',
        entityId: podcastId,
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
      entityType: 'PODCAST',
      entityId: podcastId,
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

export const addRating = async (podcastId: string, userId: string, value: number) => {
  const podcast = await prisma.podcast.findUnique({ where: { id: podcastId } });
  if (!podcast) {
    throw new AppError('Podcast not found', 404);
  }

  if (value < 1 || value > 5) {
    throw new AppError('Rating value must be between 1 and 5', 400);
  }

  const existing = await prisma.rating.findUnique({
    where: {
      entityType_entityId_userId: {
        entityType: 'PODCAST',
        entityId: podcastId,
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
      entityType: 'PODCAST',
      entityId: podcastId,
      userId,
      value,
    },
  });

  return { message: 'Rating added', data: rating };
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
