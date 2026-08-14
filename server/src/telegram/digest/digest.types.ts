/** Одна строка сводки — упражнение с агрегатами и дельтой к прошлому разу */
export interface ExerciseLine {
  /** id упражнения в каталоге — по нему берётся техника */
  exerciseId: string;
  name: string;
  /** Группы мышц упражнения из каталога — по ним подбирается картинка */
  muscleGroups: string[];
  /** Компактная схема: «4×8», если подходы однородны, иначе как setsLine */
  scheme: string;
  /** «45×5, 45×5, 50×3» — рабочие подходы */
  setsLine: string;
  /** Разминочные подходы, пусто если их нет */
  warmupLine: string;
  mainSets: number;
  allSets: number;
  /** Сумма повторов в рабочих подходах — метрика упражнений со своим весом */
  totalReps: number;
  /** Лучший рабочий вес, кг; 0 — упражнение со своим весом */
  bestWeight: number;
  best1RM: number;
  tonnage: number;
  /** «+2.5 кг», «первый раз», «без веса (было 11.25 кг)» */
  delta: string;
  /** Упражнение делается со снарядом (в каталоге задан гриф) */
  expectsWeight: boolean;
  note: string;
  photoIds: string[];
}

/** Итог по тренировке */
export interface WorkoutDigest {
  workoutId: number;
  date: string;
  /** Полдень указанной даты в UTC-секундах — для RichTextDateTime */
  dateUnix: number;
  groups: string;
  note: string;
  exercises: ExerciseLine[];
  exerciseCount: number;
  mainSets: number;
  allSets: number;
  /** Сумма повторов рабочих подходов по всей тренировке */
  totalReps: number;
  tonnage: number;
  /** Дельта тоннажа к эталонной тренировке, % (null — сравнивать не с чем) */
  deltaPct: number | null;
  prevDate: string | null;
  /** id эталонной тренировки — кнопка «Прошлый раз» идёт по нему, не по дате */
  prevWorkoutId: number | null;
  prevDateUnix: number | null;
  gapDays: number | null;
  weekTonnage: number;
  weekCount: number;
  photoIds: string[];
  /** Нет ни одного рабочего подхода — черновик */
  isDraft: boolean;
  /** Хотя бы один поднятый килограмм */
  hasWeights: boolean;
  /** Подходы есть, но веса не заполнены, хотя снаряд предполагается — это план */
  plannedOnly: boolean;
  /**
   * Работа ещё не сделана: дата в будущем или запись помечена планом.
   * Веса при этом могут быть проставлены заранее.
   */
  isFuture: boolean;
}

/** Ответ на «сегодня тренировки не было» */
export interface EmptyDigest {
  date: string;
  lastDate: string | null;
  lastWorkoutId: number | null;
  gapDays: number | null;
}
