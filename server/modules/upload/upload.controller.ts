import {
  Controller,
  Post,
  UseGuards,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
// eslint-disable-next-line import/no-extraneous-dependencies
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { randomUUID } from 'crypto';

import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';

const UPLOAD_DIR = join(process.cwd(), 'uploads');

@Controller('api/upload')
@UseGuards(AdminAuthGuard)
export class UploadController {
  @Post('image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: UPLOAD_DIR,
        filename: (_req, file, cb) => {
          const ext = extname(file.originalname).toLowerCase();
          const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
          if (!allowed.includes(ext)) {
            return cb(new BadRequestException('不支持的图片格式'), '');
          }
          const filename = `${randomUUID()}${ext}`;
          cb(null, filename);
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('请选择要上传的图片');
    }
    return {
      url: `/uploads/${file.filename}`,
      filename: file.filename,
      size: file.size,
    };
  }
}
