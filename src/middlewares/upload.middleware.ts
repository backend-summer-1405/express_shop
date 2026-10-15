import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';
import { AppError } from './errorHandler';



const UPLOAD_DIR = 'uploads';
const IMAGE_DIR = path.join(UPLOAD_DIR, 'images');
const AUDIO_DIR = path.join(UPLOAD_DIR, 'audio');
const NEWS_DIR = path.join(UPLOAD_DIR, 'news');

[UPLOAD_DIR, IMAGE_DIR, AUDIO_DIR, NEWS_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// ==================== Storage Configuration ====================

const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {

    if (req.originalUrl.includes('/news')) {
      cb(null, NEWS_DIR);
    }

    else if (file.mimetype.startsWith('audio/')) {
      cb(null, AUDIO_DIR);
    }

    else {
      cb(null, IMAGE_DIR);
    }
  },
  filename: (_req: Request, file: Express.Multer.File, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});



const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedImages = /jpeg|jpg|png|gif|webp/;
  const allowedAudio = /mp3|wav|ogg|m4a/;

  const extname = path.extname(file.originalname).toLowerCase();
  const isImage = allowedImages.test(extname) && file.mimetype.startsWith('image/');
  const isAudio = allowedAudio.test(extname) && file.mimetype.startsWith('audio/');

  if (isImage || isAudio) {
    cb(null, true);
  } else {
    cb(new AppError('Only image and audio files are allowed', 400));
  }
};




export const uploadImage = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter,
});


export const uploadAudio = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter,
});


export const uploadMultipleImages = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter,
}).array('images', 5);
