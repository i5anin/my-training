/**
 * Карта вовлечённости мышц по упражнениям.
 *
 * `primary`   — мышцы, несущие основную нагрузку (в интерфейсе красные).
 * `secondary` — работают слабо, как ассистенты или стабилизаторы (жёлтые).
 *
 * Источник данных для первичного заполнения каталога: применяется один
 * раз к упражнениям, у которых уровни ещё не заданы (см. SeedService).
 * Дальше каталог правится руками в интерфейсе, и карта его не перетирает.
 */
export interface MuscleInvolvement {
  primary: string[];
  secondary: string[];
}

export const MUSCLE_INVOLVEMENT: Record<string, MuscleInvolvement> = {
  // ── Грудь ────────────────────────────────────────────────
  'bench-press': { primary: ['chest'], secondary: ['triceps', 'front-delts'] },
  'incline-bench-press': {
    primary: ['chest', 'front-delts'],
    secondary: ['triceps', 'shoulders'],
  },
  'incline-dumbbell-press': {
    primary: ['chest', 'front-delts'],
    secondary: ['triceps', 'shoulders'],
  },
  'chest-press-machine': { primary: ['chest'], secondary: ['triceps', 'front-delts'] },
  'cable-crossover': { primary: ['chest'], secondary: ['front-delts', 'biceps', 'core'] },
  'dumbbell-fly': { primary: ['chest'], secondary: ['front-delts'] },
  'сведения-рук-бабочка': { primary: ['chest'], secondary: ['front-delts'] },
  'жим-гантелей-30': { primary: ['chest'], secondary: ['front-delts', 'triceps'] },
  'жим-гантелей-горизонтальный': { primary: ['chest'], secondary: ['triceps', 'front-delts'] },
  'электро-хамер': { primary: ['chest'], secondary: ['triceps', 'front-delts'] },
  'выжимание-блина': { primary: ['chest'], secondary: ['shoulders', 'triceps', 'core'] },
  'наклон-блина-скамье': { primary: ['chest'], secondary: ['shoulders', 'core'] },
  'push-ups': { primary: ['chest'], secondary: ['triceps', 'front-delts', 'core'] },
  dips: { primary: ['chest', 'triceps'], secondary: ['front-delts'] },
  'узкий-жим-штанги': { primary: ['triceps', 'chest'], secondary: ['front-delts'] },
  'подъем-каната-из-за-головы': { primary: ['chest'], secondary: ['shoulders', 'triceps'] },
  'разгибание-со-скамьи-неразборчиво': { primary: ['chest'], secondary: ['triceps'] },

  // ── Спина ────────────────────────────────────────────────
  'pull-ups': {
    primary: ['lats', 'back'],
    secondary: ['biceps', 'rear-delts', 'forearms', 'core'],
  },
  турник: {
    primary: ['lats', 'back'],
    secondary: ['biceps', 'rear-delts', 'forearms', 'core'],
  },
  'chin-ups': { primary: ['back', 'lats', 'biceps'], secondary: ['forearms', 'core'] },
  'australian-pull-up': {
    primary: ['back', 'lats'],
    secondary: ['biceps', 'rear-delts', 'core'],
  },
  'lat-pulldown': {
    primary: ['lats', 'back'],
    secondary: ['biceps', 'rear-delts', 'forearms'],
  },
  'barbell-row': {
    primary: ['back', 'lats'],
    secondary: ['biceps', 'rear-delts', 'lower-back', 'forearms'],
  },
  'dumbbell-row': {
    primary: ['back', 'lats'],
    secondary: ['biceps', 'rear-delts', 'forearms'],
  },
  'тяга-гантели-скамья-30': {
    primary: ['back', 'lats'],
    secondary: ['biceps', 'rear-delts', 'forearms'],
  },
  'тяга-изогнутого-грифа-в-наклоне': {
    primary: ['back', 'lats'],
    secondary: ['biceps', 'rear-delts', 'lower-back'],
  },
  'cable-row': {
    primary: ['back', 'lats'],
    secondary: ['biceps', 'rear-delts', 'forearms'],
  },
  'горизонтальная-тяга-треугольная-рукоять': {
    primary: ['back', 'lats'],
    secondary: ['biceps', 'rear-delts', 'forearms'],
  },
  't-bar-row': {
    primary: ['back', 'lats'],
    secondary: ['biceps', 'rear-delts', 'lower-back'],
  },
  'опускание-2х-рукоятей-электрохаммер': {
    primary: ['lats', 'back'],
    secondary: ['biceps', 'rear-delts'],
  },
  hyperextension: {
    primary: ['back', 'lower-back'],
    secondary: ['glutes', 'hamstrings', 'core'],
  },
  deadlift: {
    primary: ['back', 'legs'],
    secondary: ['glutes', 'hamstrings', 'lower-back', 'traps', 'forearms'],
  },
  'становая-тяга-сумо': {
    primary: ['legs', 'back'],
    secondary: ['glutes', 'lower-back', 'traps', 'forearms'],
  },
  rowing: { primary: ['cardio', 'back'], secondary: ['lats', 'biceps', 'legs'] },

  // ── Плечи и трапеция ─────────────────────────────────────
  'overhead-press': {
    primary: ['shoulders', 'front-delts'],
    secondary: ['side-delts', 'triceps', 'traps', 'core'],
  },
  'dumbbell-shoulder-press': {
    primary: ['shoulders', 'front-delts'],
    secondary: ['side-delts', 'triceps', 'traps'],
  },
  'жим-хамер-плечи': {
    primary: ['shoulders', 'front-delts'],
    secondary: ['side-delts', 'triceps'],
  },
  'жим-плечи-неразборчиво': { primary: ['shoulders', 'front-delts'], secondary: ['triceps'] },
  'дельта-машина': { primary: ['shoulders', 'side-delts'], secondary: ['front-delts'] },
  'lateral-raise': { primary: ['shoulders', 'side-delts'], secondary: ['traps'] },
  'cable-lateral-raise': { primary: ['shoulders', 'side-delts'], secondary: ['traps'] },
  'отведение-гантелей-сидя-на-скамье': {
    primary: ['shoulders', 'side-delts'],
    secondary: ['traps'],
  },
  'отведение-рукояти-в-тренажере-хард': {
    primary: ['shoulders', 'side-delts'],
    secondary: ['traps'],
  },
  'подьём-каната-в-кроссовере': {
    primary: ['shoulders'],
    secondary: ['traps', 'rear-delts'],
  },
  'подьём-на-скамье': { primary: ['shoulders', 'side-delts'], secondary: ['traps'] },
  'front-raise': { primary: ['shoulders', 'front-delts'], secondary: ['chest', 'core'] },
  'подъем-руки-штопор-неразборчиво': { primary: ['shoulders'], secondary: ['biceps'] },
  'неразборчиво-16': { primary: ['shoulders'], secondary: [] },
  'rear-delt-fly': { primary: ['rear-delts'], secondary: ['traps', 'back'] },
  'face-pull': { primary: ['rear-delts'], secondary: ['traps', 'back', 'biceps'] },
  'тяга-штанги-ко-лбу': {
    primary: ['rear-delts', 'shoulders'],
    secondary: ['traps', 'biceps'],
  },
  shrugs: { primary: ['traps'], secondary: ['shoulders', 'forearms'] },
  'трапеция-шраги': { primary: ['traps'], secondary: ['shoulders', 'forearms'] },

  // ── Бицепс и предплечья ──────────────────────────────────
  'barbell-curl': { primary: ['biceps'], secondary: ['forearms'] },
  'bicep-curl': { primary: ['biceps'], secondary: ['forearms'] },
  'preacher-curl': { primary: ['biceps'], secondary: ['forearms'] },
  'hammer-curl': { primary: ['biceps'], secondary: ['forearms'] },
  'молот-подём-стоя': { primary: ['biceps'], secondary: ['forearms'] },
  'подъем-2х-рукоятей-арм-керл': { primary: ['biceps'], secondary: ['forearms'] },
  'подъем-2х-рукоятей-импульс': { primary: ['biceps'], secondary: ['forearms'] },
  'подъем-изогнутого-грифа-в-кроссовере': { primary: ['biceps'], secondary: ['forearms'] },
  'подъем-прямого-грифа': { primary: ['biceps'], secondary: ['forearms'] },
  'скручивание-штанги-предплечья': { primary: ['forearms'], secondary: ['biceps'] },

  // ── Трицепс ──────────────────────────────────────────────
  'tricep-pushdown': { primary: ['triceps'], secondary: ['forearms'] },
  'overhead-tricep': { primary: ['triceps'], secondary: ['shoulders'] },
  'опускане-каната': { primary: ['triceps'], secondary: ['forearms'] },
  'опускание-прямой-рукояти-в-кроссовере': { primary: ['triceps'], secondary: ['forearms'] },
  'опускание-2х-гантелей-лежа-горизонт': { primary: ['triceps'], secondary: ['chest'] },
  'опускание-гантелей-на-скамье-под-90-гр': { primary: ['triceps'], secondary: ['shoulders'] },
  'опускание-гантели-из-за-головы': { primary: ['triceps'], secondary: ['shoulders'] },

  // ── Ноги ─────────────────────────────────────────────────
  squat: {
    primary: ['legs', 'quadriceps'],
    secondary: ['glutes', 'hamstrings', 'lower-back', 'core'],
  },
  'hack-squat': {
    primary: ['legs', 'quadriceps'],
    secondary: ['glutes', 'икры', 'core'],
  },
  'приседания-кроссовер-неразборчиво': {
    primary: ['legs', 'quadriceps'],
    secondary: ['glutes', 'core'],
  },
  'leg-press': {
    primary: ['legs', 'quadriceps'],
    secondary: ['glutes', 'hamstrings', 'икры'],
  },
  lunges: {
    primary: ['legs', 'quadriceps'],
    secondary: ['glutes', 'hamstrings', 'икры', 'core'],
  },
  'выпады-со-штангой': {
    primary: ['legs', 'quadriceps'],
    secondary: ['glutes', 'hamstrings', 'core', 'lower-back'],
  },
  'bulgarian-split-squat': {
    primary: ['legs', 'quadriceps'],
    secondary: ['glutes', 'hamstrings', 'core'],
  },
  'step-up': {
    primary: ['legs', 'quadriceps', 'glutes'],
    secondary: ['hamstrings', 'икры', 'core'],
  },
  'leg-extension': { primary: ['quadriceps', 'legs'], secondary: [] },
  'разгибание-сидя-сайбокс': { primary: ['quadriceps', 'legs'], secondary: [] },
  'leg-curl': { primary: ['hamstrings', 'legs'], secondary: ['glutes', 'икры'] },
  'сгибание-сидя-сайбокс': { primary: ['hamstrings', 'legs'], secondary: ['glutes', 'икры'] },
  'сгибание-бедра-тренажер-сидя': {
    primary: ['hamstrings', 'legs'],
    secondary: ['glutes', 'икры'],
  },
  'romanian-deadlift': {
    primary: ['legs', 'hamstrings'],
    secondary: ['glutes', 'lower-back', 'back', 'forearms'],
  },
  'glute-bridge': {
    primary: ['glutes'],
    secondary: ['hamstrings', 'lower-back', 'core'],
  },
  'hip-thrust': { primary: ['glutes'], secondary: ['hamstrings', 'lower-back', 'core'] },
  'приведение-бедра-тренажер': { primary: ['legs'], secondary: ['glutes', 'core'] },
  'calf-raise': { primary: ['икры'], secondary: ['legs'] },
  'икры-на-платформе': { primary: ['икры'], secondary: ['legs'] },
  'икры-стоя-импульс': { primary: ['икры'], secondary: ['legs'] },
  'сидя-игры': { primary: ['икры'], secondary: ['legs'] },
  'неразборчиво-19': { primary: ['икры'], secondary: ['legs'] },

  // ── Пресс ────────────────────────────────────────────────
  crunch: { primary: ['core'], secondary: ['obliques'] },
  'cable-crunch': { primary: ['core'], secondary: ['obliques'] },
  'russian-twist': { primary: ['obliques', 'core'], secondary: [] },
  'leg-raise': { primary: ['core'], secondary: ['obliques', 'quadriceps'] },
  'leg-raise-core': { primary: ['core'], secondary: ['obliques', 'quadriceps'] },
  'ab-wheel': { primary: ['core'], secondary: ['obliques', 'lats', 'shoulders'] },
  plank: { primary: ['core'], secondary: ['obliques', 'shoulders', 'glutes'] },
  'pallof-press': { primary: ['core', 'obliques'], secondary: ['shoulders'] },
  'пресс-с-р': { primary: ['core'], secondary: ['obliques'] },

  // ── Кардио ───────────────────────────────────────────────
  bike: { primary: ['cardio'], secondary: ['quadriceps', 'glutes', 'икры'] },
  treadmill: { primary: ['cardio'], secondary: ['legs', 'икры'] },
  elliptical: { primary: ['cardio'], secondary: ['legs', 'glutes'] },
  'jump-rope': { primary: ['cardio', 'legs'], secondary: ['икры', 'shoulders'] },
  swimming: {
    primary: ['cardio', 'lats', 'shoulders'],
    secondary: ['chest', 'core', 'triceps', 'legs'],
  },
};
