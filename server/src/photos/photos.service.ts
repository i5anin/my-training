import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from 'fs';
import { basename, join, resolve, sep } from 'path';

/** Расширения, которые вообще может отдать этот сервис */
const ALLOWED_EXT = new Set(['jpg', 'jpeg', 'png', 'avif', 'webp']);

@Injectable()
export class PhotosService {
  readonly photosDir = join(process.cwd(), '..', 'data', 'photos');

  constructor() {
    mkdirSync(this.photosDir, { recursive: true });
  }

  save(id: string, buffer: Buffer) {
    writeFileSync(this.pathOf(`${this.safeId(id)}.jpg`), buffer);
    return { id };
  }

  get(id: string): Buffer {
    const path = this.pathOf(`${this.safeId(id)}.jpg`);
    if (!existsSync(path)) throw new NotFoundException();
    return readFileSync(path);
  }

  delete(id: string) {
    const path = this.pathOf(`${this.safeId(id)}.jpg`);
    if (existsSync(path)) unlinkSync(path);
    return { ok: true };
  }

  getMgPhoto(filename: string): Buffer {
    const path = this.pathOf(filename);
    if (!ALLOWED_EXT.has(this.getExt(path))) {
      throw new BadRequestException('недопустимое расширение');
    }
    if (!existsSync(path)) throw new NotFoundException();
    return readFileSync(path);
  }

  getExt(filename: string) {
    return filename.split('.').pop()?.toLowerCase() ?? '';
  }

  /**
   * Путь строго внутри каталога вложений. Без этой проверки
   * `?name=../../server/.env` отдавал файл с секретами.
   */
  private pathOf(filename: string): string {
    const name = basename(filename);
    if (!name || name === '.' || name === '..') {
      throw new BadRequestException('недопустимое имя файла');
    }
    const root = resolve(this.photosDir);
    const path = resolve(root, name);
    if (path !== root && !path.startsWith(root + sep)) {
      throw new BadRequestException('недопустимое имя файла');
    }
    return path;
  }

  /** Идентификаторы приходят из nanoid: буквы, цифры, дефис, подчёркивание */
  private safeId(id: string): string {
    const safe = id.replace(/[^A-Za-z0-9_-]/g, '');
    if (!safe) throw new BadRequestException('недопустимый id');
    return safe;
  }
}
