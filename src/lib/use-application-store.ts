"use client"

import { useCallback, useMemo, useSyncExternalStore } from "react"

import {
  defaultRecord,
  type ApplicationRecord,
  type FlagId,
  type StatusId,
} from "@/data/status"

const STORAGE_KEY = "icywang-2027-campus-tracker"
const EMPTY: Record<string, ApplicationRecord> = {}

type Store = Record<string, ApplicationRecord>

let memory: Store = EMPTY
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((listener) => listener())
}

function readStore(): Store {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return EMPTY
    const parsed = JSON.parse(raw) as Store
    return parsed && typeof parsed === "object" ? parsed : EMPTY
  } catch {
    return EMPTY
  }
}

function writeStore(store: Store) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

if (typeof window !== "undefined") {
  memory = readStore()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot() {
  return memory
}

function getServerSnapshot() {
  return EMPTY
}

function persist(next: Store) {
  memory = next
  writeStore(next)
  emit()
}

export function useApplicationStore() {
  const store = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const get = useCallback(
    (jobId: string): ApplicationRecord => store[jobId] ?? defaultRecord(),
    [store]
  )

  const setStatus = useCallback(
    (jobId: string, status: StatusId) => {
      const current = memory[jobId] ?? defaultRecord()
      persist({
        ...memory,
        [jobId]: { ...current, status, updatedAt: new Date().toISOString() },
      })
    },
    []
  )

  const toggleFlag = useCallback((jobId: string, flag: FlagId) => {
    const current = memory[jobId] ?? defaultRecord()
    const flags = current.flags.includes(flag)
      ? current.flags.filter((item) => item !== flag)
      : [...current.flags, flag]
    persist({
      ...memory,
      [jobId]: { ...current, flags, updatedAt: new Date().toISOString() },
    })
  }, [])

  const setNote = useCallback((jobId: string, note: string) => {
    const current = memory[jobId] ?? defaultRecord()
    persist({
      ...memory,
      [jobId]: { ...current, note, updatedAt: new Date().toISOString() },
    })
  }, [])

  const resetAll = useCallback(() => {
    memory = EMPTY
    window.localStorage.removeItem(STORAGE_KEY)
    emit()
  }, [])

  const exportJson = useCallback(() => {
    const blob = new Blob([JSON.stringify(memory, null, 2)], {
      type: "application/json",
    })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = "2027-campus-tracker.json"
    anchor.click()
    URL.revokeObjectURL(url)
  }, [])

  const importJson = useCallback((file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as Store
        if (!parsed || typeof parsed !== "object") return
        persist(parsed)
      } catch {
        // ignore malformed files
      }
    }
    reader.readAsText(file)
  }, [])

  const counts = useMemo(() => {
    const all = Object.values(store)
    return {
      applied: all.filter((item) => item.status === "applied").length,
      inProcess: all.filter((item) =>
        ["applied", "assessment", "written", "interview", "waiting"].includes(
          item.status
        )
      ).length,
      offer: all.filter((item) => item.status === "offer").length,
      closed: all.filter((item) =>
        ["rejected", "dropped"].includes(item.status)
      ).length,
    }
  }, [store])

  return {
    hydrated: store !== EMPTY || Object.keys(store).length === 0,
    store,
    get,
    setStatus,
    toggleFlag,
    setNote,
    resetAll,
    exportJson,
    importJson,
    counts,
  }
}
