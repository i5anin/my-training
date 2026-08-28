import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { MuscleGroupsService } from './muscle-groups/muscle-groups.service';
import { ExercisesService } from './exercises/exercises.service';
import { MUSCLE_INVOLVEMENT } from './exercises/muscle-involvement';
import { UsersService } from './users/users.service';

const DEFAULT_MUSCLE_GROUPS = [
  { id: 'chest', label: 'Грудь' },
  { id: 'back', label: 'Спина' },
  { id: 'shoulders', label: 'Плечи' },
  { id: 'arms', label: 'Руки' },
  { id: 'legs', label: 'Ноги' },
  { id: 'core', label: 'Пресс' },
  { id: 'cardio', label: 'Кардио' },
  { id: 'stretching', label: 'Растяжка' },
];

/** Детальные группы, которых не было в первой версии справочника */
const EXTRA_MUSCLE_GROUPS = [
  { id: 'front-delts', label: 'Передние дельты' },
  { id: 'side-delts', label: 'Средние дельты' },
];

/**
 * Маркеры вида нагрузки. Лежат в справочнике групп по историческим
 * причинам; интерфейс показывает их отдельной меткой, а не как мышцу.
 */
const KIND_MARKERS = [
  { id: 'cardio', label: 'Кардио' },
  { id: 'stretching', label: 'Растяжка' },
];

const DEFAULT_EXERCISES = [
  { id: 'bench-press', name: 'Жим лежа', muscleGroups: ['chest'] },
  { id: 'incline-bench-press', name: 'Жим лежа наклонный', muscleGroups: ['chest', 'shoulders'] },
  { id: 'dumbbell-fly', name: 'Разводка гантелей', muscleGroups: ['chest'] },
  { id: 'chest-press-machine', name: 'Жим в тренажере', muscleGroups: ['chest'] },
  { id: 'push-ups', name: 'Отжимания', muscleGroups: ['chest', 'arms'] },
  { id: 'cable-crossover', name: 'Кроссовер', muscleGroups: ['chest'] },
  { id: 'dips', name: 'Брусья', muscleGroups: ['chest', 'arms'] },
  { id: 'pull-ups', name: 'Подтягивания', muscleGroups: ['back', 'arms'] },
  { id: 'lat-pulldown', name: 'Тяга верхнего блока', muscleGroups: ['back'] },
  { id: 'barbell-row', name: 'Тяга штанги в наклоне', muscleGroups: ['back'] },
  { id: 'dumbbell-row', name: 'Тяга гантели в наклоне', muscleGroups: ['back'] },
  { id: 'cable-row', name: 'Тяга нижнего блока', muscleGroups: ['back'] },
  { id: 'deadlift', name: 'Становая тяга', muscleGroups: ['back', 'legs'] },
  { id: 'hyperextension', name: 'Гиперэкстензия', muscleGroups: ['back', 'core'] },
  { id: 't-bar-row', name: 'Тяга Т-грифа', muscleGroups: ['back'] },
  { id: 'overhead-press', name: 'Жим стоя', muscleGroups: ['shoulders'] },
  { id: 'dumbbell-shoulder-press', name: 'Жим гантелей сидя', muscleGroups: ['shoulders'] },
  { id: 'lateral-raise', name: 'Махи в стороны', muscleGroups: ['shoulders'] },
  { id: 'front-raise', name: 'Махи перед собой', muscleGroups: ['shoulders'] },
  { id: 'rear-delt-fly', name: 'Разводка на заднюю дельту', muscleGroups: ['shoulders'] },
  { id: 'face-pull', name: 'Фейс-пул', muscleGroups: ['shoulders', 'back'] },
  { id: 'shrugs', name: 'Шраги', muscleGroups: ['shoulders'] },
  { id: 'bicep-curl', name: 'Сгибания на бицепс', muscleGroups: ['arms'] },
  { id: 'hammer-curl', name: 'Молотки', muscleGroups: ['arms'] },
  { id: 'tricep-pushdown', name: 'Разгибания на трицепс', muscleGroups: ['arms'] },
  { id: 'overhead-tricep', name: 'Французский жим', muscleGroups: ['arms'] },
  { id: 'preacher-curl', name: 'Сгибания на скамье Скотта', muscleGroups: ['arms'] },
  { id: 'barbell-curl', name: 'Сгибания со штангой', muscleGroups: ['arms'] },
  { id: 'squat', name: 'Приседания', muscleGroups: ['legs'] },
  { id: 'leg-press', name: 'Жим ногами', muscleGroups: ['legs'] },
  { id: 'lunges', name: 'Выпады', muscleGroups: ['legs'] },
  { id: 'leg-extension', name: 'Разгибания ног', muscleGroups: ['legs'] },
  { id: 'leg-curl', name: 'Сгибания ног', muscleGroups: ['legs'] },
  { id: 'calf-raise', name: 'Подъемы на носки', muscleGroups: ['legs'] },
  { id: 'romanian-deadlift', name: 'Румынская тяга', muscleGroups: ['legs', 'back'] },
  { id: 'hack-squat', name: 'Гакк-приседания', muscleGroups: ['legs'] },
  { id: 'bulgarian-split-squat', name: 'Болгарские выпады', muscleGroups: ['legs'] },
  { id: 'hip-thrust', name: 'Ягодичный мост', muscleGroups: ['legs'] },
  { id: 'crunch', name: 'Скручивания', muscleGroups: ['core'] },
  { id: 'plank', name: 'Планка', muscleGroups: ['core'] },
  { id: 'leg-raise-core', name: 'Подъемы ног', muscleGroups: ['core'] },
  { id: 'russian-twist', name: 'Русские скручивания', muscleGroups: ['core'] },
  { id: 'cable-crunch', name: 'Скручивания на блоке', muscleGroups: ['core'] },
  { id: 'treadmill', name: 'Беговая дорожка', muscleGroups: ['cardio'] },
  { id: 'elliptical', name: 'Эллипс', muscleGroups: ['cardio'] },
  { id: 'bike', name: 'Велотренажер', muscleGroups: ['cardio'] },
  { id: 'rowing', name: 'Гребной тренажер', muscleGroups: ['cardio', 'back'] },
  { id: 'jump-rope', name: 'Скакалка', muscleGroups: ['cardio', 'legs'] },
  { id: 'swimming', name: 'Плавание', muscleGroups: ['cardio', 'lats', 'shoulders'] },
];

@Injectable()
export class SeedService implements OnModuleInit {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly muscleGroupsService: MuscleGroupsService,
    private readonly exercisesService: ExercisesService,
    private readonly usersService: UsersService,
  ) {}

  async onModuleInit() {
    await this.migrateMuscleGroups();

    const groups = await this.muscleGroupsService.findAll();
    if (groups.length === 0) {
      for (const group of DEFAULT_MUSCLE_GROUPS) {
        await this.muscleGroupsService.upsert(group);
      }
    }

    const exercises = await this.exercisesService.findAll();
    if (exercises.length === 0) {
      for (const exercise of DEFAULT_EXERCISES) {
        await this.exercisesService.upsert(exercise);
      }
    }

    for (const group of [...KIND_MARKERS, ...EXTRA_MUSCLE_GROUPS]) {
      await this.muscleGroupsService.upsert(group);
    }

    await this.usersService.seedOwner();
    await this.backfillMuscleInvolvement();
  }

  /**
   * Разметка мышц по уровню нагрузки для упражнений, где она ещё не задана.
   * Трогает только записи с пустым secondaryMuscleGroups — ручные правки
   * каталога после этого сохраняются.
   */
  private async backfillMuscleInvolvement() {
    const exercises = await this.exercisesService.findAll();

    for (const exercise of exercises) {
      if (exercise.secondaryMuscleGroups) continue;

      const involvement = MUSCLE_INVOLVEMENT[exercise.id];
      if (!involvement) continue;

      await this.exercisesService.upsert({
        ...exercise,
        muscleGroups: involvement.primary,
        secondaryMuscleGroups: involvement.secondary,
      });
    }
  }

  private async migrateMuscleGroups() {
    const tempExists = await this.dataSource.query(
      `SELECT name FROM sqlite_master WHERE type='table' AND name='_mg_migration'`,
    );
    if (!tempExists.length) return;

    const rows: { workoutId: number; muscleGroupId: string }[] =
      await this.dataSource.query('SELECT workoutId, muscleGroupId FROM _mg_migration');

    for (const row of rows) {
      await this.dataSource.query(
        `INSERT OR IGNORE INTO workout_muscle_group ("workoutId", "muscleGroupId") VALUES (?, ?)`,
        [row.workoutId, row.muscleGroupId],
      );
    }

    await this.dataSource.query('DROP TABLE _mg_migration');
  }
}
