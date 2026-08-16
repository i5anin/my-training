import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  Res,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { memoryStorage } from 'multer';
import { PhotosService } from './photos.service';

const MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  avif: 'image/avif',
  png: 'image/png',
  webp: 'image/webp',
};

@Controller()
export class PhotosController {
  constructor(private readonly service: PhotosService) {}

  @Post('photos')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  upload(@UploadedFile() file: Express.Multer.File, @Body() body: any) {
    const id = body?.id ?? Date.now().toString();
    return this.service.save(id, file.buffer);
  }

  @Get('photos/:id')
  getPhoto(@Param('id') id: string, @Res() res: Response) {
    const buffer = this.service.get(id);
    res.setHeader('Content-Type', 'image/jpeg');
    res.send(buffer);
  }

  @Delete('photos/:id')
  deletePhoto(@Param('id') id: string) {
    return this.service.delete(id);
  }

  @Get('mg-photo')
  getMgPhoto(@Query('name') name: string, @Res() res: Response) {
    const filename = decodeURIComponent(name);
    const buffer = this.service.getMgPhoto(filename);
    const ext = this.service.getExt(filename);
    res.setHeader('Content-Type', MIME[ext] ?? 'application/octet-stream');
    res.send(buffer);
  }
}
