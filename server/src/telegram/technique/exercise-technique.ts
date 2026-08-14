import type { Technique } from './technique.types';
import { PUSH_TECHNIQUE } from './technique-push';
import { CORE_TECHNIQUE } from './technique-core';

export type { Technique } from './technique.types';

/** Справочник инструкций по упражнениям, ключ — id из каталога */
export const TECHNIQUE: Record<string, Technique> = {
  ...PUSH_TECHNIQUE,
  ...CORE_TECHNIQUE,
};

export function techniqueOf(exerciseId: string): Technique | null {
  return TECHNIQUE[exerciseId] ?? null;
}
