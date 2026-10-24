import { prisma } from '../../lib/prisma';
import { AppError } from '../../middlewares/errorHandler';
import * as sharedService from '../shared/shared.service';

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

// ==================== HELPER: BUILD COMMENT TREE ====================
const buildCommentTree = (comments: any[], parentId: string | null = null): any[] => {
  return comments
    .filter((comment) => comment.parentId === parentId)
    .map((comment) => ({
      ...comment,
      replies: buildCommentTree(comments, comment.id),
    }));
};

// ==================== CREATE COURSE ====================

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

// ==================== GET ALL COURSES ====================

export const getAllCourses = async (
  page: number = 1,
  limit: number = 10,
  userId?: string
) => {
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

  const coursesWithStats = await Promise.all(
    courses.map(async (course) => {
      const [commentCount, likeCount, ratingAvg, favoriteCount] =
        await Promise.all([
          prisma.comment.count({ where: { entityType: 'COURSE', entityId: course.id } }),
          prisma.like.count({
            where: { entityType: 'COURSE', entityId: course.id, type: 'LIKE' },
          }),
          prisma.rating.aggregate({
            where: { entityType: 'COURSE', entityId: course.id },
            _avg: { value: true },
            _count: { value: true },
          }),
          prisma.favorite.count({ where: { entityType: 'COURSE', entityId: course.id } }),
        ]);

      let isLiked = false;
      let isFavorite = false;
      let userRating: number | null = null;

      if (userId) {
        const [userLike, userFavorite, userRatingData] = await Promise.all([
          prisma.like.findUnique({
            where: {
              entityType_entityId_userId: {
                entityType: 'COURSE',
                entityId: course.id,
                userId,
              },
            },
          }),
          prisma.favorite.findUnique({
            where: {
              entityType_entityId_userId: {
                entityType: 'COURSE',
                entityId: course.id,
                userId,
              },
            },
          }),
          prisma.rating.findUnique({
            where: {
              entityType_entityId_userId: {
                entityType: 'COURSE',
                entityId: course.id,
                userId,
              },
            },
          }),
        ]);

        isLiked = userLike?.type === 'LIKE';
        isFavorite = !!userFavorite;
        userRating = userRatingData?.value || null;
      }

      return {
        ...course,
        isLiked,
        isFavorite,
        userRating,
        stats: {
          comments: commentCount,
          likes: likeCount,
          rating: ratingAvg._avg.value || 0,
          ratingCount: ratingAvg._count.value,
          favorites: favoriteCount,
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

// ==================== GET COURSE BY ID ====================

export const getCourseById = async (id: string, userId?: string) => {
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

  const [allComments, likes, ratingAvg, favoriteCount] = await Promise.all([
    prisma.comment.findMany({
      where: { entityType: 'COURSE', entityId: id },
      include: {
        user: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'asc' }, // برای درخت‌سازی، قدیمی‌ترین‌ها اول
    }),
    prisma.like.count({ where: { entityType: 'COURSE', entityId: id, type: 'LIKE' } }),
    prisma.rating.aggregate({
      where: { entityType: 'COURSE', entityId: id },
      _avg: { value: true },
      _count: { value: true },
    }),
    prisma.favorite.count({ where: { entityType: 'COURSE', entityId: id } }),
  ]);


  const commentTree = buildCommentTree(allComments);

  let isLiked = false;
  let isFavorite = false;
  let userRating: number | null = null;

  if (userId) {
    const [userLike, userFavorite, userRatingData] = await Promise.all([
      prisma.like.findUnique({
        where: {
          entityType_entityId_userId: {
            entityType: 'COURSE',
            entityId: id,
            userId,
          },
        },
      }),
      prisma.favorite.findUnique({
        where: {
          entityType_entityId_userId: {
            entityType: 'COURSE',
            entityId: id,
            userId,
          },
        },
      }),
      prisma.rating.findUnique({
        where: {
          entityType_entityId_userId: {
            entityType: 'COURSE',
            entityId: id,
            userId,
          },
        },
      }),
    ]);

    isLiked = userLike?.type === 'LIKE';
    isFavorite = !!userFavorite;
    userRating = userRatingData?.value || null;
  }

  return {
    ...course,
    comments: commentTree,
    isLiked,
    isFavorite,
    userRating,
    stats: {
      likes,
      rating: ratingAvg._avg.value || 0,
      ratingCount: ratingAvg._count.value,
      commentCount: allComments.length,
      favorites: favoriteCount,
    },
  };
};

// ==================== UPDATE COURSE (WITH OWNERSHIP CHECK) ====================

export const updateCourse = async (
  courseId: string,
  teacherId: string,
  teacherRole: string,
  data: UpdateCourseInput
) => {
  const existingCourse = await prisma.course.findUnique({
    where: { id: courseId },
    select: { authorId: true },
  });

  if (!existingCourse) {
    throw new AppError('Course not found', 404);
  }

  if (teacherRole !== 'ADMIN' && existingCourse.authorId !== teacherId) {
    throw new AppError('You can only update your own courses', 403);
  }

  const course = await prisma.course.update({
    where: { id: courseId },
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

// ==================== DELETE COURSE (WITH OWNERSHIP CHECK) ====================

export const deleteCourse = async (
  courseId: string,
  teacherId: string,
  teacherRole: string
) => {
  const existingCourse = await prisma.course.findUnique({
    where: { id: courseId },
    select: { authorId: true },
  });

  if (!existingCourse) {
    throw new AppError('Course not found', 404);
  }

  if (teacherRole !== 'ADMIN' && existingCourse.authorId !== teacherId) {
    throw new AppError('You can only delete your own courses', 403);
  }

  await prisma.$transaction([
    prisma.comment.deleteMany({ where: { entityType: 'COURSE', entityId: courseId } }),
    prisma.like.deleteMany({ where: { entityType: 'COURSE', entityId: courseId } }),
    prisma.rating.deleteMany({ where: { entityType: 'COURSE', entityId: courseId } }),
    prisma.favorite.deleteMany({ where: { entityType: 'COURSE', entityId: courseId } }),
    prisma.coursePurchase.deleteMany({ where: { courseId: courseId } }),
    prisma.course.delete({ where: { id: courseId } }),
  ]);

  return { message: 'Course deleted successfully' };
};

// ==================== FAVORITE ====================

export const toggleFavorite = async (courseId: string, userId: string) => {
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) {
    throw new AppError('Course not found', 404);
  }

  const existing = await prisma.favorite.findUnique({
    where: {
      entityType_entityId_userId: {
        entityType: 'COURSE',
        entityId: courseId,
        userId,
      },
    },
  });

  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
    return { message: 'Removed from favorites', action: 'removed', isFavorite: false };
  }

  const favorite = await prisma.favorite.create({
    data: {
      entityType: 'COURSE',
      entityId: courseId,
      userId,
    },
  });

  return {
    message: 'Added to favorites',
    action: 'created',
    isFavorite: true,
    data: favorite,
  };
};

export const getMyFavorites = async (userId: string) => {
  const favorites = await prisma.favorite.findMany({
    where: {
      userId,
      entityType: 'COURSE',
    },
    orderBy: { createdAt: 'desc' },
  });

  const courseIds = favorites.map((f) => f.entityId);

  const courses = await prisma.course.findMany({
    where: {
      id: { in: courseIds },
      isPublished: true,
    },
    include: {
      author: {
        select: { id: true, name: true },
      },
    },
  });

  return courses;
};

// ==================== COMMENTS (DELEGATED TO SHARED SERVICE) ====================

export const addComment = async (
  courseId: string,
  userId: string,
  content: string,
  parentId?: string
) => {
  return await sharedService.addComment('COURSE', courseId, userId, content, parentId);
};

export const deleteComment = async (
  commentId: string,
  userId: string,
  userRole: string
) => {
  return await sharedService.deleteComment(commentId, userId, userRole);
};

// ==================== LIKE / DISLIKE (DELEGATED) ====================

export const toggleLike = async (
  courseId: string,
  userId: string,
  type: 'LIKE' | 'DISLIKE'
) => {
  return await sharedService.toggleLike('COURSE', courseId, userId, type);
};

// ==================== RATING (DELEGATED) ====================

export const addRating = async (courseId: string, userId: string, value: number) => {
  return await sharedService.addRating('COURSE', courseId, userId, value);
};
