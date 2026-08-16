import { Injectable } from '@nestjs/common';
import { WorkoutsService } from '../../workouts/workouts.service';
import { ExercisesService } from '../../exercises/exercises.service';
import { MuscleGroupsService } from '../../muscle-groups/muscle-groups.service';
import { Workout } from '../../workouts/workout.entity';
import { TelegramConfig } from '../telegram.config';
import type { EmptyDigest, ExerciseLine, WorkoutDigest } from './digest.types';
import {
  barOf,
  bestWeight,
  best1RM,
  mainSets,
  tonnage,
  type SetLike,
} from './strength.util';

interface EntryLike {
  exerciseId: string;
  sets?: SetLike[];
  barWeight?: number | null;
  description?: string;
  photoIds?: string[];
}

/** Карта каталожных весов грифа: exerciseId → кг */
type BarMap = Map<string, number | null>;

/** Справочники, нужные для сборки сводки; читаются одним запросом */
interface Catalog {
  bars: BarMap;
  names: Map<string, string>;
  groups: Map<string, string[]>;
  labels: Map<string, string>;
}

/** Сбор данных для сводки: тренировка, эталон для сравнения и дельты */
@Injectable()
export class WorkoutDigestService {
  constructor(
    private readonly workouts: WorkoutsService,
    private readonly exercises: ExercisesService,
    private readonly muscleGroups: MuscleGroupsService,
    private readonly config: TelegramConfig,
  ) {}

  /** Дата «сегодня» в часовом поясе владельца, YYYY-MM-DD */
  today(): string {
    // sv-SE даёт ISO-подобный формат без ручной сборки частей
    return new Intl.DateTimeFormat('sv-SE', {
      timeZone: this.config.timeZone,
    }).format(new Date());
  }

  /**
   * Все тренировки за дату, новые первыми. За один день их бывает
   * несколько (утро и вечер) — каждая получает свою сводку.
   */
  async forDate(date: string): Promise<WorkoutDigest[]> {
    const all = await this.workouts.findAll();
    const ofDate = this.byDateDesc(all).filter((w) => w.date === date);
    if (ofDate.length === 0) return [];
    const catalog = await this.catalog();
    return ofDate.map((w) => this.build(w, all, catalog));
  }

  async forId(id: number): Promise<WorkoutDigest | null> {
    const all = await this.workouts.findAll();
    const workout = all.find((w) => w.id === id);
    if (!workout) return null;
    return this.build(workout, all, await this.catalog());
  }

  /** Последняя по дате тренировка */
  async latest(): Promise<WorkoutDigest | null> {
    const all = await this.workouts.findAll();
    const sorted = this.byDateDesc(all);
    if (sorted.length === 0) return null;
    return this.build(sorted[0], all, await this.catalog());
  }

  /** Данные для дня без тренировки */
  async emptyDay(date: string): Promise<EmptyDigest> {
    const all = await this.workouts.findAll();
    const last = this.byDateDesc(all).find((w) => w.date < date);
    return {
      date,
      lastDate: last?.date ?? null,
      lastWorkoutId: last?.id ?? null,
      gapDays: last ? this.gapDays(last.date, date) : null,
    };
  }

  /** Последние 7 дней: тоннаж и число тренировок */
  async week(date: string): Promise<{ tonnage: number; count: number }> {
    const all = await this.workouts.findAll();
    const { bars } = await this.catalog();
    return this.weekStats(all, date, bars);
  }

  private async catalog(): Promise<Catalog> {
    const [exercises, groups] = await Promise.all([
      this.exercises.findAll(),
      this.muscleGroups.findAll(),
    ]);
    return {
      bars: new Map(exercises.map((e) => [e.id, e.barWeight])),
      names: new Map(exercises.map((e) => [e.id, e.name])),
      groups: new Map(exercises.map((e) => [e.id, e.muscleGroups ?? []])),
      labels: new Map(groups.map((g) => [g.id, g.label])),
    };
  }

  private build(
    workout: Workout,
    all: Workout[],
    catalog: Catalog,
  ): WorkoutDigest {
    const { bars, labels } = catalog;
    const entries = this.entriesOf(workout);
    // История строго раньше текущей записи: та же дата, но меньший id — тоже прошлое
    const history = this.byDateDesc(all).filter(
      (w) =>
        w.date < workout.date || (w.date === workout.date && w.id < workout.id),
    );

    const lines = entries.map((entry) => this.lineOf(entry, history, catalog));
    const totalTonnage = lines.reduce((sum, l) => sum + l.tonnage, 0);
    const prev = this.referenceWorkout(workout, history);
    const prevTonnage = prev ? this.tonnageOf(prev, bars) : 0;
    const weekStats = this.weekStats(all, workout.date, bars);
    const workSets = lines.reduce((sum, l) => sum + l.mainSets, 0);

    return {
      workoutId: workout.id,
      date: workout.date,
      dateUnix: this.dateUnix(workout.date),
      groups: [workout.primaryType, workout.secondaryType]
        .filter(Boolean)
        .map((id) => labels.get(id) ?? id)
        .join(' + '),
      note: workout.description ?? '',
      exercises: lines,
      exerciseCount: lines.length,
      mainSets: workSets,
      allSets: lines.reduce((sum, l) => sum + l.allSets, 0),
      totalReps: lines.reduce((sum, l) => sum + l.totalReps, 0),
      tonnage: Math.round(totalTonnage),
      // Тренировка целиком без веса: процент от нуля смысла не имеет
      deltaPct:
        totalTonnage > 0 && prevTonnage > 0
          ? Math.round((totalTonnage / prevTonnage - 1) * 100)
          : null,
      prevDate: prev?.date ?? null,
      prevWorkoutId: prev?.id ?? null,
      prevDateUnix: prev ? this.dateUnix(prev.date) : null,
      gapDays: prev ? this.gapDays(prev.date, workout.date) : null,
      weekTonnage: weekStats.tonnage,
      weekCount: weekStats.count,
      photoIds: workout.photoIds ?? [],
      // Черновик — нет ни одного рабочего подхода (разминка не считается)
      isDraft: workSets === 0,
      // Есть хотя бы один поднятый килограмм
      hasWeights: lines.some((l) => l.bestWeight > 0),
      // Веса нигде не заполнены, но упражнения предполагают снаряд — это план
      plannedOnly:
        workSets > 0 &&
        lines.length > 0 &&
        lines.every((l) => l.bestWeight === 0) &&
        lines.some((l) => l.expectsWeight),
      // План: дата ещё не наступила либо запись помечена как заготовка
      isFuture: workout.date > this.today() || Boolean(workout.isPlan),
    };
  }

  private lineOf(
    entry: EntryLike,
    history: Workout[],
    catalog: Catalog,
  ): ExerciseLine {
    const { bars, names, groups } = catalog;
    const bar = barOf(entry.barWeight, bars.get(entry.exerciseId));
    const all = entry.sets ?? [];
    const main = mainSets(all);
    const warmup = all.filter((s) => s.isWarmup);
    const burnout = all.filter((s) => s.isBurnout);
    const best = bestWeight(main, bar);

    return {
      exerciseId: entry.exerciseId,
      name: names.get(entry.exerciseId) ?? entry.exerciseId,
      muscleGroups: groups.get(entry.exerciseId) ?? [],
      scheme: this.scheme(main, bar),
      setsLine: this.setsLine(main, bar),
      warmupLine: this.setsLine(warmup, bar),
      // Добивочные подходы исключены из mainSets/setsLine (не входят в
      // тоннаж и в поиск «лучшего веса»), но должны быть видны в карточке —
      // иначе реальный подход просто пропадает из отчёта
      burnoutLine: this.setsLine(burnout, bar),
      mainSets: main.length,
      allSets: all.length,
      totalReps: this.repsOf(main),
      bestWeight: best,
      best1RM: best1RM(main, bar),
      tonnage: Math.round(tonnage(main, bar)),
      delta: this.deltaOf(entry, main, best, history, bars),
      // Гриф в каталоге означает, что упражнение делается со снарядом
      expectsWeight: bar > 0,
      note: entry.description ?? '',
      photoIds: entry.photoIds ?? [],
    };
  }

  /**
   * Короткая схема для подписи: однородные подходы сворачиваются
   * в «4×8», разные остаются перечислением.
   */
  private scheme(sets: SetLike[], bar: number): string {
    const work = sets.filter((s) => (s.reps ?? 0) > 0);
    if (work.length === 0) return '—';
    const reps = new Set(work.map((s) => s.reps ?? 0));
    const weights = new Set(work.map((s) => s.weight ?? 0));
    if (reps.size > 1 || weights.size > 1) return this.setsLine(sets, bar);
    const weight = work[0].weight ?? 0;
    const suffix = weight > 0 ? ` · ${this.num(weight + bar)} кг` : '';
    return `${work.length}×${work[0].reps ?? 0}${suffix}`;
  }

  /** «45×5, 45×5, 50×3»; свой вес — просто повторы; подход без повторов опускается */
  private setsLine(sets: SetLike[], bar: number): string {
    return sets
      .filter((s) => (s.reps ?? 0) > 0)
      .map((s) => {
        const w = (s.weight ?? 0) > 0 ? (s.weight ?? 0) + bar : 0;
        return w > 0 ? `${this.num(w)}×${s.reps ?? 0}` : `${s.reps ?? 0}`;
      })
      .join(', ');
  }

  /** Дельта к последнему разу с этим упражнением */
  private deltaOf(
    entry: EntryLike,
    main: SetLike[],
    best: number,
    history: Workout[],
    bars: BarMap,
  ): string {
    const prev = this.previousEntries(entry.exerciseId, history);
    if (prev.length === 0) return 'первый раз';

    const catalogBar = bars.get(entry.exerciseId);
    const prevSets = prev.flatMap((e) => mainSets(e.sets));
    const prevBest = Math.max(
      ...prev.map((e) =>
        bestWeight(mainSets(e.sets), barOf(e.barWeight, catalogBar)),
      ),
      0,
    );

    // Сегодня без утяжеления
    if (best === 0) {
      // Раньше вешали вес — сравнение по повторам ввело бы в заблуждение
      if (prevBest > 0) return `без веса (было ${this.num(prevBest)} кг)`;
      const prevReps = this.repsOf(prevSets);
      if (prevReps === 0) return 'первый раз';
      return this.diffText(this.repsOf(main) - prevReps, 'повт');
    }

    if (prevBest === 0) return 'первый раз с весом';
    return this.diffText(best - prevBest, 'кг');
  }

  /**
   * Все записи упражнения из последней тренировки, где оно встречалось.
   * Блоков может быть несколько (суперсеты, подход после отдыха).
   */
  private previousEntries(exerciseId: string, history: Workout[]): EntryLike[] {
    for (const workout of history) {
      const found = this.entriesOf(workout).filter(
        (e) => e.exerciseId === exerciseId,
      );
      if (found.length > 0) return found;
    }
    return [];
  }

  private diffText(diff: number, unit: string): string {
    if (diff === 0) return 'без изменений';
    return `${diff > 0 ? '+' : '−'}${this.num(Math.abs(diff))} ${unit}`;
  }

  private repsOf(sets: SetLike[]): number {
    return sets.reduce((sum, s) => sum + (s.reps ?? 0), 0);
  }

  /**
   * Эталон для сравнения: ближайшая более ранняя тренировка с
   * максимальным пересечением упражнений — сравнивать ноги с ногами.
   */
  private referenceWorkout(
    workout: Workout,
    history: Workout[],
  ): Workout | null {
    const ids = new Set(this.entriesOf(workout).map((e) => e.exerciseId));
    if (ids.size === 0) return history[0] ?? null;
    let best: { workout: Workout; overlap: number } | null = null;
    for (const candidate of history) {
      const overlap = this.entriesOf(candidate).filter((e) =>
        ids.has(e.exerciseId),
      ).length;
      if (overlap === 0) continue;
      // history отсортирована по дате вниз, поэтому строгое «>» держит ближайшую
      if (!best || overlap > best.overlap)
        best = { workout: candidate, overlap };
    }
    return best?.workout ?? history[0] ?? null;
  }

  private tonnageOf(workout: Workout, bars: BarMap): number {
    return this.entriesOf(workout).reduce((sum, entry) => {
      const bar = barOf(entry.barWeight, bars.get(entry.exerciseId));
      return sum + tonnage(mainSets(entry.sets), bar);
    }, 0);
  }

  private weekStats(
    all: Workout[],
    date: string,
    bars: BarMap,
  ): { tonnage: number; count: number } {
    const from = this.shiftDate(date, -6);
    const window = all.filter((w) => w.date >= from && w.date <= date);
    const total = window.reduce((sum, w) => sum + this.tonnageOf(w, bars), 0);
    return { tonnage: Math.round(total), count: window.length };
  }

  /** Записи упражнений: живые данные лежат в workout.entries (JSON) */
  private entriesOf(workout: Workout): EntryLike[] {
    const raw = workout.entries;
    if (!Array.isArray(raw)) return [];
    return raw as EntryLike[];
  }

  private byDateDesc(all: Workout[]): Workout[] {
    return [...all].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
  }

  private gapDays(fromIso: string, toIso: string): number {
    const ms =
      Date.parse(`${toIso}T00:00:00Z`) - Date.parse(`${fromIso}T00:00:00Z`);
    return Math.round(ms / 86_400_000);
  }

  private shiftDate(iso: string, days: number): string {
    const ms = Date.parse(`${iso}T00:00:00Z`) + days * 86_400_000;
    return new Date(ms).toISOString().slice(0, 10);
  }

  /** Полдень UTC — дата не «съезжает» в соседний день в любом поясе */
  private dateUnix(iso: string): number {
    return Math.floor(Date.parse(`${iso}T12:00:00Z`) / 1000);
  }

  /** 11.25 → «11.25», 52.5 → «52.5», 50 → «50» */
  private num(value: number): string {
    return String(Number(value.toFixed(2)));
  }
}
