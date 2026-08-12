import { randomUUID } from 'crypto';
import { extname } from 'path';
import { diskStorage } from 'multer';
import type { Request } from 'express';

const MAX_AVATAR_SIZE_BYTES = 10 * 1024 * 1024;
const IMAGE_MIME_PREFIX = 'image/';

const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

export const avatarUploadOptions = {
  storage: diskStorage({
    destination: './public/uploads/avatar',

    filename: (
      _req: Request,
      file: Express.Multer.File,
      callback: (error: Error | null, filename: string) => void,
    ) => {
      const extension = extname(file.originalname).toLowerCase();
      const filename = `${randomUUID()}${extension}`;

      callback(null, filename);
    },
  }),

  limits: {
    fileSize: MAX_AVATAR_SIZE_BYTES,
  },

  fileFilter: (
    _req: Request,
    file: Express.Multer.File,
    callback: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    const extension = extname(file.originalname).toLowerCase();

    const isValidMimeType = file.mimetype.startsWith(IMAGE_MIME_PREFIX);

    const isValidExtension = ALLOWED_IMAGE_EXTENSIONS.includes(extension);

    if (!isValidMimeType || !isValidExtension) {
      callback(null, false);
      return;
    }

    callback(null, true);
  },
};
