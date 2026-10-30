import { Request, Response, NextFunction } from 'express';
import * as categoryService from './category.service';
import { AppError } from '../../middlewares/errorHandler';

export const createCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await categoryService.createCategory(req.body);
    res.status(201).json({ success: true, message: 'Category created', data: result });
  } catch (error) { next(error); }
};

export const getPublicCategories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await categoryService.getPublicCategories();
    res.status(200).json({ success: true, data: result });
  } catch (error) { next(error); }
};

export const getAllCategoriesAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const result = await categoryService.getAllCategoriesAdmin(page, limit);
    res.status(200).json({ success: true, data: result });
  } catch (error) { next(error); }
};

export const getCategoryById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await categoryService.getCategoryById(req.params.id as string);
    res.status(200).json({ success: true, data: result });
  } catch (error) { next(error); }
};

export const updateCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await categoryService.updateCategory(req.params.id as string, req.body);
    res.status(200).json({ success: true, message: 'Category updated', data: result });
  } catch (error) { next(error); }
};

export const deleteCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await categoryService.deleteCategory(req.params.id as string);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) { next(error); }
};

export const toggleVisibility = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await categoryService.toggleCategoryVisibility(req.params.id as string);
    res.status(200).json({ success: true, message: 'Visibility toggled', data: result });
  } catch (error) { next(error); }
};
