import { prisma } from '../../lib/prisma';
import { AppError } from '../../middlewares/errorHandler';
import { EntityType, ReactionType } from '@prisma/client';

// ==================== HELPER: ASSERT ENTITY EXISTS ====================
const assertEntityExists = async (entityType: EntityType, entityId: string) => {
  let exists = false;
  switch (entityType) {
    case 'NEWS':
      exists = !!(await prisma.news.findUnique({ where: { id: entityId }, select: { id: true } }));
      break;
    case 'COURSE':
      exists = !!(await prisma.course.findUnique({ where: { id: entityId }, select: { id: true } }));
      break;
    case 'PODCAST':
      exists = !!(await prisma.podcast.findUnique({ where: { id: entityId }, select: { id: true } }));
      break;
  }
  if (!exists) {
    throw new AppError(`${entityType} not found`, 404);
  }
};

// ==================== HELPER: GET ALL DESCENDANT COMMENTS ====================

const getDescendantIds = async (commentId: string): Promise<string[]> => {
  const replies = await prisma.comment.findMany({
    where: { parentId: commentId },
    select: { id: true },
  });

  let ids = replies.map((r) => r.id);

  for (const reply of replies) {
    const childIds = await getDescendantIds(reply.id);
    ids = ids.concat(childIds);
  }

  return ids;
};

// ==================== COMMENTS ====================

export const addComment = async (
  entityType: EntityType,
  entityId: string,
  userId: string,
  content: string,
  parentId?: string
) => {

  await assertEntityExists(entityType, entityId);


  if (parentId) {
    const parent = await prisma.comment.findUnique({ where: { id: parentId } });
    if (!parent) {
      throw new AppError('Parent comment not found', 404);
    }
    if (parent.entityType !== entityType || parent.entityId !== entityId) {
      throw new AppError('Parent comment does not belong to this entity', 400);
    }
  }


  const comment = await prisma.comment.create({
    data: {
      entityType,
      entityId,
      userId,
      content,
      parentId: parentId || null,
    },
    include: {
      user: { select: { id: true, name: true } },
    },
  });

  return comment;
};

export const deleteComment = async (
  commentId: string,
  userId: string,
  userRole: string
) => {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
  });

  if (!comment) {
    throw new AppError('Comment not found', 404);
  }

  if (comment.userId !== userId && userRole !== 'ADMIN') {
    throw new AppError('You are not authorized to delete this comment', 403);
  }


  const descendantIds = await getDescendantIds(commentId);


  await prisma.$transaction([
    prisma.comment.deleteMany({ where: { id: { in: descendantIds } } }),
    prisma.comment.delete({ where: { id: commentId } }),
  ]);

  return { message: 'Comment deleted successfully' };
};

// ==================== LIKE / DISLIKE ====================

export const toggleLike = async (
  entityType: EntityType,
  entityId: string,
  userId: string,
  type: ReactionType
) => {

  await assertEntityExists(entityType, entityId);

  const existing = await prisma.like.findUnique({
    where: {
      entityType_entityId_userId: {
        entityType,
        entityId,
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
      entityType,
      entityId,
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

export const addRating = async (
  entityType: EntityType,
  entityId: string,
  userId: string,
  value: number
) => {
  if (value < 1 || value > 5) {
    throw new AppError('Rating value must be between 1 and 5', 400);
  }

  await assertEntityExists(entityType, entityId);

  const existing = await prisma.rating.findUnique({
    where: {
      entityType_entityId_userId: {
        entityType,
        entityId,
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
      entityType,
      entityId,
      userId,
      value,
    },
  });

  return { message: 'Rating added', data: rating };
};
