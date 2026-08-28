import { computed, ref, watch, type Ref } from 'vue'
import type { Exercise, MuscleGroup } from '@/types'
import { FAMILY_CHILDREN, FAMILY_GROUPS } from '@/constants/muscleGroupIcons'

/**
 * Двухуровневая группировка каталога: семья мышц (грудь, спина, руки…)
 * и подгруппа внутри неё (бицепс, трицепс, широчайшие…).
 * Свёрнутость секций переживает перезагрузку.
 */

const FAMILY_ORDER = ['chest', 'back', 'shoulders', 'arms', 'legs', 'core', 'cardio', 'stretching']
const STORE_KEY = 'gym.catalogCollapsed'

/** Семья для каждой детальной группы: широчайшие → спина */
const FAMILY_BY_CHILD = new Map<string, string>()
for (const [family, children] of Object.entries(FAMILY_CHILDREN)) {
  for (const child of children) FAMILY_BY_CHILD.set(child, family)
}

export interface CatalogSubgroup {
  key: string
  id: string
  label: string
  exercises: Exercise[]
}

export interface CatalogSection {
  id: string
  label: string
  count: number
  groups: CatalogSubgroup[]
}

/** Упражнение попадает в одну секцию — по первой основной группе */
function familyOf(ex: Exercise): string {
  for (const id of ex.muscleGroups) {
    if (FAMILY_GROUPS.has(id)) return id
    const parent = FAMILY_BY_CHILD.get(id)
    if (parent) return parent
  }
  return 'other'
}

function subgroupOf(ex: Exercise, family: string): string {
  const children = FAMILY_CHILDREN[family] ?? []
  for (const id of ex.muscleGroups) {
    if (children.includes(id)) return id
  }
  return ''
}

export function useCatalogSections(
  exercises: Ref<Exercise[]>,
  muscleGroups: Ref<MuscleGroup[]>,
  searching: Ref<boolean>,
) {
  function label(id: string): string {
    if (id === 'other') return 'Прочее'
    return muscleGroups.value.find((g) => g.id === id)?.label ?? id
  }

  const sections = computed<CatalogSection[]>(() => {
    const byFamily = new Map<string, Exercise[]>()
    for (const ex of exercises.value) {
      const family = familyOf(ex)
      if (!byFamily.has(family)) byFamily.set(family, [])
      byFamily.get(family)!.push(ex)
    }

    const order = [...FAMILY_ORDER, 'other']
    return [...byFamily.entries()]
      .sort((a, b) => order.indexOf(a[0]) - order.indexOf(b[0]))
      .map(([family, list]) => {
        const bySub = new Map<string, Exercise[]>()
        for (const ex of list) {
          const sub = subgroupOf(ex, family)
          if (!bySub.has(sub)) bySub.set(sub, [])
          bySub.get(sub)!.push(ex)
        }
        // «Без уточнения» идёт первым, дальше — порядок из справочника
        const childOrder = ['', ...(FAMILY_CHILDREN[family] ?? [])]
        const groups = [...bySub.entries()]
          .sort((a, b) => childOrder.indexOf(a[0]) - childOrder.indexOf(b[0]))
          .map(([sub, exs]) => ({
            key: family + '/' + sub,
            id: sub,
            label: sub ? label(sub) : '',
            exercises: exs,
          }))

        return { id: family, label: label(family), count: list.length, groups }
      })
  })

  const collapsed = ref<Set<string>>(
    new Set(JSON.parse(localStorage.getItem(STORE_KEY) || '[]') as string[]),
  )
  watch(collapsed, (v) => localStorage.setItem(STORE_KEY, JSON.stringify([...v])), { deep: true })

  function toggle(key: string) {
    const next = new Set(collapsed.value)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    collapsed.value = next
  }

  /** При поиске секции раскрыты — иначе совпадения не видно */
  function isOpen(key: string): boolean {
    return searching.value || !collapsed.value.has(key)
  }

  return { sections, toggle, isOpen }
}
