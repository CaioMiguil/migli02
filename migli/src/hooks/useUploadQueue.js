import { useEffect, useMemo, useState } from 'react'
import { UploadQueue } from '@lib/upload/uploadQueue'
import { simulatorAdapter } from '@lib/upload/simulatorAdapter'
import { r2Adapter } from '@lib/cloud/r2Adapter'
import { isCloudConfigured } from '@lib/cloud/config'

// Singleton queue — survives navigation, lives in module scope.
// Em produção (com cloud configurado), usa r2Adapter — caso contrário,
// usa simulatorAdapter para desenvolvimento local.
let _queue = null
function getQueue() {
  if (!_queue) {
    const adapter = isCloudConfigured() ? r2Adapter : simulatorAdapter
    _queue = new UploadQueue({ adapter, concurrency: 2 })
  }
  return _queue
}

/**
 * useUploadQueue — React-friendly view of the global upload queue.
 *
 * Returns:
 *   items     reactive array of UploadItem snapshots
 *   enqueue(files, meta?)
 *   cancel(id)
 *   remove(id)
 *   clear()
 */
export function useUploadQueue() {
  const queue = useMemo(() => getQueue(), [])
  const [items, setItems] = useState([])

  useEffect(() => {
    return queue.subscribe(setItems)
  }, [queue])

  return {
    items,
    enqueue: (files, meta) => queue.enqueue(files, meta),
    cancel: (id) => queue.cancel(id),
    remove: (id) => queue.remove(id),
    clear: () => queue.clear(),
  }
}
