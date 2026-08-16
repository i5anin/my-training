import { computed, ref, type ComputedRef } from 'vue'

interface Keyed {
  key: string
}

/** Сворачивание групп-месяцев в списке тренировок по ключу YYYY-MM */
export function useCollapsedMonths(groups: ComputedRef<Keyed[]>) {
  const collapsed = ref(new Set<string>())

  function toggleMonth(key: string) {
    const next = new Set(collapsed.value)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    collapsed.value = next
  }

  // Оставляет развёрнутым только самый свежий месяц (groups[0] — список
  // сортирован по дате убывающая), остальные сворачивает одним кликом
  function collapseAllButFirst() {
    collapsed.value = new Set(groups.value.slice(1).map((g) => g.key))
  }

  function expandAll() {
    collapsed.value = new Set()
  }

  const allCollapsedButFirst = computed(() =>
    groups.value.length > 1 &&
    groups.value.slice(1).every((g) => collapsed.value.has(g.key)),
  )

  return { collapsed, toggleMonth, collapseAllButFirst, expandAll, allCollapsedButFirst }
}
