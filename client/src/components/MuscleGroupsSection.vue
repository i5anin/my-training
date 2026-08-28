<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCatalogStore } from '@/stores/catalogStore'
import MgIcon from '@/components/MgIcon.vue'
import { X, Plus, ChevronDown, ChevronRight } from 'lucide-vue-next'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { plural, slug } from '@/composables/textFormat'
import { useCatalogUsage } from '@/composables/useCatalogUsage'
import { FAMILY_CHILDREN, FAMILY_GROUPS } from '@/constants/muscleGroupIcons'
import type { MuscleGroup } from '@/types'

const catalogStore = useCatalogStore()
const { groupUsage } = useCatalogUsage()

// ─── Дерево: семья и её детальные группы ────────────────
const collapsed = ref(new Set<string>())

function toggleFamily(id: string) {
  const next = new Set(collapsed.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  collapsed.value = next
}

const byId = computed(
  () => new Map(catalogStore.muscleGroups.map((g) => [g.id, g] as const)),
)

/** Семьи в порядке справочника, каждая со своими детальными группами */
const tree = computed(() => {
  const known = new Set<string>()
  const families = catalogStore.muscleGroups
    .filter((g) => FAMILY_GROUPS.has(g.id))
    .map((family) => {
      known.add(family.id)
      const children = (FAMILY_CHILDREN[family.id] ?? [])
        .map((id) => byId.value.get(id))
        .filter((g): g is MuscleGroup => Boolean(g))
      children.forEach((c) => known.add(c.id))
      return { family, children }
    })
  // Группы вне семей — например добавленные руками
  const orphans = catalogStore.muscleGroups.filter((g) => !known.has(g.id))
  return { families, orphans }
})

// ─── Добавление ─────────────────────────────────────────
const newGroupLabel = ref('')
const newGroupId = ref('')

async function addGroup() {
  const label = newGroupLabel.value.trim()
  if (!label) return
  const id = newGroupId.value.trim() || slug(label)
  if (!id) {
    alert('Название не содержит допустимых символов')
    return
  }
  if (catalogStore.muscleGroups.some((g) => g.id === id)) {
    alert('Группа с таким id уже существует')
    return
  }
  await catalogStore.addMuscleGroup({ id, label })
  newGroupLabel.value = ''
  newGroupId.value = ''
}

// ─── Переименование и удаление ──────────────────────────
async function updateGroupLabel(g: MuscleGroup, e: Event) {
  const input = e.target as HTMLInputElement
  const label = input.value
  if (!label.trim() || label === g.label) {
    input.value = g.label // переименование отклонено — вернуть прежнее значение
    return
  }
  await catalogStore.addMuscleGroup({ ...g, label: label.trim() })
}

async function deleteGroup(g: MuscleGroup) {
  const used = groupUsage.value.get(g.id) ?? 0
  const exUsed = catalogStore.exercises.filter((e) => e.muscleGroups.includes(g.id)).length
  const parts: string[] = []
  if (used > 0) parts.push(`${used} ${plural(used, 'тренировке', 'тренировках')}`)
  if (exUsed > 0) parts.push(`${exUsed} ${plural(exUsed, 'упражнении', 'упражнениях')}`)
  const msg = parts.length
    ? `Группа "${g.label}" используется в ${parts.join(' и ')}. Удалить?`
    : `Удалить "${g.label}"?`
  if (!confirm(msg)) return
  await catalogStore.removeMuscleGroup(g.id)
}
</script>

<template>
  <div class="mg-tab">
    <!-- Добавить -->
    <div class="add-form">
      <input v-model="newGroupLabel" placeholder="Название (Грудь)" class="add-input" />
      <input v-model="newGroupId" placeholder="id (chest)" class="add-input add-id" />
      <button class="btn-add" @click="addGroup" :disabled="!newGroupLabel.trim()"><Plus class="size-4" /></button>
    </div>

    <!-- Список: семьи разворачиваются, внутри детальные группы -->
    <div class="mg-list">
      <template v-for="node in tree.families" :key="node.family.id">
        <div class="mg-item mg-family">
          <button
            v-if="node.children.length"
            class="mg-toggle"
            @click="toggleFamily(node.family.id)"
          >
            <component
              :is="collapsed.has(node.family.id) ? ChevronRight : ChevronDown"
              class="size-3.5"
            />
          </button>
          <span v-else class="mg-toggle mg-toggle-empty"></span>
          <MgIcon :id="node.family.id" :size="22" bare />
          <input
            class="mg-label-input"
            :value="node.family.label"
            @blur="updateGroupLabel(node.family, $event)"
            @keydown.enter="($event.target as HTMLInputElement).blur()"
          />
          <span class="mg-usage">{{ groupUsage.get(node.family.id) ?? 0 }}×</span>
          <button class="del-btn" @click="deleteGroup(node.family)"><X class="size-3.5" /></button>
        </div>
        <div
          v-for="child in collapsed.has(node.family.id) ? [] : node.children" :key="child.id"
          class="mg-item mg-child"
        >
          <MgIcon :id="child.id" :size="18" bare />
          <input
            class="mg-label-input"
            :value="child.label"
            @blur="updateGroupLabel(child, $event)"
            @keydown.enter="($event.target as HTMLInputElement).blur()"
          />
          <span class="mg-usage">{{ groupUsage.get(child.id) ?? 0 }}×</span>
          <button class="del-btn" @click="deleteGroup(child)"><X class="size-3.5" /></button>
        </div>
      </template>

      <div v-for="g in tree.orphans" :key="g.id" class="mg-item">
        <Tooltip>
          <TooltipTrigger as-child>
            <span class="mg-icon-hit"><MgIcon :id="g.id" :size="22" bare /></span>
          </TooltipTrigger>
          <TooltipContent>id: {{ g.id }}</TooltipContent>
        </Tooltip>
        <input
          class="mg-label-input"
          :value="g.label"
          @blur="updateGroupLabel(g, $event)"
          @keydown.enter="($event.target as HTMLInputElement).blur()"
        />
        <Tooltip>
          <TooltipTrigger as-child>
            <span class="mg-usage">{{ groupUsage.get(g.id) ?? 0 }}×</span>
          </TooltipTrigger>
          <TooltipContent>Использований: {{ groupUsage.get(g.id) ?? 0 }}</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger as-child>
            <button class="del-btn" @click="deleteGroup(g)"><X class="size-3.5" /></button>
          </TooltipTrigger>
          <TooltipContent>Удалить</TooltipContent>
        </Tooltip>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ── Дерево групп ── */
.mg-family {
  background: #141414;
}

.mg-child {
  padding-left: 34px;
}

/* Детальные группы — бледные, как подписи мышц в других местах:
   основные читаются первыми, уточнения не спорят с ними */
.mg-child :deep(.mg-icon) {
  opacity: 0.4;
}

.mg-child .mg-label-input {
  color: #6b6b6b;
  font-size: 0.8rem;
}

.mg-child .mg-usage {
  color: #3c3c3c;
}

.mg-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  flex-shrink: 0;
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  padding: 0;
}
.mg-toggle:hover { color: #aaa; }
.mg-toggle-empty { cursor: default; }

/* ── Форма добавления ── */
.add-form {
  display: flex;
  gap: 5px;
  flex-shrink: 0;
}
.add-input {
  flex: 1;
  min-width: 0;
  padding: 6px 10px;
  border: 1px solid #2a2a2a;
  border-radius: 6px;
  background: #111;
  color: #eee;
  font-size: 0.85rem;
}
.add-input:focus { outline: none; border-color: #5a8; }
.add-id { max-width: 90px; }
.btn-add {
  padding: 0 14px;
  border: 1px solid #2a7a4a;
  border-radius: 6px;
  background: #1a3a2a;
  color: #5a8;
  cursor: pointer;
  font-size: 1rem;
  font-weight: bold;
}
.btn-add:hover:not(:disabled) { background: #2a5a3a; }
.btn-add:disabled { opacity: 0.3; cursor: not-allowed; }

/* ── Список групп ── */
.mg-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.mg-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 6px;
  background: #161616;
  border: 1px solid #1f1f1f;
}
.mg-item:hover { background: #1a1a1a; }

.mg-label-input {
  flex: 1;
  min-width: 0;
  padding: 3px 6px;
  border: 1px solid transparent;
  border-radius: 4px;
  background: transparent;
  color: #eee;
  font-size: 0.88rem;
}
.mg-label-input:hover { border-color: #2a2a2a; background: #0a0a0a; }
.mg-label-input:focus { outline: none; border-color: #5a8; background: #0a0a0a; }

.mg-usage {
  font-size: 0.65rem;
  color: #444;
  flex-shrink: 0;
  min-width: 24px;
  text-align: right;
}

/* ── Удалить ── */
.del-btn {
  background: none;
  border: none;
  color: #444;
  cursor: pointer;
  font-size: 0.85rem;
  padding: 2px 4px;
  flex-shrink: 0;
}
.del-btn:hover { color: #a55; }
</style>
