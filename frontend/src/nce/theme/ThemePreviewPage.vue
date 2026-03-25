<template>
  <div class="theme-preview-page">
    <!-- Header -->
    <div class="page-header">
      <h1 class="page-title">Theme Preview</h1>
      <div class="header-actions">
        <button
          class="mode-toggle"
          :class="{ 'mode-dark': isDarkMode }"
          @click="toggleMode"
        >
          {{ isDarkMode ? "☀️ Light" : "🌙 Dark" }}
        </button>
        <button class="action-btn primary" @click="backToEditor">
          Back to Editor
        </button>
      </div>
    </div>

    <!-- Preview Area -->
    <div class="preview-content">
      <!-- Buttons Section -->
      <section class="preview-section">
        <h2 class="section-title">Buttons</h2>
        <div class="button-grid">
          <button class="btn btn-primary">Primary</button>
          <button class="btn btn-secondary">Secondary</button>
          <button class="btn btn-danger">Danger</button>
          <button class="btn btn-success">Success</button>
          <button class="btn btn-warning">Warning</button>
          <button class="btn btn-info">Info</button>
          <button class="btn btn-link">Link</button>
          <button class="btn btn-text">Text</button>
        </div>
      </section>

      <!-- Inputs Section -->
      <section class="preview-section">
        <h2 class="section-title">Form Inputs</h2>
        <div class="input-form">
          <div class="form-group">
            <label class="form-label">Text Input</label>
            <input type="text" class="form-input" placeholder="Enter text..." />
          </div>

          <div class="form-group">
            <label class="form-label">Email Input</label>
            <input type="email" class="form-input" placeholder="Enter email..." />
          </div>

          <div class="form-group">
            <label class="form-label">Password Input</label>
            <input type="password" class="form-input" placeholder="Enter password..." />
          </div>

          <div class="form-group">
            <label class="form-label">Select Dropdown</label>
            <select class="form-select">
              <option>Select an option...</option>
              <option>Option 1</option>
              <option>Option 2</option>
              <option>Option 3</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Textarea</label>
            <textarea class="form-textarea" rows="3" placeholder="Enter text..." />
          </div>

          <div class="form-group">
            <label class="form-label">Checkbox</label>
            <label class="checkbox-label">
              <input type="checkbox" class="form-checkbox" />
              <span>Accept terms and conditions</span>
            </label>
          </div>

          <div class="form-group">
            <label class="form-label">Radio Buttons</label>
            <div class="radio-group">
              <label class="radio-label">
                <input type="radio" name="radio-group" class="form-radio" />
                <span>Option A</span>
              </label>
              <label class="radio-label">
                <input type="radio" name="radio-group" class="form-radio" />
                <span>Option B</span>
              </label>
              <label class="radio-label">
                <input type="radio" name="radio-group" class="form-radio" />
                <span>Option C</span>
              </label>
            </div>
          </div>
        </div>
      </section>

      <!-- Cards Section -->
      <section class="preview-section">
        <h2 class="section-title">Cards</h2>
        <div class="card-grid">
          <div class="card">
            <div class="card-header">
              <h3 class="card-title">Simple Card</h3>
            </div>
            <div class="card-body">
              <p class="card-text">
                This is a preview of a simple card component with the current theme applied.
              </p>
            </div>
            <div class="card-footer">
              <button class="btn btn-primary btn-sm">Action</button>
            </div>
          </div>

          <div class="card card-elevated">
            <div class="card-header">
              <h3 class="card-title">Elevated Card</h3>
            </div>
            <div class="card-body">
              <p class="card-text">
                This card has additional elevation with shadow effects.
              </p>
            </div>
            <div class="card-footer">
              <button class="btn btn-secondary btn-sm">Action</button>
            </div>
          </div>

          <div class="card card-primary">
            <div class="card-header card-header-primary">
              <h3 class="card-title card-title-primary">Primary Card</h3>
            </div>
            <div class="card-body">
              <p class="card-text">
                This card uses primary theme colors.
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- Navigation Section -->
      <section class="preview-section">
        <h2 class="section-title">Navigation</h2>
        <div class="nav-container">
          <!-- Top Navigation -->
          <nav class="top-nav">
            <div class="nav-brand">
              <div class="nav-logo" />
              <span class="nav-title">NCE Studio</span>
            </div>
            <div class="nav-links">
              <a href="#" class="nav-link active">Dashboard</a>
              <a href="#" class="nav-link">Forms</a>
              <a href="#" class="nav-link">Reports</a>
              <a href="#" class="nav-link">Settings</a>
            </div>
            <div class="nav-actions">
              <button class="btn-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M19.1 18h-2.2a7 7 0 00-13.8-2.6" />
                </svg>
              </button>
              <button class="btn-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M12 22a5 5 0 100-10 5 5 0 000 10z" />
                  <path d="M13 13h6l4 4" />
                </svg>
              </button>
              <div class="user-avatar">
                <div class="avatar-circle">JD</div>
              </div>
            </div>
          </nav>

          <!-- Tabs Navigation -->
          <nav class="tabs-nav">
            <a href="#" class="tab-link active">Overview</a>
            <a href="#" class="tab-link">Details</a>
            <a href="#" class="tab-link">History</a>
            <a href="#" class="tab-link">Settings</a>
          </nav>

          <!-- Sidebar -->
          <nav class="sidebar-nav">
            <a href="#" class="sidebar-link active">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              </svg>
              Dashboard
            </a>
            <a href="#" class="sidebar-link">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <line x1="3" y1="9" x2="21" y2="9" />
                <line x1="9" y1="21" x2="9" y2="9" />
              </svg>
              Forms
            </a>
            <a href="#" class="sidebar-link">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
              Reports
            </a>
            <a href="#" class="sidebar-link">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
              </svg>
              Settings
            </a>
          </nav>
        </div>
      </section>

      <!-- Typography Section -->
      <section class="preview-section">
        <h2 class="section-title">Typography</h2>
        <div class="typography-preview">
          <div class="typography-group">
            <h1 class="ty-h1">Heading 1</h1>
            <p class="ty-desc">The quick brown fox jumps over the lazy dog.</p>
          </div>

          <div class="typography-group">
            <h2 class="ty-h2">Heading 2</h2>
            <p class="ty-desc">The quick brown fox jumps over the lazy dog.</p>
          </div>

          <div class="typography-group">
            <h3 class="ty-h3">Heading 3</h3>
            <p class="ty-desc">The quick brown fox jumps over the lazy dog.</p>
          </div>

          <div class="typography-group">
            <h4 class="ty-h4">Heading 4</h4>
            <p class="ty-desc">The quick brown fox jumps over the lazy dog.</p>
          </div>

          <div class="typography-group">
            <h5 class="ty-h5">Heading 5</h5>
            <p class="ty-desc">The quick brown fox jumps over the lazy dog.</p>
          </div>

          <div class="typography-group">
            <h6 class="ty-h6">Heading 6</h6>
            <p class="ty-desc">The quick brown fox jumps over the lazy dog.</p>
          </div>

          <div class="typography-group">
            <p class="ty-body">Body text - The quick brown fox jumps over the lazy dog.</p>
            <p class="ty-muted">Muted text - The quick brown fox jumps over the lazy dog.</p>
          </div>

          <div class="typography-group">
            <p class="ty-code">const message = "Hello, World!";</p>
          </div>
        </div>
      </section>

      <!-- Alerts Section -->
      <section class="preview-section">
        <h2 class="section-title">Alerts</h2>
        <div class="alert-grid">
          <div class="alert alert-success">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <div class="alert-content">
              <h4 class="alert-title">Success Alert</h4>
              <p class="alert-text">This is a success message with a descriptive summary.</p>
            </div>
          </div>

          <div class="alert alert-warning">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <div class="alert-content">
              <h4 class="alert-title">Warning Alert</h4>
              <p class="alert-text">This is a warning message with important information.</p>
            </div>
          </div>

          <div class="alert alert-danger">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            <div class="alert-content">
              <h4 class="alert-title">Error Alert</h4>
              <p class="alert-text">This is an error message with instructions to fix.</p>
            </div>
          </div>

          <div class="alert alert-info">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <div class="alert-content">
              <h4 class="alert-title">Info Alert</h4>
              <p class="alert-text">This is an informational message for your reference.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Badges Section -->
      <section class="preview-section">
        <h2 class="section-title">Badges</h2>
        <div class="badge-group">
          <span class="badge badge-primary">Primary</span>
          <span class="badge badge-secondary">Secondary</span>
          <span class="badge badge-success">Success</span>
          <span class="badge badge-warning">Warning</span>
          <span class="badge badge-danger">Danger</span>
          <span class="badge badge-info">Info</span>
          <span class="badge badge-gray">Gray</span>
        </div>
      </section>

      <!-- Tables Section -->
      <section class="preview-section">
        <h2 class="section-title">Tables</h2>
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Status</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>001</td>
              <td>John Doe</td>
              <td>john@example.com</td>
              <td><span class="badge badge-success">Active</span></td>
              <td>$1,234.56</td>
            </tr>
            <tr>
              <td>002</td>
              <td>Jane Smith</td>
              <td>jane@example.com</td>
              <td><span class="badge badge-warning">Pending</span></td>
              <td>$2,345.67</td>
            </tr>
            <tr>
              <td>003</td>
              <td>Bob Johnson</td>
              <td>bob@example.com</td>
              <td><span class="badge badge-danger">Inactive</span></td>
              <td>$3,456.78</td>
            </tr>
          </tbody>
        </table>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue"

const isDarkMode = ref(false)

function toggleMode(): void {
  isDarkMode.value = !isDarkMode.value
}

function backToEditor(): void {
  // Navigate back to theme editor
  window.location.href = "/theme"
}
</script>

<style scoped>
/* Light/Dark mode variables will be applied via CSS variables */
.theme-preview-page {
  font-family: var(--nce-font-family, Inter, -apple-system, BlinkMacSystemFont, sans-serif);
  background: var(--nce-background, #ffffff);
  color: var(--nce-text, #1f2937);
  transition: background 0.3s, color 0.3s;
}

/* Page Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--nce-border, #e5e7eb);
  background: var(--nce-surface, #ffffff);
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--nce-text, #1f2937);
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.mode-toggle {
  padding: 6px 12px;
  border: 1px solid var(--nce-border, #e5e7eb);
  border-radius: 6px;
  background: transparent;
  cursor: pointer;
  font-size: 13px;
  color: var(--nce-text, #1f2937);
}

.mode-toggle.mode-dark {
  color: #fbbf24;
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
  background: var(--nce-primary-500, #3b82f6);
  color: white;
  border: none;
}

.action-btn.primary:hover {
  background: var(--nce-primary-600, #2563eb);
}

/* Preview Content */
.preview-content {
  padding: 24px;
}

/* Section Styles */
.preview-section {
  margin-bottom: 40px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--nce-text, #1f2937);
  margin: 0 0 20px 0;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--nce-border, #e5e7eb);
}

/* Button Grid */
.button-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.btn {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-primary {
  background: var(--nce-primary-500, #3b82f6);
  color: white;
}

.btn-primary:hover {
  background: var(--nce-primary-600, #2563eb);
}

.btn-secondary {
  background: var(--nce-secondary-500, #6b7280);
  color: white;
}

.btn-secondary:hover {
  background: var(--nce-secondary-600, #4b5563);
}

.btn-danger {
  background: var(--nce-danger-500, #ef4444);
  color: white;
}

.btn-danger:hover {
  background: var(--nce-danger-600, #dc2626);
}

.btn-success {
  background: var(--nce-success-500, #10b981);
  color: white;
}

.btn-success:hover {
  background: var(--nce-success-600, #059669);
}

.btn-warning {
  background: var(--nce-warning-500, #f59e0b);
  color: white;
}

.btn-warning:hover {
  background: var(--nce-warning-600, #d97706);
}

.btn-info {
  background: var(--nce-info-500, #3b82f6);
  color: white;
}

.btn-info:hover {
  background: var(--nce-info-600, #2563eb);
}

.btn-link {
  background: transparent;
  color: var(--nce-link, #3b82f6);
}

.btn-link:hover {
  text-decoration: underline;
}

.btn-text {
  background: transparent;
  color: var(--nce-text, #1f2937);
}

.btn-text:hover {
  background: var(--nce-border, #e5e7eb);
}

.btn-sm {
  padding: 4px 8px;
  font-size: 12px;
}

/* Input Form */
.input-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--nce-text-muted, #6b7280);
}

.form-input,
.form-select,
.form-textarea {
  padding: 8px 12px;
  border: 1px solid var(--nce-border, #e5e7eb);
  border-radius: 6px;
  font-size: 13px;
  background: var(--nce-surface, #ffffff);
  color: var(--nce-text, #1f2937);
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  outline: 2px solid var(--nce-focus-ring, #3b82f6);
  outline-offset: 2px;
}

.form-textarea {
  min-height: 80px;
  resize: vertical;
}

.checkbox-label,
.radio-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.form-checkbox,
.form-radio {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.radio-group {
  display: flex;
  gap: 16px;
}

/* Card Grid */
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
}

.card {
  padding: 16px;
  background: var(--nce-surface, #ffffff);
  border: 1px solid var(--nce-border, #e5e7eb);
  border-radius: 8px;
  transition: all 0.2s;
}

.card:hover {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.card-elevated {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.card-primary {
  background: var(--nce-primary-50, #eff6ff);
  border-color: var(--nce-primary-200, #bfdbfe);
}

.card-header {
  padding-bottom: 12px;
  margin-bottom: 12px;
  border-bottom: 1px solid var(--nce-border, #e5e7eb);
}

.card-header-primary {
  background: var(--nce-primary-100, #dbeafe);
  padding: 12px;
  border-radius: 6px;
  margin: -16px -16px 12px -16px;
}

.card-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--nce-text, #1f2937);
}

.card-title-primary {
  color: var(--nce-primary-700, #1d4ed8);
}

.card-body {
  padding: 12px 0;
}

.card-text {
  font-size: 13px;
  color: var(--nce-text-muted, #6b7280);
  margin: 0;
}

.card-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 12px;
}

/* Navigation */
.nav-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.top-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--nce-surface, #ffffff);
  border: 1px solid var(--nce-border, #e5e7eb);
  border-radius: 8px;
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: 8px;
}

.nav-logo {
  width: 24px;
  height: 24px;
  background: var(--nce-primary-500, #3b82f6);
  border-radius: 6px;
}

.nav-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--nce-text, #1f2937);
}

.nav-links {
  display: flex;
  gap: 4px;
}

.nav-link {
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 13px;
  color: var(--nce-text-muted, #6b7280);
  text-decoration: none;
}

.nav-link:hover {
  background: var(--nce-border, #e5e7eb);
  color: var(--nce-text, #1f2937);
}

.nav-link.active {
  background: var(--nce-primary-50, #eff6ff);
  color: var(--nce-primary-700, #1d4ed8);
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-icon {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--nce-text-muted, #6b7280);
}

.btn-icon svg {
  width: 16px;
  height: 16px;
}

.btn-icon:hover {
  background: var(--nce-border, #e5e7eb);
  color: var(--nce-text, #1f2937);
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--nce-primary-500, #3b82f6);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 500;
}

.tabs-nav {
  display: flex;
  gap: 4px;
  border-bottom: 1px solid var(--nce-border, #e5e7eb);
}

.tab-link {
  padding: 8px 16px;
  border: none;
  background: transparent;
  border-bottom: 2px solid transparent;
  color: var(--nce-text-muted, #6b7280);
  text-decoration: none;
  cursor: pointer;
}

.tab-link:hover {
  color: var(--nce-text, #1f2937);
}

.tab-link.active {
  color: var(--nce-primary-700, #1d4ed8);
  border-bottom-color: var(--nce-primary-500, #3b82f6);
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 16px;
  background: var(--nce-surface, #ffffff);
  border: 1px solid var(--nce-border, #e5e7eb);
  border-radius: 8px;
}

.sidebar-link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 13px;
  color: var(--nce-text-muted, #6b7280);
  text-decoration: none;
}

.sidebar-link:hover {
  background: var(--nce-border, #e5e7eb);
  color: var(--nce-text, #1f2937);
}

.sidebar-link.active {
  background: var(--nce-primary-50, #eff6ff);
  color: var(--nce-primary-700, #1d4ed8);
}

.sidebar-link svg {
  width: 16px;
  height: 16px;
}

/* Typography Preview */
.typography-preview {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.typography-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ty-h1 {
  font-size: 32px;
  font-weight: 700;
  color: var(--nce-text, #1f2937);
  margin: 0;
}

.ty-h2 {
  font-size: 24px;
  font-weight: 600;
  color: var(--nce-text, #1f2937);
  margin: 0;
}

.ty-h3 {
  font-size: 20px;
  font-weight: 600;
  color: var(--nce-text, #1f2937);
  margin: 0;
}

.ty-h4 {
  font-size: 16px;
  font-weight: 600;
  color: var(--nce-text, #1f2937);
  margin: 0;
}

.ty-h5 {
  font-size: 14px;
  font-weight: 600;
  color: var(--nce-text, #1f2937);
  margin: 0;
}

.ty-h6 {
  font-size: 12px;
  font-weight: 600;
  color: var(--nce-text, #1f2937);
  margin: 0;
}

.ty-body {
  font-size: 14px;
  color: var(--nce-text, #1f2937);
  margin: 0;
}

.ty-muted {
  font-size: 13px;
  color: var(--nce-text-muted, #6b7280);
  margin: 0;
}

.ty-code {
  font-family: monospace;
  font-size: 13px;
  background: var(--nce-border, #e5e7eb);
  padding: 8px 12px;
  border-radius: 6px;
  color: var(--nce-text, #1f2937);
  margin: 0;
}

/* Alert Grid */
.alert-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
}

.alert {
  display: flex;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
}

.alert-success {
  background: var(--nce-success-50, #f0fdf4);
  border: 1px solid var(--nce-success-200, #a7f3d0);
  color: var(--nce-success-800, #064e3b);
}

.alert-warning {
  background: var(--nce-warning-50, #fffbeb);
  border: 1px solid var(--nce-warning-200, #fde68a);
  color: var(--nce-warning-800, #78350f);
}

.alert-danger {
  background: var(--nce-danger-50, #fef2f2);
  border: 1px solid var(--nce-danger-200, #fecaca);
  color: var(--nce-danger-800, #7f1d1d);
}

.alert-info {
  background: var(--nce-info-50, #eff6ff);
  border: 1px solid var(--nce-info-200, #bfdbfe);
  color: var(--nce-info-800, #1e3a8a);
}

.alert svg {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.alert-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.alert-title {
  font-size: 14px;
  font-weight: 600;
  margin: 0;
}

.alert-text {
  font-size: 13px;
  margin: 0;
}

/* Badge Group */
.badge-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.badge {
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 500;
}

.badge-primary {
  background: var(--nce-primary-100, #dbeafe);
  color: var(--nce-primary-700, #1d4ed8);
}

.badge-secondary {
  background: var(--nce-secondary-100, #e5e7eb);
  color: var(--nce-secondary-700, #4b5563);
}

.badge-success {
  background: var(--nce-success-100, #d1fae5);
  color: var(--nce-success-700, #059669);
}

.badge-warning {
  background: var(--nce-warning-100, #fef3c7);
  color: var(--nce-warning-700, #d97706);
}

.badge-danger {
  background: var(--nce-danger-100, #fee2e2);
  color: var(--nce-danger-700, #dc2626);
}

.badge-info {
  background: var(--nce-info-100, #eff6ff);
  color: var(--nce-info-700, #2563eb);
}

.badge-gray {
  background: var(--nce-gray-100, #f3f4f6);
  color: var(--nce-gray-700, #374151);
}

/* Data Table */
.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.data-table th {
  text-align: left;
  padding: 10px 12px;
  font-weight: 600;
  color: var(--nce-text-muted, #6b7280);
  border-bottom: 1px solid var(--nce-border, #e5e7eb);
}

.data-table td {
  padding: 10px 12px;
  border-bottom: 1px solid var(--nce-border, #e5e7eb);
  color: var(--nce-text, #1f2937);
}

.data-table tr:last-child td {
  border-bottom: none;
}

.data-table tbody tr:hover td {
  background: var(--nce-border, #f3f4f6);
}
</style>
