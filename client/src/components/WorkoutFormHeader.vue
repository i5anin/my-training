<script setup lang="ts">
import MuscleGroupSelect from '@/components/MuscleGroupSelect.vue'
import PhotoAttach from '@/components/PhotoAttach.vue'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'

defineProps<{ isNew: boolean }>()

const id = defineModel<number>('id', { required: true })
const date = defineModel<string>('date', { required: true })
const primaryType = defineModel<string>('primaryType')
const secondaryType = defineModel<string>('secondaryType')
const description = defineModel<string>('description')
const photoIds = defineModel<string[]>('photoIds')
</script>

<template>
  <div class="editor-top">
    <div class="id-heading">
      <span class="id-label">{{ isNew ? 'Новая тренировка' : 'Тренировка' }} #</span>
      <Tooltip>
        <TooltipTrigger as-child>
          <input type="number" class="id-input" v-model.number="id" min="1" />
        </TooltipTrigger>
        <TooltipContent>Номер тренировки</TooltipContent>
      </Tooltip>
    </div>
  </div>

  <div class="form-grid">
    <!-- Первая строка: дата + группы + фото -->
    <div class="head-row">
      <div class="field-row">
        <label>Дата</label>
        <input type="date" v-model="date" class="date-input" />
      </div>
      <div class="field-row grow">
        <MuscleGroupSelect
          :modelValue="primaryType ?? ''"
          @update:modelValue="primaryType = $event"
          label="Основная группа"
        />
      </div>
      <div class="field-row grow">
        <MuscleGroupSelect
          :modelValue="secondaryType ?? ''"
          @update:modelValue="secondaryType = $event"
          label="Дополнительная группа"
          :disabledId="primaryType ?? ''"
        />
      </div>
      <div class="field-row">
        <label>Фото</label>
        <PhotoAttach
          :photoIds="photoIds || []"
          :thumbSize="32"
          @update="photoIds = $event"
        />
      </div>
    </div>

    <!-- Вторая строка: описание -->
    <input
      v-model="description"
      placeholder="Описание тренировки..."
      class="desc-input"
    />
  </div>
</template>

<style scoped>
.editor-top {
  margin-bottom: 10px;
}

.id-heading {
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 1.3rem;
  font-weight: bold;
}

.id-label {
  white-space: nowrap;
  color: #ccc;
}

.id-input {
  width: 72px;
  background: transparent;
  border: none;
  border-bottom: 1px dashed #555;
  color: #eee;
  font-size: 1.3rem;
  font-weight: bold;
  font-family: inherit;
  padding: 0 2px;
  -moz-appearance: textfield;
}

.id-input::-webkit-outer-spin-button,
.id-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
}

.id-input:focus {
  outline: none;
  border-bottom-color: #5a8;
}

.form-grid {
  background: #1a1a1a;
  border: 1px solid #2a2a2a;
  border-radius: 10px;
  padding: 10px 12px;
  margin-bottom: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* Всё в одну строку: дата, группы, фото */
.head-row {
  display: flex;
  align-items: flex-end;
  gap: 14px;
  flex-wrap: wrap;
}

.field-row {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.field-row.grow {
  flex: 1;
  min-width: 180px;
}

.field-row label {
  font-size: 0.72rem;
  color: #666;
}

.date-input,
.desc-input {
  width: 100%;
  padding: 7px 10px;
  border: 1px solid #333;
  border-radius: 6px;
  background: #111;
  color: #eee;
  font-size: 0.9rem;
  font-family: inherit;
}

.date-input:focus,
.desc-input:focus {
  outline: none;
  border-color: #5a8;
}

.date-input {
  width: auto;
}
</style>
