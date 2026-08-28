import { ref, watch } from 'vue'

const STORE_KEY = 'gym.weightWithBar'

/**
 * Шкала веса в интерфейсе. В базе подходы всегда хранятся в блинах,
 * как в бумажной тетради; переключатель меняет только то, в чём вес
 * показывается и вводится: блины или полный вес вместе с грифом.
 */
const withBar = ref(localStorage.getItem(STORE_KEY) === '1')

watch(withBar, (on) => localStorage.setItem(STORE_KEY, on ? '1' : '0'))

/** Блины → то, что видит пользователь */
export function toDisplay(plates: number, bar: number): number {
  if (!withBar.value || !bar || plates <= 0) return plates
  return plates + bar
}

/** То, что ввёл пользователь → блины для базы */
export function toPlates(shown: number, bar: number): number {
  if (!withBar.value || !bar || shown <= 0) return shown
  return Math.max(0, shown - bar)
}

export function useWeightUnits() {
  return {
    withBar,
    toggle: () => { withBar.value = !withBar.value },
  }
}
