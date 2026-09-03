"use client"

import { useCallback, useMemo, useSyncExternalStore } from "react"

import { builtinJobs } from "@/data/jobs"
import {
  ACTIVE_STATUSES,
  defaultRecord,
  type ApplicationRecord,
  type FlagId,
  type StatusId,
} from "@/data/status"

const STORAGE_KEY = "icywang-2027-campus-tracker-v2"
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

function isRecord(value: unknown): value is ApplicationRecord {
  return !!value && typeof value === "object" && "status" in value
}

function knownJobsOnly(store: Store): Store {
  const cleaned: Store = {}
  for (const [id, rec] of Object.entries(store)) {
    if (!isRecord(rec)) continue
    cleaned[id] = rec
  }
  return cleaned
}

function writeStore(store: Store) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(knownJobsOnly(store)))
}

function withSeeds(stored: Store): Store {
  const next: Store = { ...stored }
  for (const job of builtinJobs) {
    if (!job.seed) continue
    const current = next[job.id]
    if (!current || current.status === "todo") {
      next[job.id] = {
        status: job.seed.status,
        flags: job.seed.flags ?? [],
        note: job.seed.note ?? "",
        updatedAt: new Date().toISOString(),
      }
    }
  }
  return Object.keys(next).length ? next : EMPTY
}

if (typeof window !== "undefined") {
  memory = withSeeds(readStore())
  if (memory !== EMPTY) writeStore(memory)
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

  const removeRecord = useCallback((jobId: string) => {
    const next = { ...memory }
    delete next[jobId]
    persist(Object.keys(next).length ? next : EMPTY)
  }, [])

  const resetAll = useCallback(() => {
    const seeded = withSeeds({})
    memory = seeded
    writeStore(seeded)
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
        const parsed = JSON.parse(String(reader.result)) as Store & {
          progress?: Store
        }
        const source = parsed.progress ?? parsed
        if (!source || typeof source !== "object") return
        persist(knownJobsOnly(source))
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
        ACTIVE_STATUSES.includes(item.status)
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
    removeRecord,
    resetAll,
    exportJson,
    importJson,
    counts,
  }
}
