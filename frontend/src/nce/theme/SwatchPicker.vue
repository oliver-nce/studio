<template>
  <div class="nce-swatch-picker" :class="{ 'with-label': label }">
    <!-- Optional Label -->
    <label v-if="label" class="picker-label">
      {{ label }}
    </label>

    <!-- Swatch Grid -->
    <div class="swatch-grid">
      <div
        v-for="swatch in swatches"
        :key="swatch.step"
        class="swatch"
        :style="{ backgroundColor: swatch.hex }"
        :class="{ active: swatch.hex === modelValue }"
        @click="selectSwatch(swatch.hex)"
        :title="swatch.hex"
      >
        <!-- Active indicator dot -->
        <div v-if="swatch.hex === modelValue" class="active-indicator" />
      </div>
    </div>

    <!-- Selected Value Display (optional) -->
    <div v-if="showValue && modelValue" class="selected-value">
      {{ modelValue }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue"
import type { ColorShade } from "@nce/types"
import { generateShades } from "./colorShades"

const props = defineProps<{
  modelValue?: string
  baseColor?: string
  label?: string
  showValue?: boolean
}>()

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void
  (e: "change", value: string): void
}>()

const swatches = ref<ColorShade[]>([])

// Generate swatches from base color
function generateSwatches(baseHex: string): void {
  const shades = generateShades(baseHex, 11)
  swatches.value = shades
}

// Select a swatch
function selectSwatch(hex: string): void {
  emit("update:modelValue", hex)
  emit("change", hex)
}

// Initialize
onMounted(() => {
  generateSwatches(props.baseColor || "#3b82f6")
})
</script>

<style scoped>
.nce-swatch-picker {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.picker-label {
  font-size: 13px;
  font-weight: 500;
  color: #374151;
}

.swatch-grid {
  display: grid;
  grid-template-columns: repeat(11, 1fr);
  gap: 4px;
}

.swatch {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  cursor: pointer;
  position: relative;
  transition: transform 0.1s;
}

.swatch:hover {
  transform: scale(1.2);
}

.swatch.active {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

.active-indicator {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: white;
  box-shadow: 0 0 2px rgba(0, 0, 0, 0.5);
}

.selected-value {
  font-size: 12px;
  font-family: monospace;
  color: #6b7280;
  text-align: center;
}
</style>
