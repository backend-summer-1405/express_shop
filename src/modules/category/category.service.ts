import { prisma } from '../../lib/prisma';
import { AppError } from '../../middlewares/errorHandler';

// ==================== CREATE CATEGORY ====================
export const createCategory = async (data: { nameFa: string; nameEn: string; isActive?: boolean }) => {
  return await prisma.category.create({
    data: {
      nameFa: data.nameFa,
      nameEn: data.nameEn,
      isActive: data.isActive ?? true,
    },
  });
};

// ==================== GET ALL PUBLIC CATEGORIES ====================
export const getPublicCategories = async () => {
  return await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' },
  });
};

// ==================== GET ALL CATEGORIES (ADMIN WITH PAGINATION) ====================
export const getAllCategoriesAdmin = async (page: number = 1, limit: number = 10) => {
  const skip = (page - 1) * limit;
  const [categories, total] = await Promise.all([
    prisma.category.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.category.count(),
  ]);

  return {
    categories,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// ==================== GET SINGLE CATEGORY FOR ADMIN ====================
export const getCategoryById = async (id: string) => {
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) throw new AppError('Category not found', 404);
  return category;
};

// ==================== UPDATE CATEGORY ====================
export const updateCategory = async (id: string, data: any) => {
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) throw new AppError('Category not found', 404);

  return await prisma.category.update({
    where: { id },
    data,
  });
};

// ==================== DELETE CATEGORY ====================
export const deleteCategory = async (id: string) => {
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) throw new AppError('Category not found', 404);

  await prisma.category.delete({ where: { id } });
  return { message: 'Category deleted successfully' };
};

// ==================== TOGGLE VISIBILITY ====================
export const toggleCategoryVisibility = async (id: string) => {
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) throw new AppError('Category not found', 404);

  return await prisma.category.update({
    where: { id },
    data: { isActive: !category.isActive },
  });
};
