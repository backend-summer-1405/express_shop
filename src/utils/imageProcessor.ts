import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

// ==================== PROCESS IMAGE ====================

interface ProcessImageOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
}

export const processImage = async (
  inputPath: string,
  options: ProcessImageOptions = {}
): Promise<string> => {
  const {
    width = 800,
    height = 800,
    quality = 80,
    format = 'webp',
  } = options;

  const parsedPath = path.parse(inputPath);
  const outputPath = path.join(parsedPath.dir, `${parsedPath.name}.${format}`);

  try {
    await sharp(inputPath)
      .resize(width, height, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .toFormat(format, { quality })
      .toFile(outputPath);


    if (inputPath !== outputPath && fs.existsSync(inputPath)) {
      fs.unlinkSync(inputPath);
    }

    return outputPath;
  } catch (error) {
    throw new Error(`Image processing failed: ${error}`);
  }
};

// ==================== CREATE THUMBNAIL ====================

export const createThumbnail = async (inputPath: string): Promise<string> => {
  const parsedPath = path.parse(inputPath);
  const outputPath = path.join(parsedPath.dir, `${parsedPath.name}-thumb.webp`);

  try {
    await sharp(inputPath)
      .resize(200, 200, {
        fit: 'cover',
      })
      .webp({ quality: 70 })
      .toFile(outputPath);

    return outputPath;
  } catch (error) {
    throw new Error(`Thumbnail creation failed: ${error}`);
  }
};
