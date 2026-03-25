import { ref } from "vue"
import { defineStore } from "pinia"
import type { EditLock } from "@nce/types"
import {
  checkEditLock,
  acquireEditLock,
  releaseEditLock,
} from "@nce/utils/dataPipeline"

export const useNceEditLockStore = defineStore("nceEditLock", () => {
  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  const currentLock = ref<EditLock>({ locked: false })
  const autoRefreshTimer = ref<ReturnType<typeof setInterval> | null>(null)

  // ---------------------------------------------------------------------------
  // Methods
  // ---------------------------------------------------------------------------

  /**
   * Check if a record is currently locked.
   */
  async function check(doctype: string, docname: string): Promise<EditLock> {
    const result = await checkEditLock(doctype, docname)
    currentLock.value = result
    return result
  }

  /**
   * Acquire an edit lock for the current user.
   */
  async function acquire(
    doctype: string,
    docname: string,
    durationMinutes = 15
  ): Promise<EditLock> {
    const result = await acquireEditLock(doctype, docname, durationMinutes)
    currentLock.value = result
    return result
  }

  /**
   * Release the current user's lock on a document.
   */
  async function release(doctype: string, docname: string): Promise<void> {
    await releaseEditLock(doctype, docname)
    currentLock.value = { locked: false }
  }

  /**
   * Start an interval that re-acquires the lock before it expires.
   * Default interval is 10 minutes (lock duration is typically 15 min).
   */
  function startAutoRefresh(
    doctype: string,
    docname: string,
    intervalMs = 10 * 60 * 1000
  ): void {
    stopAutoRefresh()
    autoRefreshTimer.value = setInterval(async () => {
      try {
        await acquire(doctype, docname)
      } catch {
        // Lock renewal failed — stop trying so we don't spam the server
        stopAutoRefresh()
      }
    }, intervalMs)
  }

  /**
   * Stop the auto-refresh interval.
   */
  function stopAutoRefresh(): void {
    if (autoRefreshTimer.value !== null) {
      clearInterval(autoRefreshTimer.value)
      autoRefreshTimer.value = null
    }
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  return {
    // state
    currentLock,
    autoRefreshTimer,

    // methods
    check,
    acquire,
    release,
    startAutoRefresh,
    stopAutoRefresh,
  }
})
