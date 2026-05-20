import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'

const RECENT_KEY = 'filetools-recent-tools'
const MAX_RECENT = 8

interface RecentContextType {
  recent: string[]
  addRecent: (path: string) => void
}

const RecentCtx = createContext<RecentContextType>({ recent: [], addRecent: () => {} })

export function RecentProvider({ children }: { children: ReactNode }) {
  const [recent, setRecent] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(RECENT_KEY)
      return stored ? JSON.parse(stored) : []
    } catch { return [] }
  })

  useEffect(() => {
    localStorage.setItem(RECENT_KEY, JSON.stringify(recent))
  }, [recent])

  const addRecent = useCallback((path: string) => {
    setRecent((prev) => {
      const filtered = prev.filter((p) => p !== path)
      return [path, ...filtered].slice(0, MAX_RECENT)
    })
  }, [])

  return (
    <RecentCtx.Provider value={{ recent, addRecent }}>
      {children}
    </RecentCtx.Provider>
  )
}

export const useRecent = () => useContext(RecentCtx)
