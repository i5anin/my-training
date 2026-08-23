import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

/** Шаблон профиля, с которым стартует пустая база */
export const OWNER_TEMPLATE: Partial<User> = {
  id: 'owner',
  name: 'Владелец',
  isOwner: true,
  weightKg: null,
  heightCm: null,
};

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
  ) {}

  findAll() {
    return this.repo.find({ order: { id: 'ASC' } });
  }

  async upsert(data: Partial<User>) {
    await this.repo.save({ createdAt: new Date().toISOString(), ...data });
    return { ok: true };
  }

  async remove(id: string) {
    await this.repo.delete(id);
    return { ok: true };
  }

  /** Профиль-шаблон при первом запуске: без него шапка пустая */
  async seedOwner() {
    if ((await this.repo.count()) > 0) return;
    await this.upsert(OWNER_TEMPLATE);
  }
}
