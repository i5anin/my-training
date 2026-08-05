import dayjs from 'dayjs'
import 'dayjs/locale/ru'
import type { ExerciseEntry, Workout } from '@/types'

dayjs.locale('ru')

/** Строка списка тренировок: тренировка + разрыв в днях до предыдущей */
export type WorkoutListRow = Workout & { gapDays: number | null }

/** Порог «большого» разрыва — дольше месяца подсвечиваем */
export const GAP_WARN_DAYS = 31

/** «+5д», «+1м 3д», «+2г 4м 14д» — разрыв между тренировками */
export function fmtGap(days: number): string {
  const y = Math.floor(days / 365)
  const m = Math.floor((days % 365) / 30)
  const d = (days % 365) % 30
  const parts: string[] = []
  if (y) parts.push(`${y}г`)
  if (m) parts.push(`${m}м`)
  if (d || parts.length === 0) parts.push(`${d}д`)
  return '+' + parts.join(' ')
}

/** «пн 05.08.25» */
export function formatDate(iso: string): string {
  return dayjs(iso).format('dd DD.MM.YY')
}

/** Полных дней между двумя датами */
export function gapDays(isoA: string, isoB: string): number {
  return Math.abs(dayjs(isoB).diff(dayjs(isoA), 'day'))
}

/** Длительность редактирования: «45с», «12м», «1ч 5м» */
export function fmtDuration(ms: number): string {
  const s = Math.round(ms / 1000)
  if (s < 60) return `${s}с`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}м`
  const h = Math.floor(m / 60)
  const rm = m % 60
  return rm > 0 ? `${h}ч ${rm}м` : `${h}ч`
}

/** Суммарное число подходов по всем упражнениям тренировки */
export function setsCount(entries: ExerciseEntry[] | undefined): number {
  return (entries || []).reduce((sum, e) => sum + (e.sets || []).length, 0)
}
