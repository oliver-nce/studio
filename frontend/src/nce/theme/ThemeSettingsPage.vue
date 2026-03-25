<template>
  <div class="theme-settings-page">
    <!-- Header -->
    <div class="page-header">
      <h1 class="page-title">Theme Settings</h1>
      <div class="header-actions">
        <button class="action-btn secondary" @click="resetToDefaults">
          Reset to Defaults
        </button>
        <button class="action-btn primary" @click="saveTheme">
          Save Changes
        </button>
      </div>
    </div>

    <!-- Preview Area -->
    <div class="preview-area">
      <div class="preview-label">Live Preview</div>
      <div class="preview-content">
        <!-- Sample UI Elements -->
        <div class="preview-section">
          <h3>Buttons</h3>
          <div class="button-group">
            <button class="btn-primary">Primary Button</button>
            <button class="btn-secondary">Secondary</button>
            <button class="btn-danger">Danger</button>
          </div>
        </div>

        <div class="preview-section">
          <h3>Input Fields</h3>
          <div class="input-group">
            <input type="text" placeholder="Text Input" class="input-field" />
            <select class="input-field">
              <option>Select Option</option>
              <option>Option 1</option>
              <option>Option 2</option>
            </select>
          </div>
        </div>

        <div class="preview-section">
          <h3>Cards</h3>
          <div class="card">
            <h4>Card Title</h4>
            <p class="card-text">This is a preview of how cards will appear with your theme.</p>
          </div>
        </div>

        <div class="preview-section">
          <h3>Tabs</h3>
          <div class="tabs">
            <button class="tab active">Tab 1</button>
            <button class="tab">Tab 2</button>
            <button class="tab">Tab 3</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Theme Controls -->
    <div class="theme-controls">
      <ThemePanel v-model="theme" />
    </div>

    <!-- Color Palettes Preview -->
    <div class="color-palettes">
      <h3>Primary Palette</h3>
      <div class="palette-preview">
        <div
          v-for="swatch in primaryPalette"
          :key="swatch.step"
          class="palette-swatch"
        >
          <div class="swatch-color" :style="{ backgroundColor: swatch.hex }" />
          <div class="swatch-info">
            <div class="swatch-step">--nce-primary-{{ swatch.step }}</div>
            <div class="swatch-hex">{{ swatch.hex }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue"
import type { ThemeSettings, ColorShade } from "@nce/types"
import ThemePanel from "./ThemePanel.vue"
import { generateShades, gamutMap, oklchToHex, hexToOklch } from "./colorShades"
import { useThemeState } from "./useThemeDefaults"

const props = defineProps<{
  modelValue?: ThemeSettings
}>()

const emit = defineEmits<{
  (e: "update:modelValue", value: ThemeSettings): void
}>()

// Theme state
const theme = computed({
  get: () => props.modelValue || useThemeState().defaults,
  set: (value) => emit("update:modelValue", value),
})

// Primary palette preview
const primaryPalette = computed(() => {
  const baseOklch = hexToOklch(theme.value.primary_color)
  const lightnessSteps = [0.99, 0.97, 0.94, 0.91, 0.88, 0.85, 0.75, 0.65, 0.55, 0.45, 0.35]
  const shades: ColorShade[] = []

  lightnessSteps.forEach((l, i) => {
    const step = 950 - i * 50
    const { l: mappedL, c: mappedC, h: mappedH } = gamutMap(l, baseOklch.c, baseOklch.h)
    shades.push({
      step,
      hex: oklchToHex(mappedL, mappedC, mappedH),
      oklch: [mappedL, mappedC, mappedH],
    })
  })

  return shades
})

// Save theme
function saveTheme(): void {
  // Apply theme to root
  const { applyToRoot } = useThemeState()
  applyToRoot(theme.value)
}

// Reset to defaults
function resetToDefaults(): void {
  const defaults = useThemeState().defaults
  emit("update:modelValue", defaults)
}
</script>

<style scoped>
.theme-settings-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

/* Page Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 16px;
  border-bottom: 1px solid #e5e7eb;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.action-btn {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn.primary {
  background: #3b82f6;
  color: white;
  border: none;
}

.action-btn.primary:hover {
  background: #2563eb;
}

.action-btn.secondary {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #e5e7eb;
}

.action-btn.secondary:hover {
  background: #e5e7eb;
}

/* Preview Area */
.preview-area {
  background: white;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
}

.preview-label {
  padding: 12px 16px;
  font-size: 12px;
  font-weight: 500;
  color: #6b7280;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
}

.preview-content {
  padding: 24px;
}

.preview-section {
  margin-bottom: 24px;
}

.preview-section h3 {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin: 0 0 16px 0;
}

.button-group {
  display: flex;
  gap: 8px;
}

.btn-primary {
  padding: 8px 16px;
  background: var(--nce-primary-500);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
}

.btn-primary:hover {
  background: var(--nce-primary-600);
}

.btn-secondary {
  padding: 8px 16px;
  background: var(--nce-secondary-500);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
}

.btn-secondary:hover {
  background: var(--nce-secondary-600);
}

.btn-danger {
  padding: 8px 16px;
  background: var(--nce-danger-500);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
}

.btn-danger:hover {
  background: var(--nce-danger-600);
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.input-field {
  padding: 8px 12px;
  border: 1px solid var(--nce-border);
  border-radius: 6px;
  font-size: 13px;
}

.input-field:focus {
  outline: 2px solid var(--nce-focus-ring);
  outline-offset: 2px;
}

.card {
  padding: 16px;
  background: white;
  border: 1px solid var(--nce-border);
  border-radius: 8px;
}

.card h4 {
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 8px 0;
}

.card-text {
  font-size: 13px;
  color: var(--nce-text-muted);
  margin: 0;
}

.tabs {
  display: flex;
  gap: 4px;
}

.tab {
  padding: 8px 16px;
  border: none;
  background: transparent;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  font-size: 13px;
  color: var(--nce-text-muted);
}

.tab:hover {
  color: var(--nce-text);
}

.tab.active {
  color: var(--nce-primary-500);
  border-bottom-color: var(--nce-primary-500);
}

/* Theme Controls */
.theme-controls {
  background: white;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
}

/* Color Palettes */
.color-palettes {
  background: white;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  padding: 24px;
}

.color-palettes h3 {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 16px 0;
}

.palette-preview {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.palette-swatch {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f9fafb;
  border-radius: 8px;
}

.swatch-color {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

.swatch-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.swatch-step {
  font-size: 11px;
  font-family: monospace;
  color: #6b7280;
}

.swatch-hex {
  font-size: 12px;
  font-family: monospace;
  color: #374151;
}
</style>
