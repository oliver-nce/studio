<template>
  <div class="nce-brand-color-picker">
    <!-- Color Preview -->
    <div
      class="color-preview"
      :style="{ backgroundColor: displayColor }"
      @click="showPicker = !showPicker"
    >
      <svg class="eye-dropper" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M12 2.5l-1.5 1.5 8.5 8.5 1.5-1.5-8.5-8.5zm0 19l-9-9 1.5-1.5 9 9-1.5 1.5z" />
      </svg>
    </div>

    <!-- Color Picker Dropdown -->
    <div v-if="showPicker" class="color-picker-dropdown" @click.stop>
      <!-- Eye Dropper Button -->
      <button
        v-if="hasEyeDropper"
        class="eye-dropper-btn"
        @click="useEyeDropper"
        title="Use Eye Dropper"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M12 2.5l-1.5 1.5 8.5 8.5 1.5-1.5-8.5-8.5zm0 19l-9-9 1.5-1.5 9 9-1.5 1.5z" />
        </svg>
      </button>

      <!-- OKLCH Controls -->
      <div class="oklch-controls">
        <!-- Lightness (L) -->
        <div class="control-group">
          <label class="control-label">L</label>
          <input
            type="range"
            class="range-slider"
            min="0"
            max="1"
            step="0.01"
            v-model.number="oklch.l"
            @input="updateFromOklch"
          />
          <span class="value-display">{{ Math.round(oklch.l * 100) }}</span>
        </div>

        <!-- Chroma (C) -->
        <div class="control-group">
          <label class="control-label">C</label>
          <input
            type="range"
            class="range-slider"
            min="0"
            max="0.4"
            step="0.01"
            v-model.number="oklch.c"
            @input="updateFromOklch"
          />
          <span class="value-display">{{ Math.round(oklch.c * 100) }}</span>
        </div>

        <!-- Hue (H) -->
        <div class="control-group">
          <label class="control-label">H</label>
          <input
            type="range"
            class="range-slider"
            min="0"
            max="360"
            step="1"
            v-model.number="oklch.h"
            @input="updateFromOklch"
          />
          <span class="value-display">{{ Math.round(oklch.h) }}°</span>
        </div>
      </div>

      <!-- Hex Input -->
      <div class="hex-input-group">
        <input
          type="text"
          class="hex-input"
          v-model="hexInput"
          @input="updateFromHexInput"
          placeholder="#ffffff"
        />
      </div>

      <!-- Shade Selector -->
      <div class="shade-selector">
        <div
          v-for="shade in shadePalette"
          :key="shade.step"
          class="shade-swatch"
          :style="{ backgroundColor: shade.hex }"
          :class="{ active: shade.hex === displayColor }"
          @click="selectShade(shade)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue"
import type { ColorShade } from "@nce/types"
import { hexToOklch, oklchToHex, gamutMap } from "./colorShades"

const props = defineProps<{
  modelValue?: string
}>()

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void
  (e: "change", value: string): void
}>()

const showPicker = ref(false)
const hexInput = ref("")
const hasEyeDropper = ref(false)
const oklch = ref({ l: 1, c: 0, h: 0 })

// Computed display color
const displayColor = computed({
  get: () => props.modelValue || "#ffffff",
  set: (value) => {
    updateFromHex(value)
  },
})

// Palette shades (11 shades from 50 to 950)
const shadePalette = computed(() => {
  const baseOklch = hexToOklch(displayColor.value)
  const shades: { step: number; hex: string }[] = []
  const lightnessSteps = [0.99, 0.97, 0.94, 0.91, 0.88, 0.85, 0.75, 0.65, 0.55, 0.45, 0.35]

  lightnessSteps.forEach((l, i) => {
    const step = 950 - i * 50
    const { l: mappedL, c: mappedC, h: mappedH } = gamutMap(l, baseOklch.c, baseOklch.h)
    shades.push({ step, hex: oklchToHex(mappedL, mappedC, mappedH) })
  })

  return shades
})

// Initialize from hex
function updateFromHex(hex: string): void {
  const oklchColor = hexToOklch(hex)
  oklch.value = oklchColor
  hexInput.value = hex
}

// Update from OKLCH inputs
function updateFromOklch(): void {
  const { l, c, h } = oklch.value
  const { l: mappedL, c: mappedC, h: mappedH } = gamutMap(l, c, h)
  const hex = oklchToHex(mappedL, mappedC, mappedH)
  hexInput.value = hex
  emit("update:modelValue", hex)
  emit("change", hex)
}

// Update from hex input
function updateFromHexInput(e: Event): void {
  const input = e.target as HTMLInputElement
  let hex = input.value.trim()

  // Add # if missing
  if (!hex.startsWith("#")) {
    hex = "#" + hex
  }

  // Validate hex
  const hexRegex = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/
  if (!hexRegex.test(hex)) return

  updateFromHex(hex)
}

// Select a shade from palette
function selectShade(shade: { step: number; hex: string }): void {
  hexInput.value = shade.hex
  updateFromHex(shade.hex)
}

// Eye dropper support
function useEyeDropper(): void {
  if (!hasEyeDropper.value || typeof EyeDropper === "undefined") return

  const eyeDropper = new EyeDropper()
  eyeDropper
    .open()
    .then((result) => {
      updateFromHex(result.sRGBHex)
    })
    .catch(() => {
      // User cancelled or error
    })
}

// Check for eye dropper support
function checkEyeDropperSupport(): void {
  hasEyeDropper.value = typeof EyeDropper !== "undefined"
}

// Click outside to close
function handleClickOutside(event: MouseEvent): void {
  if (!showPicker.value) return
  const picker = document.querySelector(".color-picker-dropdown")
  if (picker && !picker.contains(event.target as Node)) {
    showPicker.value = false
  }
}

// Lifecycle
onMounted(() => {
  checkEyeDropperSupport()
  updateFromHex(displayColor.value)
  document.addEventListener("click", handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside)
})
</script>

<style scoped>
.nce-brand-color-picker {
  position: relative;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.color-preview {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  border: 2px solid #e5e7eb;
  cursor: pointer;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: border-color 0.2s;
}

.color-preview:hover {
  border-color: #3b82f6;
}

.color-preview .eye-dropper {
  width: 24px;
  height: 24px;
  color: rgba(0, 0, 0, 0.5);
}

.color-picker-dropdown {
  position: absolute;
  top: 56px;
  left: 50%;
  transform: translateX(-50%);
  width: 280px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  z-index: 100;
}

/* Eye Dropper Button */
.eye-dropper-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  background: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.eye-dropper-btn:hover {
  background: #f3f4f6;
  border-color: #3b82f6;
}

.eye-dropper-btn svg {
  width: 20px;
  height: 20px;
  color: #374151;
}

/* OKLCH Controls */
.oklch-controls {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.control-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.control-label {
  width: 20px;
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  text-align: center;
}

.range-slider {
  flex: 1;
  height: 4px;
  border-radius: 2px;
  -webkit-appearance: none;
  background: #e5e7eb;
}

.range-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #3b82f6;
  cursor: pointer;
}

.range-slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #3b82f6;
  cursor: pointer;
  border: none;
}

.value-display {
  width: 36px;
  font-size: 12px;
  font-family: monospace;
  color: #6b7280;
  text-align: right;
}

/* Hex Input */
.hex-input-group {
  display: flex;
  gap: 8px;
}

.hex-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  font-family: monospace;
}

/* Shade Selector */
.shade-selector {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.shade-swatch {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  cursor: pointer;
  transition: transform 0.1s;
}

.shade-swatch:hover {
  transform: scale(1.1);
}

.shade-swatch.active {
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}
</style>
