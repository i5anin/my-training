import type { Program } from './types'
import { hybrid } from './hybrid'
import { tomHolland } from './tom-holland'
import { tomHollandBar } from './tom-holland-bar'
import { davidLaid } from './david-laid'

export type { Program, ProgramDay, ProgramExercise } from './types'

/** Кортеж, а не массив: первая программа всегда есть — она выбрана по умолчанию */
export const PROGRAMS: [Program, ...Program[]] = [
  hybrid,
  tomHolland,
  tomHollandBar,
  davidLaid,
]
