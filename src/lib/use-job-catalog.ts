"use client"

import { useCallback, useSyncExternalStore } from "react"

import { builtinJobs } from "@/data/jobs"
import { finalizeJob, type Job, type JobInput } from "@/data/job-model"

const STORAGE_KEY = "icywang-2027-user-jobs-v1"

type CatalogState = {
  userJobs: JobInput[]
  hiddenIds: string[]
}

const EMPTY: CatalogState = { userJobs: [], hiddenIds: [] }

let memory: CatalogState = EMPTY
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((listener) => listener())
}

function readState(): CatalogState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return EMPTY
    const parsed = JSON.parse(raw) as CatalogState
    if (!parsed || typeof parsed !== "object") return EMPTY
    return {
      userJobs: Array.isArray(parsed.userJobs) ? parsed.userJobs : [],
      hiddenIds: Array.isArray(parsed.hiddenIds) ? parsed.hiddenIds : [],
    }
  } catch {
    return EMPTY
  }
}

function writeState(state: CatalogState) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

if (typeof window !== "undefined") {
  memory = readState()
}

function persist(next: CatalogState) {
  memory = next
  writeState(next)
  emit()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function mergeJobs(state: CatalogState): Job[] {
  const hidden = new Set(state.hiddenIds)
  const overrides = new Map(state.userJobs.map((job) => [job.id, job]))
  const merged: Job[] = []
  for (const job of builtinJobs) {
    if (hidden.has(job.id)) continue
    const override = overrides.get(job.id)
    merged.push(override ? finalizeJob(override) : job)
  }
  for (const job of state.userJobs) {
    if (hidden.has(job.id)) continue
    if (builtinJobs.some((item) => item.id === job.id)) continue
    merged.push(finalizeJob(job))
  }
  return merged
}

export function newUserJobId() {
  return `user-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
}

export function isCustomJob(job: Pick<Job, "id" | "custom">) {
  return job.custom === true || job.id.startsWith("user-")
}

export function useJobCatalog() {
  const state = useSyncExternalStore(subscribe, () => memory, () => EMPTY)
  const jobs = mergeJobs(state)

  const upsert = useCallback((input: JobInput) => {
    const next = [...memory.userJobs]
    const index = next.findIndex((job) => job.id === input.id)
    const record = { ...input, custom: true }
    if (index >= 0) next[index] = record
    else next.unshift(record)
    persist({ ...memory, userJobs: next })
  }, [])

  const remove = useCallback((id: string) => {
    const isBuiltin = builtinJobs.some((job) => job.id === id)
    persist({
      userJobs: memory.userJobs.filter((job) => job.id !== id),
      hiddenIds: isBuiltin
        ? Array.from(new Set([...memory.hiddenIds, id]))
        : memory.hiddenIds.filter((item) => item !== id),
    })
  }, [])

  const restoreBuiltin = useCallback(() => {
    persist({
      userJobs: memory.userJobs.filter((job) => job.custom || job.id.startsWith("user-")),
      hiddenIds: [],
    })
  }, [])

  const importBackup = useCallback((payload: Partial<CatalogState>) => {
    persist({
      userJobs: Array.isArray(payload.userJobs) ? payload.userJobs : memory.userJobs,
      hiddenIds: Array.isArray(payload.hiddenIds) ? payload.hiddenIds : memory.hiddenIds,
    })
  }, [])

  return {
    jobs,
    userJobs: state.userJobs,
    hiddenIds: state.hiddenIds,
    upsert,
    remove,
    restoreBuiltin,
    importBackup,
  }
}
