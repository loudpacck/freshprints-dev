import { useState, useEffect, useCallback, useRef } from 'react'

export function usePolling(fetchFn, interval = 30000, trigger = 0) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const fetchRef = useRef(fetchFn)
  fetchRef.current = fetchFn

  const refresh = useCallback(async () => {
    try {
      const result = await fetchRef.current()
      setData(result)
      setError(null)
      setLastUpdated(new Date())
    } catch (err) {
      setError(err.message || 'Fetch failed')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
    const id = setInterval(refresh, interval)
    return () => clearInterval(id)
  }, [refresh, interval, trigger])

  return { data, loading, error, lastUpdated, refresh }
}
