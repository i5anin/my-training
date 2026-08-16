import type { Exercise, Workout } from '@/types'
import { barOf, best1RM, mainSets } from '@/composables/strength'

/**
 * Поиск аномалий в журнале тренировок: следы ручного переноса
 * из тетради, опечатки в весах, дубли и пробелы в данных.
 */

export type AnomalyKind =
  | 'duplicate'        // тренировки с одинаковым составом
  | 'same-date'        // несколько тренировок в один день
  | 'unconfirmed-date' // дата-заглушка при переносе
  | 'future-date'      // дата в будущем
  | 'jump'             // резкий скачок рабочего веса
  | 'zero-weight'      // подходы без веса у весового упражнения
  | 'empty'            // тренировка без упражнений или подходов
  | 'no-muscle-group'  // не указана группа мышц
  | 'odd-weight'       // вес вне сетки 1,25 кг
  | 'unknown-exercise' // упражнения нет в каталоге

export interface Anomaly {
  kind: AnomalyKind
  severity: 'high' | 'medium' | 'low'
  workoutId: number
  date: string
  title: string
  detail: string
}

const KIND_LABELS: Record<AnomalyKind, string> = {
  duplicate: 'Дубликат',
  'same-date': 'Несколько за день',
  'unconfirmed-date': 'Дата не подтверждена',
  'future-date': 'Дата в будущем',
  jump: 'Скачок веса',
  'zero-weight': 'Нулевой вес',
  empty: 'Пустая запись',
  'no-muscle-group': 'Без группы мышц',
  'odd-weight': 'Вес вне сетки',
  'unknown-exercise': 'Нет в каталоге',
}

export function anomalyLabel(kind: AnomalyKind): string {
  return KIND_LABELS[kind]
}

/** Подпись состава: упражнения и подходы, без учёта порядка */
function signature(w: Workout): string | null {
  const entries = w.entries || []
  if (!entries.length) return null
  return entries
    .map((e) => `${e.exerciseId}:${(e.sets || []).map((s) => `${s.weight}x${s.reps}`).join(',')}`)
    .sort()
    .join('|')
}

/** Кратно ли шагу 1,25 кг (типовая сетка блинов) */
function offGrid(weight: number): boolean {
  if (!weight) return false
  return Math.abs((weight * 100) % 125) > 0.001
}

export function findAnomalies(workouts: Workout[], exercises: Exercise[]): Anomaly[] {
  const out: Anomaly[] = []
  const exById = new Map(exercises.map((e) => [e.id, e]))
  const today = new Date().toISOString().slice(0, 10)

  // ── Дубликаты по составу ──
  const bySig = new Map<string, Workout[]>()
  for (const w of workouts) {
    const sig = signature(w)
    if (!sig) continue
    if (!bySig.has(sig)) bySig.set(sig, [])
    bySig.get(sig)!.push(w)
  }
  for (const group of bySig.values()) {
    if (group.length < 2) continue
    for (const w of group) {
      const others = group.filter((x) => x.id !== w.id).map((x) => `#${x.id} (${x.date})`)
      out.push({
        kind: 'duplicate', severity: 'high', workoutId: w.id, date: w.date,
        title: 'Полностью совпадает с ' + others.join(', '),
        detail: 'Одинаковые упражнения и подходы — вероятно, запись внесена дважды.',
      })
    }
  }

  // ── Несколько тренировок в один день ──
  const byDate = new Map<string, Workout[]>()
  for (const w of workouts) {
    if (!byDate.has(w.date)) byDate.set(w.date, [])
    byDate.get(w.date)!.push(w)
  }
  for (const [date, group] of byDate) {
    if (group.length < 2) continue
    for (const w of group) {
      out.push({
        kind: 'same-date', severity: 'medium', workoutId: w.id, date,
        title: `${group.length} тренировки на эту дату`,
        detail: 'Записи: ' + group.map((x) => `#${x.id}`).join(', ') + '. Возможно, дата не была заполнена на бланке.',
      })
    }
  }

  for (const w of workouts) {
    // ── Дата-заглушка ──
    if ((w.description || '').includes('ДАТА НЕ ПОДТВЕРЖДЕНА')) {
      out.push({
        kind: 'unconfirmed-date', severity: 'medium', workoutId: w.id, date: w.date,
        title: 'Дата поставлена автоматически',
        detail: 'При переносе из тетради дата не была названа — сверьте с бланком.',
      })
    }

    // ── Дата в будущем ──
    if (w.date > today) {
      out.push({
        kind: 'future-date', severity: 'medium', workoutId: w.id, date: w.date,
        title: 'Дата позже сегодняшней',
        detail: 'Опечатка в годе или месяце — либо запись запланирована заранее.',
      })
    }

    // ── Пустая запись ──
    const entries = w.entries || []
    const setsTotal = entries.reduce((s, e) => s + (e.sets || []).length, 0)
    if (!entries.length || !setsTotal) {
      out.push({
        kind: 'empty', severity: 'high', workoutId: w.id, date: w.date,
        title: entries.length ? 'Упражнения без подходов' : 'Нет упражнений',
        detail: `Упражнений: ${entries.length}, подходов: ${setsTotal}.`,
      })
    }

    // ── Группа мышц не указана ──
    if (!(w.muscleGroups || []).length) {
      out.push({
        kind: 'no-muscle-group', severity: 'low', workoutId: w.id, date: w.date,
        title: 'Не указана группа мышц',
        detail: 'Тренировка не попадёт в фильтры и подсказки по группам.',
      })
    }

    for (const e of entries) {
      const ex = exById.get(e.exerciseId)

      // ── Упражнения нет в каталоге ──
      if (!ex) {
        out.push({
          kind: 'unknown-exercise', severity: 'high', workoutId: w.id, date: w.date,
          title: 'Упражнение отсутствует в каталоге',
          detail: `id: ${e.exerciseId || '(пусто)'} — статистика по нему не считается.`,
        })
        continue
      }

      const sets = mainSets(e.sets)

      // ── Все рабочие подходы без веса ──
      const anyWeight = sets.some((s) => (s.weight ?? 0) > 0)
      const bodyweight = barOf(e, ex) === 0 && (ex.muscleGroups.includes('cardio') || /турник|брусья|подтягив|планка|отжиман/i.test(ex.name))
      if (sets.length && !anyWeight && !bodyweight) {
        out.push({
          kind: 'zero-weight', severity: 'low', workoutId: w.id, date: w.date,
          title: `«${ex.name}» — все подходы с нулевым весом`,
          detail: 'Либо вес не записан, либо упражнение со своим весом.',
        })
      }

      // ── Вес вне сетки 1,25 кг ──
      const odd = sets.map((s) => s.weight ?? 0).filter(offGrid)
      if (odd.length) {
        out.push({
          kind: 'odd-weight', severity: 'low', workoutId: w.id, date: w.date,
          title: `«${ex.name}» — необычный вес: ${odd.join(', ')} кг`,
          detail: 'Не кратно шагу 1,25 кг — возможна ошибка распознавания цифры.',
        })
      }
    }
  }

  // ── Скачки рабочего веса по каждому упражнению ──
  const chron = [...workouts].sort((a, b) => a.date.localeCompare(b.date) || a.id - b.id)
  const prev = new Map<string, { rm: number; workoutId: number; date: string }>()
  for (const w of chron) {
    for (const e of w.entries || []) {
      const ex = exById.get(e.exerciseId)
      if (!ex) continue
      const sets = mainSets(e.sets)
      if (!sets.length) continue
      const rm = best1RM(sets, barOf(e, ex))
      if (!rm) continue
      const before = prev.get(e.exerciseId)
      if (before && before.rm > 0) {
        const ratio = rm / before.rm
        // Порог 1,6× вверх / 0,5× вниз — обычная прогрессия столько не даёт
        if (ratio >= 1.6 || ratio <= 0.5) {
          const dir = ratio >= 1.6 ? 'вырос' : 'упал'
          out.push({
            kind: 'jump', severity: 'medium', workoutId: w.id, date: w.date,
            title: `«${ex.name}» — 1ПМ ${dir} с ${before.rm} до ${rm} кг`,
            detail: `Предыдущий раз: #${before.workoutId} (${before.date}). Резкое изменение — проверьте, не опечатка ли в весе.`,
          })
        }
      }
      prev.set(e.exerciseId, { rm, workoutId: w.id, date: w.date })
    }
  }

  const rank = { high: 0, medium: 1, low: 2 }
  return out.sort(
    (a, b) => rank[a.severity] - rank[b.severity] || b.date.localeCompare(a.date),
  )
}
