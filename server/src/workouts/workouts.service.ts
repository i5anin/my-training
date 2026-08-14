import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Repository } from 'typeorm';
import { Workout } from './workout.entity';

@Injectable()
export class WorkoutsService {
  constructor(
    @InjectRepository(Workout)
    private readonly repo: Repository<Workout>,
    private readonly events: EventEmitter2,
  ) {}

  findAll() {
    return this.repo.find({ order: { id: 'ASC' } });
  }

  findOne(id: number) {
    return this.repo.findOneBy({ id });
  }

  async nextId() {
    const workouts = await this.repo.find({ select: ['id'] });
    if (workouts.length === 0) return { id: 1 };
    return { id: Math.max(...workouts.map((w) => w.id)) + 1 };
  }

  async upsert(data: any) {
    await this.repo.save(data);
    // Слушатель в telegram-модуле шлёт сводку, если тренировка за сегодня
    const saved = data as Partial<Workout> | undefined;
    this.events.emit('workout.saved', { id: saved?.id, date: saved?.date });
    return { ok: true };
  }

  async remove(id: number) {
    await this.repo.delete(id);
    return { ok: true };
  }

  async replaceAll(workouts: any[]) {
    await this.repo.clear();
    await this.repo.save(workouts);
    return { ok: true };
  }
}
