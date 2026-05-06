/**
 * Simple localStorage-based offline queue for failed API requests.
 * Stores POST/PATCH requests and replays them when the device comes back online.
 */

const QUEUE_KEY = 'teilenix-offline-queue'

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

  let succeeded = 0
  let failed = 0
  const remaining: QueuedRequest[] = []

  for (const req of queue) {
    try {
      const res = await fetch(req.endpoint, {
        method: req.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body),
      })
      if (res.ok) {
        succeeded++
      } else {
        // Server error — keep in queue for now, will retry later
        remaining.push(req)
        failed++
      }
    } catch {
      // Network still unavailable
      remaining.push(req)
      failed++
    }
  }

  saveQueue(remaining)
  _processing = false
  return { succeeded, failed }
}

/** Prevent concurrent processQueue calls (race between ExpenseForm + OfflineIndicator) */
let _processing = false

/** Register a one-time online event listener to drain the queue */
export function registerOnlineQueueProcessor(
  onSuccess?: (count: number) => void
) {
  if (typeof window === 'undefined') return

  const handler = async () => {
    const { succeeded } = await processQueue()
    if (succeeded > 0) onSuccess?.(succeeded)
  }

  window.addEventListener('online', handler, { once: true })
}
