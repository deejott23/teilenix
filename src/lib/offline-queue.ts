/**
 * Simple localStorage-based offline queue for failed API requests.
 * Stores POST/PATCH requests and replays them when the device comes back online.
 */

const QUEUE_KEY = 'sharepa-offline-queue'

export interface QueuedRequest {
  id: string
  endpoint: string
  method: 'POST' | 'PATCH' | 'DELETE'
  body: Record<string, unknown>
  queuedAt: string
}

function loadQueue(): QueuedRequest[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY)
    return raw ? (JSON.parse(raw) as QueuedRequest[]) : []
  } catch {
    return []
  }
}

function saveQueue(queue: QueuedRequest[]) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
}

export function enqueueRequest(
  endpoint: string,
  body: Record<string, unknown>,
  method: QueuedRequest['method'] = 'POST'
): QueuedRequest {
  const entry: QueuedRequest = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    endpoint,
    method,
    body,
    queuedAt: new Date().toISOString(),
  }
  const queue = loadQueue()
  queue.push(entry)
  saveQueue(queue)
  return entry
}

export function getQueueLength(): number {
  return loadQueue().length
}

export async function processQueue(): Promise<{ succeeded: number; failed: number }> {
  if (_processing) return { succeeded: 0, failed: 0 }
  _processing = true
  const queue = loadQueue()
  if (queue.length === 0) { _processing = false; return { succeeded: 0, failed: 0 } }

  const succeededIds = new Set<string>()

  for (const req of queue) {
    try {
      const res = await fetch(req.endpoint, {
        method: req.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body),
      })
      if (res.ok) {
        succeededIds.add(req.id)
      }
      // Server error / non-ok: keep in queue for retry (do not mark succeeded)
    } catch {
      // Network still unavailable — keep in queue
    }
  }

  // Re-read the queue so requests enqueued DURING processing are preserved.
  // Only remove the ones we successfully sent.
  const current = loadQueue()
  const remaining = current.filter(r => !succeededIds.has(r.id))
  saveQueue(remaining)

  _processing = false
  const succeeded = succeededIds.size
  return { succeeded, failed: queue.length - succeeded }
}

/** Prevent concurrent processQueue calls (race between ExpenseForm + OfflineIndicator) */
let _processing = false

let _listenerRegistered = false
let _onSuccess: ((count: number) => void) | undefined

/**
 * Register a persistent online event listener that drains the queue every time
 * the device comes back online. Safe to call multiple times — only one listener
 * is ever attached; the latest onSuccess callback is used.
 */
export function registerOnlineQueueProcessor(
  onSuccess?: (count: number) => void
) {
  if (typeof window === 'undefined') return

  _onSuccess = onSuccess
  if (_listenerRegistered) return
  _listenerRegistered = true

  window.addEventListener('online', async () => {
    const { succeeded } = await processQueue()
    if (succeeded > 0) _onSuccess?.(succeeded)
  })
}
