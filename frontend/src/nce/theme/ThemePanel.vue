<template>
  <div class="theme-panel">
    <!-- Tab Navigation -->
    <div class="tab-nav">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        class="tab-btn"
        :class="{ active: activeTab === tab.id }"
        @click="activeTab = tab.id"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Tab Content -->
    <div class="tab-content">
      <!-- Colors Tab -->
      <div v-if="activeTab === 'colors'" class="tab-panel">
        <div class="color-section">
          <label class="section-label">Primary Color</label>
          <BrandColorPicker v-model="theme.primary_color" />
        </div>

        <div class="color-section">
          <label class="section-label">Secondary Color</label>
          <BrandColorPicker v-model="theme.secondary_color" />
        </div>

        <div class="color-section">
          <label class="section-label">Accent Color</label>
          <BrandColorPicker v-model="theme.accent_color" />
        </div>

        <div class="color-section">
          <label class="section-label">Semantic Colors</label>
          <div class="semantic-colors">
            <div class="color-control">
              <span class="color-label">Success</span>
              <BrandColorPicker v-model="theme.success_color" />
            </div>
            <div class="color-control">
              <span class="color-label">Warning</span>
              <BrandColorPicker v-model="theme.warning_color" />
            </div>
            <div class="color-control">
              <span class="color-label">Danger</span>
              <BrandColorPicker v-model="theme.danger_color" />
            </div>
            <div class="color-control">
              <span class="color-label">Info</span>
              <BrandColorPicker v-model="theme.info_color" />
            </div>
          </div>
        </div>

        <div class="color-section">
          <label class="section-label">Neutral Colors</label>
          <div class="neutral-colors">
            <div class="color-control">
              <span class="color-label">Text</span>
              <BrandColorPicker v-model="theme.text_color" />
            </div>
            <div class="color-control">
              <span class="color-label">Border</span>
              <BrandColorPicker v-model="theme.border_color" />
            </div>
            <div class="color-control">
              <span class="color-label">Background</span>
              <BrandColorPicker v-model="theme.background_color" />
            </div>
          </div>
        </div>
      </div>

      <!-- Typography Tab -->
      <div v-if="activeTab === 'typography'" class="tab-panel">
        <div class="control-group">
          <label class="control-label">Font Family</label>
          <select v-model="theme.font_family" class="select-input">
            <option value="Inter, -apple-system, BlinkMacSystemFont, sans-serif">Inter (System)</option>
            <option value="Arial, Helvetica, sans-serif">Arial</option>
            <option value="Helvetica, Arial, sans-serif">Helvetica</option>
            <option value="Georgia, serif">Georgia</option>
            <option value="Courier, monospace">Courier</option>
            <option value="Times New Roman, Times, serif">Times New Roman</option>
            <option value="'Courier New', Courier, monospace">Courier New</option>
            <option value="'Comic Sans MS', cursive, sans-serif">Comic Sans MS</option>
            <option value="'Lucida Sans Unicode', 'Lucida Grande', sans-serif">Lucida Grande</option>
            <option value="'Trebuchet MS', Helvetica, sans-serif">Trebuchet MS</option>
            <option value="'Verdana', Geneva, sans-serif">Verdana</option>
          </select>
        </div>

        <div class="control-group">
          <label class="control-label">Base Font Size</label>
          <div class="range-control">
            <input
              type="range"
              v-model.number="fontSize"
              min="12"
              max="24"
              step="1"
              @input="updateFontSize"
            />
            <span class="value-display">{{ theme.font_size_base }}</span>
          </div>
        </div>

        <div class="control-group">
          <label class="control-label">Font Weight</label>
          <div class="range-control">
            <input
              type="range"
              v-model.number="theme.font_weight_base"
              min="100"
              max="900"
              step="100"
            />
            <span class="value-display">{{ theme.font_weight_base }}</span>
          </div>
        </div>

        <div class="control-group">
          <label class="control-label">Line Height</label>
          <div class="range-control">
            <input
              type="range"
              v-model.number="theme.line_height_base"
              min="1"
              max="2"
              step="0.1"
            />
            <span class="value-display">{{ theme.line_height_base }}</span>
          </div>
        </div>
      </div>

      <!-- Layout Tab -->
      <div v-if="activeTab === 'layout'" class="tab-panel">
        <div class="control-group">
          <label class="control-label">Border Radius</label>
          <div class="range-control">
            <input
              type="range"
              v-model.number="borderRadius"
              min="0"
              max="24"
              step="1"
              @input="updateBorderRadius"
            />
            <span class="value-display">{{ theme.border_radius }}</span>
          </div>
        </div>

        <div class="control-group">
          <label class="control-label">Spacing Unit</label>
          <div class="range-control">
            <input
              type="range"
              v-model.number="spacingUnit"
              min="4"
              max="32"
              step="4"
              @input="updateSpacingUnit"
            />
            <span class="value-display">{{ theme.spacing_unit }}</span>
          </div>
        </div>

        <div class="control-group">
          <label class="control-label">Max Content Width</label>
          <div class="range-control">
            <input
              type="range"
              v-model.number="maxContentWidth"
              min="800"
              max="1600"
              step="50"
              @input="updateMaxContentWidth"
            />
            <span class="value-display">{{ theme.max_content_width }}</span>
          </div>
        </div>

        <div class="control-group">
          <label class="control-label">Transition Speed</label>
          <div class="range-control">
            <input
              type="range"
              v-model.number="transitionSpeed"
              min="0"
              max="1"
              step="0.1"
              @input="updateTransitionSpeed"
            />
            <span class="value-display">{{ theme.transition_speed }}</span>
          </div>
        </div>
      </div>

      <!-- Custom CSS Tab -->
      <div v-if="activeTab === 'custom'" class="tab-panel">
        <div class="css-editor">
          <label class="editor-label">Custom CSS</label>
          <textarea
            v-model="theme.custom_css"
            class="css-textarea"
            placeholder="Enter your custom CSS here..."
            rows="10"
          />
        </div>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="panel-actions">
      <button class="action-btn secondary" @click="resetToDefaults">
        Reset to Defaults
      </button>
      <button class="action-btn primary" @click="saveTheme">
        Apply Changes
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue"
import type { ThemeSettings } from "@nce/types"
import BrandColorPicker from "./BrandColorPicker.vue"
import { useThemeState } from "./useThemeDefaults"

const props = defineProps<{
  modelValue?: ThemeSettings
}>()

const emit = defineEmits<{
  (e: "update:modelValue", value: ThemeSettings): void
}>()

// Tab navigation
const activeTab = ref("colors")
const tabs = [
  { id: "colors", label: "Colors" },
  { id: "typography", label: "Typography" },
  { id: "layout", label: "Layout" },
  { id: "custom", label: "Custom CSS" },
]

// Theme state
const { themeSettings, applyToRoot } = useThemeState()
const theme = computed({
  get: () => props.modelValue || themeSettings.value,
  set: (value) => emit("update:modelValue", value),
})

// Computed properties for range inputs
const fontSize = computed({
  get: () => parseInt(theme.value.font_size_base) || 16,
  set: (value) => {
    theme.value.font_size_base = `${value}px`
  },
})

const borderRadius = computed({
  get: () => parseInt(theme.value.border_radius) || 8,
  set: (value) => {
    theme.value.border_radius = `${value}px`
  },
})

const spacingUnit = computed({
  get: () => parseInt(theme.value.spacing_unit) || 8,
  set: (value) => {
    theme.value.spacing_unit = `${value}px`
  },
})

const maxContentWidth = computed({
  get: () => parseInt(theme.value.max_content_width) || 1200,
  set: (value) => {
    theme.value.max_content_width = `${value}px`
  },
})

const transitionSpeed = computed({
  get: () => parseFloat(theme.value.transition_speed) || 0.2,
  set: (value) => {
    theme.value.transition_speed = `${value}s`
  },
})

// Update methods
function updateFontSize(value: number): void {
  theme.value.font_size_base = `${value}px`
}

function updateBorderRadius(value: number): void {
  theme.value.border_radius = `${value}px`
}

function updateSpacingUnit(value: number): void {
  theme.value.spacing_unit = `${value}px`
}

function updateMaxContentWidth(value: number): void {
  theme.value.max_content_width = `${value}px`
}

function updateTransitionSpeed(value: number): void {
  theme.value.transition_speed = `${value}s`
}

// Save theme
function saveTheme(): void {
  applyToRoot(theme.value)
}

// Reset to defaults
function resetToDefaults(): void {
  const defaults = useThemeState().defaults
  emit("update:modelValue", defaults)
}
</script>

<style scoped>
.theme-panel {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 500px;
  gap: 16px;
}

/* Tab Navigation */
.tab-nav {
  display: flex;
  gap: 4px;
  border-bottom: 1px solid #e5e7eb;
}

.tab-btn {
  padding: 10px 16px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  color: #6b7280;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
}

.tab-btn:hover {
  color: #374151;
}

.tab-btn.active {
  color: #3b82f6;
  border-bottom-color: #3b82f6;
}

/* Tab Content */
.tab-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.tab-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* Section Labels */
.section-label {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 8px;
  display: block;
}

/* Color Controls */
.color-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.semantic-colors,
.neutral-colors {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.color-control {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.color-label {
  font-size: 12px;
  font-weight: 500;
  color: #6b7280;
}

/* Control Groups */
.control-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.control-label {
  font-size: 13px;
  font-weight: 500;
  color: #374151;
}

.select-input {
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 13px;
}

/* Range Controls */
.range-control {
  display: flex;
  align-items: center;
  gap: 12px;
}

.range-control input[type="range"] {
  flex: 1;
  height: 4px;
  border-radius: 2px;
  -webkit-appearance: none;
  background: #e5e7eb;
}

.range-control input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #3b82f6;
  cursor: pointer;
}

.value-display {
  font-size: 12px;
  font-family: monospace;
  color: #6b7280;
  min-width: 48px;
  text-align: right;
}

/* CSS Editor */
.css-editor {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.editor-label {
  font-size: 13px;
  font-weight: 500;
  color: #374151;
}

.css-textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-family: monospace;
  font-size: 12px;
  resize: vertical;
}

/* Panel Actions */
.panel-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
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
</style>
