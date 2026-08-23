import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { join } from 'path';
import { MuscleGroup } from './muscle-groups/muscle-group.entity';
import { Exercise } from './exercises/exercise.entity';
import { Workout } from './workouts/workout.entity';
import { User } from './users/user.entity';
import { ExerciseEntry } from './exercise-entries/exercise-entry.entity';
import { SetRow } from './set-rows/set-row.entity';
import { MuscleGroupsModule } from './muscle-groups/muscle-groups.module';
import { ExercisesModule } from './exercises/exercises.module';
import { WorkoutsModule } from './workouts/workouts.module';
import { UsersModule } from './users/users.module';
import { PhotosModule } from './photos/photos.module';
import { SeedService } from './seed.service';
import { DataController } from './data.controller';
import { TelegramModule } from './telegram/telegram.module';
import { DigestLog } from './telegram/digest-log.entity';
import { CardLog } from './telegram/technique/card-log.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: join(process.cwd(), '..', 'data', 'gym.db'),
      entities: [
        MuscleGroup,
        Exercise,
        Workout,
        User,
        ExerciseEntry,
        SetRow,
        DigestLog,
        CardLog,
      ],
      synchronize: true,
      prepareDatabase: (db) => {
        db.pragma('journal_mode = WAL');
        db.pragma('synchronous = NORMAL');
        db.pragma('cache_size = -8000');
        db.pragma('temp_store = MEMORY');
        db.pragma('foreign_keys = ON');

        // Миграция entries: workout.entries JSON → таблица exercise_entry
        const hasEntriesCol = (db.pragma('table_info(workout)') as any[]).some(
          (c) => c.name === 'entries',
        );
        if (hasEntriesCol) {
          db.prepare(
            `
            CREATE TABLE IF NOT EXISTS exercise_entry (
              id TEXT PRIMARY KEY, workoutId INTEGER, exerciseId TEXT NOT NULL,
              sets TEXT, barWeight REAL, description TEXT,
              supersetGroupId TEXT, photoIds TEXT, createdAt TEXT, totalEditMs INTEGER
            )
          `,
          ).run();
          // Only insert if exercise_entry still has the sets column
          // (table may already be migrated to set_row on a prior run)
          const eeHasSets = (
            db.pragma('table_info(exercise_entry)') as any[]
          ).some((c) => c.name === 'sets');
          if (eeHasSets) {
            const workouts = db
              .prepare('SELECT id, entries FROM workout')
              .all() as any[];
            const insEntry = db.prepare(`
              INSERT OR IGNORE INTO exercise_entry
                (id, workoutId, exerciseId, sets, barWeight, description, supersetGroupId, photoIds, createdAt, totalEditMs)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);
            for (const w of workouts) {
              for (const e of JSON.parse(w.entries || '[]') as any[]) {
                insEntry.run(
                  e.id,
                  w.id,
                  e.exerciseId,
                  JSON.stringify(e.sets ?? []),
                  e.barWeight ?? null,
                  e.description ?? null,
                  e.supersetGroupId ?? null,
                  e.photoIds ? JSON.stringify(e.photoIds) : null,
                  e.createdAt ?? null,
                  e.totalEditMs ?? null,
                );
              }
            }
          }
        }

        // Миграция sets: exercise_entry.sets JSON → таблица set_row
        const hasSetsCol = (
          db.pragma('table_info(exercise_entry)') as any[]
        ).some((c) => c.name === 'sets');
        if (hasSetsCol) {
          db.prepare(
            `
            CREATE TABLE IF NOT EXISTS set_row (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              entryId TEXT NOT NULL,
              "order" INTEGER NOT NULL,
              weight REAL NOT NULL,
              reps INTEGER NOT NULL,
              isBurnout INTEGER NOT NULL DEFAULT 0
            )
          `,
          ).run();
          const alreadyMigrated = db
            .prepare('SELECT COUNT(*) as n FROM set_row')
            .get().n;
          if (alreadyMigrated === 0) {
            const entries = db
              .prepare('SELECT id, sets FROM exercise_entry')
              .all() as any[];
            const insSet = db.prepare(`
              INSERT INTO set_row (entryId, "order", weight, reps, isBurnout)
              VALUES (?, ?, ?, ?, ?)
            `);
            for (const e of entries) {
              (JSON.parse(e.sets || '[]') as any[]).forEach((s, i) => {
                insSet.run(
                  e.id,
                  i,
                  s.weight ?? 0,
                  s.reps ?? 0,
                  s.isBurnout ? 1 : 0,
                );
              });
            }
          }
        }

        // Сохраняем muscleGroups во временную таблицу до того как TypeORM удалит колонку
        const hasMgCol = (db.pragma('table_info(workout)') as any[]).some(
          (c) => c.name === 'muscleGroups',
        );
        if (hasMgCol) {
          db.prepare(
            `CREATE TABLE IF NOT EXISTS _mg_migration (workoutId INTEGER, muscleGroupId TEXT)`,
          ).run();
          const isEmpty =
            db.prepare('SELECT COUNT(*) as n FROM _mg_migration').get().n === 0;
          if (isEmpty) {
            const workouts = db
              .prepare('SELECT id, muscleGroups FROM workout')
              .all() as any[];
            const ins = db.prepare(
              'INSERT INTO _mg_migration (workoutId, muscleGroupId) VALUES (?, ?)',
            );
            for (const w of workouts) {
              for (const mgId of JSON.parse(
                w.muscleGroups || '[]',
              ) as string[]) {
                ins.run(w.id, mgId);
              }
            }
          }
        }
      },
    }),
    MuscleGroupsModule,
    ExercisesModule,
    WorkoutsModule,
    UsersModule,
    PhotosModule,
    TelegramModule,
  ],
  controllers: [DataController],
  providers: [SeedService],
})
export class AppModule {}
