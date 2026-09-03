"use client"

import { useMemo, useRef, useState } from "react"
import {
  ChevronDown,
  ChevronRight,
  ClipboardCopy,
  Download,
  Filter,
  Plus,
  RotateCcw,
  Search,
  Upload,
} from "lucide-react"

import { JobForm } from "@/components/job-form"
import { JobDetailPanel, statusLabel, statusTone } from "@/components/job-detail-panel"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { profile } from "@/data/profile"
import {
  DIRECTIONS,
  INDUSTRIES,
  inferCompanyGroup,
  isPendingDetails,
  isUrgent,
  matchStars,
  type Direction,
  type Industry,
  type Job,
  type JobInput,
} from "@/data/jobs"
import {
  ACTIVE_STATUSES,
  STATUSES,
  type ApplicationRecord,
  type StatusId,
} from "@/data/status"
import { useApplicationStore } from "@/lib/use-application-store"
import {
  newUserJobId,
  useJobCatalog,
} from "@/lib/use-job-catalog"
import { cn } from "@/lib/utils"

type StatusFilter = StatusId | "all" | "active" | "prep"

type CompanyGroup = {
  name: string
  jobs: Job[]
  maxScore: number
  activeCount: number
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <label className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-card px-2 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <select
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="max-w-36 bg-transparent font-medium outline-none"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string
  value: number
  hint: string
}) {
  return (
    <div className="rounded-2xl border border-border bg-card px-4 py-3">
      <p className="text-xs tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      <p className="font-heading mt-1 text-3xl tabular-nums">{value}</p>
      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
  )
}

export function JobBoard() {
  const store = useApplicationStore()
  const catalog = useJobCatalog()
  const jobs = catalog.jobs
  const companies = useMemo(
    () =>
      Array.from(new Set(jobs.map((job) => job.companyGroup))).sort((a, b) =>
        a.localeCompare(b, "zh")
      ),
    [jobs]
  )
  const locations = useMemo(
    () =>
      Array.from(new Set(jobs.flatMap((job) => job.locations))).sort((a, b) =>
        a.localeCompare(b, "zh")
      ),
    [jobs]
  )
  const fileRef = useRef<HTMLInputElement>(null)
  const detailRef = useRef<HTMLElement>(null)
  const [query, setQuery] = useState("")
  const [company, setCompany] = useState("all")
  const [industry, setIndustry] = useState<Industry | "all">("all")
  const [location, setLocation] = useState("all")
  const [direction, setDirection] = useState<Direction | "all">("all")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [matchFloor, setMatchFloor] = useState<"all" | "90" | "80" | "70">("all")
  const [onlyDirect, setOnlyDirect] = useState(false)
  const [onlyPriority, setOnlyPriority] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [copied, setCopied] = useState(false)
  const [formMode, setFormMode] = useState<"closed" | "create" | "edit">("closed")
  const [formId, setFormId] = useState(newUserJobId())

  const filtered = useMemo(() => {
    const rank = (job: Job) => {
      const status = store.get(job.id).status
      if (ACTIVE_STATUSES.includes(status) || status === "offer") return 0
      if (job.seed) return 1
      if (job.matchScore >= 88) return 2
      return 3
    }
    return jobs
      .filter((job) => {
        const record = store.get(job.id)
        const haystack = [
          job.company,
          job.companyGroup,
          job.role,
          job.industry,
          ...job.locations,
          ...job.tags,
          ...job.matchReasons,
        ]
          .join(" ")
          .toLowerCase()
        if (query && !haystack.includes(query.trim().toLowerCase())) return false
        if (company !== "all" && job.companyGroup !== company) return false
        if (industry !== "all" && job.industry !== industry) return false
        if (location !== "all" && !job.locations.includes(location)) return false
        if (direction !== "all" && !job.tags.includes(direction)) return false
        if (statusFilter === "active" && !ACTIVE_STATUSES.includes(record.status))
          return false
        if (statusFilter === "prep" && !["todo", "viewed", "ready"].includes(record.status))
          return false
        if (
          statusFilter !== "all" &&
          statusFilter !== "active" &&
          statusFilter !== "prep" &&
          record.status !== statusFilter
        )
          return false
        if (
          matchFloor !== "all" &&
          !isPendingDetails(job) &&
          job.matchScore < Number(matchFloor)
        )
          return false
        if (onlyDirect && job.applyKind !== "direct") return false
        if (onlyPriority && !record.flags.includes("priority")) return false
        return true
      })
      .sort((a, b) => {
        const diff = rank(a) - rank(b)
        if (diff !== 0) return diff
        if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore
        return a.company.localeCompare(b.company, "zh")
      })
  }, [
    company,
    direction,
    industry,
    jobs,
    location,
    matchFloor,
    onlyDirect,
    onlyPriority,
    query,
    statusFilter,
    store,
  ])

  const groups = useMemo<CompanyGroup[]>(() => {
    const map = new Map<string, Job[]>()
    for (const job of filtered) {
      const list = map.get(job.companyGroup) ?? []
      list.push(job)
      map.set(job.companyGroup, list)
    }
    return [...map.entries()]
      .map(([name, groupJobs]) => ({
        name,
        jobs: groupJobs,
        maxScore: Math.max(...groupJobs.map((job) => job.matchScore)),
        activeCount: groupJobs.filter((job) => {
          const status = store.get(job.id).status
          return ACTIVE_STATUSES.includes(status) || status === "offer"
        }).length,
      }))
      .sort((a, b) => {
        if (b.activeCount !== a.activeCount) return b.activeCount - a.activeCount
        if (b.maxScore !== a.maxScore) return b.maxScore - a.maxScore
        return a.name.localeCompare(b.name, "zh")
      })
  }, [filtered, store])

  const activeId =
    selectedId && filtered.some((job) => job.id === selectedId)
      ? selectedId
      : (filtered[0]?.id ?? null)
  const selected = filtered.find((job) => job.id === activeId) ?? null
  const selectedRecord = selected ? store.get(selected.id) : undefined
  const selectedGroup = selected?.companyGroup

  function isGroupOpen(name: string) {
    if (collapsed.has(name)) return false
    if (expanded.has(name)) return true
    const group = groups.find((item) => item.name === name)
    return name === selectedGroup || (group?.activeCount ?? 0) > 0
  }

  function toggleGroup(name: string) {
    if (isGroupOpen(name)) {
      setCollapsed((current) => new Set(current).add(name))
      setExpanded((current) => {
        const next = new Set(current)
        next.delete(name)
        return next
      })
    } else {
      setExpanded((current) => new Set(current).add(name))
      setCollapsed((current) => {
        const next = new Set(current)
        next.delete(name)
        return next
      })
    }
  }

  function openJob(id: string) {
    const job = jobs.find((item) => item.id === id)
    setSelectedId(id)
    if (job) {
      setExpanded((current) => new Set(current).add(job.companyGroup))
      setCollapsed((current) => {
        const next = new Set(current)
        next.delete(job.companyGroup)
        return next
      })
    }
    if (store.get(id).status === "todo") {
      store.setStatus(id, "viewed")
    }
    setFormMode("closed")
    window.setTimeout(() => {
      detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    }, 50)
  }

  function startCreate() {
    const id = newUserJobId()
    setFormId(id)
    setFormMode("create")
    window.setTimeout(() => {
      detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    }, 50)
  }

  function saveJob(input: JobInput) {
    catalog.upsert(input)
    setSelectedId(input.id)
    setFormMode("closed")
    setExpanded((current) => new Set(current).add(inferCompanyGroup(input.company)))
  }

  function deleteJob(id: string) {
    if (!window.confirm("从目录里拿掉这条？已投进度也会一起删。")) return
    catalog.remove(id)
    store.removeRecord(id)
    if (selectedId === id) setSelectedId(null)
    setFormMode("closed")
  }

  function copyJobList() {
    const text = jobs
      .map((job) => `- ${job.company}｜${job.role}｜${job.applyUrl}`)
      .join("\n")
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    })
  }

  function exportAll() {
    const payload = {
      savedAt: new Date().toISOString(),
      progress: store.store,
      userJobs: catalog.userJobs,
      hiddenIds: catalog.hiddenIds,
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = "2027-campus-tracker.json"
    anchor.click()
    URL.revokeObjectURL(url)
  }

  function importAll(file: File) {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as {
          progress?: Record<string, ApplicationRecord>
          userJobs?: JobInput[]
          hiddenIds?: string[]
        } & Record<string, unknown>
        if (parsed.userJobs || parsed.hiddenIds) {
          catalog.importBackup({
            userJobs: parsed.userJobs,
            hiddenIds: parsed.hiddenIds,
          })
        }
        store.importJson(file)
      } catch {
        store.importJson(file)
      }
    }
    reader.readAsText(file)
  }

  const readyCount = jobs.filter((job) =>
    ["todo", "viewed", "ready"].includes(store.get(job.id).status)
  ).length
  const inProcessCount = jobs.filter((job) =>
    ACTIVE_STATUSES.includes(store.get(job.id).status)
  ).length
  const offerCount = jobs.filter((job) => store.get(job.id).status === "offer").length

  return (
    <div className="min-h-full bg-background">
      <header className="border-b border-border/80 bg-paper">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="font-heading text-[11px] tracking-[0.28em] text-muted-foreground uppercase">
                2027 届求职台账 · {profile.englishName}
              </p>
              <h1 className="font-heading mt-2 text-3xl leading-tight sm:text-4xl">
                {profile.name}的投递管理
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                点「添加岗位」，把公司、岗位名和 JD 链接贴进来就能进目录。细则先空着也行；你把链接发我之后，我再按岗位补匹配度和改简历建议。已投的腾讯、灵犀、阿里国际、米哈游还留着。
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={startCreate}>
                <Plus />
                添加岗位
              </Button>
              <a
                href={profile.portfolio}
                target="_blank"
                rel="noreferrer"
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                个人主页
              </a>
              <Button variant="outline" size="sm" onClick={copyJobList}>
                <ClipboardCopy />
                {copied ? "已复制" : "复制岗位清单"}
              </Button>
              <Button variant="outline" size="sm" onClick={exportAll}>
                <Download />
                导出
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileRef.current?.click()}
              >
                <Upload />
                导入
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (window.confirm("进度会回到已投的几条，其他清空。确定？")) {
                    store.resetAll()
                  }
                }}
              >
                <RotateCcw />
                重置
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept="application/json"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (file) importAll(file)
                  event.target.value = ""
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard
              label="岗位池"
              value={jobs.length}
              hint={`${companies.length} 家公司 · ${filtered.length} 条在筛`}
            />
            <StatCard
              label="待处理"
              value={readyCount}
              hint="待查看 / 已查看 / 准备投递"
            />
            <StatCard
              label="进行中"
              value={inProcessCount}
              hint="已投到等结果"
            />
            <StatCard label="Offer" value={offerCount} hint="意向书也算" />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-5 sm:px-6 lg:px-8">
        <section className="mb-4 flex flex-col gap-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative grow">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="搜公司、岗位、方向、城市"
                className="h-8 w-full min-w-0 rounded-lg border border-input bg-transparent py-1 pr-2.5 pl-9 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <FilterSelect
                label="公司"
                value={company}
                onChange={setCompany}
                options={[
                  { value: "all", label: "全部公司" },
                  ...companies.map((item) => ({ value: item, label: item })),
                ]}
              />
              <FilterSelect
                label="地点"
                value={location}
                onChange={setLocation}
                options={[
                  { value: "all", label: "全部地点" },
                  ...locations.map((item) => ({ value: item, label: item })),
                ]}
              />
              <FilterSelect
                label="方向"
                value={direction}
                onChange={(value) => setDirection(value as Direction | "all")}
                options={[
                  { value: "all", label: "全部方向" },
                  ...DIRECTIONS.map((item) => ({ value: item, label: item })),
                ]}
              />
              <FilterSelect
                label="行业"
                value={industry}
                onChange={(value) => setIndustry(value as Industry | "all")}
                options={[
                  { value: "all", label: "全部行业" },
                  ...INDUSTRIES.map((item) => ({ value: item, label: item })),
                ]}
              />
              <FilterSelect
                label="状态"
                value={statusFilter}
                onChange={(value) => setStatusFilter(value as StatusFilter)}
                options={[
                  { value: "all", label: "全部状态" },
                  { value: "prep", label: "还没投" },
                  { value: "active", label: "进行中" },
                  ...STATUSES.map((item) => ({
                    value: item.id,
                    label: item.label,
                  })),
                ]}
              />
              <FilterSelect
                label="匹配"
                value={matchFloor}
                onChange={(value) =>
                  setMatchFloor(value as "all" | "90" | "80" | "70")
                }
                options={[
                  { value: "all", label: "全部匹配" },
                  { value: "90", label: "90%+" },
                  { value: "80", label: "80%+" },
                  { value: "70", label: "70%+" },
                ]}
              />
              <label className="inline-flex h-8 cursor-pointer items-center gap-2 rounded-lg border border-border bg-card px-2.5 text-xs">
                <input
                  type="checkbox"
                  className="size-3.5 accent-current"
                  checked={onlyDirect}
                  onChange={(event) => setOnlyDirect(event.target.checked)}
                />
                可直接投递
              </label>
              <label className="inline-flex h-8 cursor-pointer items-center gap-2 rounded-lg border border-border bg-card px-2.5 text-xs">
                <input
                  type="checkbox"
                  className="size-3.5 accent-current"
                  checked={onlyPriority}
                  onChange={(event) => setOnlyPriority(event.target.checked)}
                />
                只看优先冲
              </label>
            </div>
          </div>
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <Filter className="size-3.5" />
            {groups.length} 家公司 · {filtered.length} 个岗位
            {query ? ` · 含「${query}」` : ""}
          </p>
        </section>

        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)] xl:grid-cols-[minmax(0,28rem)_minmax(0,1fr)]">
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                我的岗位
              </p>
              <Button size="xs" variant="outline" onClick={startCreate}>
                <Plus />
                添加
              </Button>
            </div>
            {groups.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-muted-foreground">
                还没有符合筛选的岗位。点右上角「添加岗位」，把 JD 链接贴进来。
              </p>
            ) : (
              <ul>
                {groups.map((group) => {
                  const open = isGroupOpen(group.name)
                  return (
                    <li key={group.name} className="border-b border-border last:border-b-0">
                      <button
                        type="button"
                        onClick={() => toggleGroup(group.name)}
                        className="flex w-full items-center gap-2 px-4 py-3 text-left hover:bg-muted/40"
                      >
                        {open ? (
                          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                        )}
                        <span className="font-heading min-w-0 flex-1 truncate text-base">
                          {group.name}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {group.jobs.length} 岗
                        </span>
                        {group.jobs.every((job) => isPendingDetails(job)) ? (
                          <span className="text-[11px] text-muted-foreground">待补</span>
                        ) : (
                          <span className="font-heading text-xs tabular-nums">
                            {group.maxScore}%
                          </span>
                        )}
                        {group.activeCount > 0 ? (
                          <Badge variant="secondary">{group.activeCount} 进行中</Badge>
                        ) : null}
                      </button>
                      {open ? (
                        <ul className="border-t border-border bg-muted/20">
                          {group.jobs.map((job) => (
                            <JobRow
                              key={job.id}
                              job={job}
                              record={store.get(job.id)}
                              selected={job.id === activeId}
                              onSelect={() => openJob(job.id)}
                              onStatus={(status) => store.setStatus(job.id, status)}
                            />
                          ))}
                        </ul>
                      ) : null}
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          <section
            ref={detailRef}
            className="min-h-80 rounded-2xl border border-border bg-card p-4 sm:p-5 lg:sticky lg:top-4"
          >
            {formMode !== "closed" ? (
              <JobForm
                key={formId}
                jobId={formId}
                initial={formMode === "edit" ? jobs.find((job) => job.id === formId) : undefined}
                onSave={saveJob}
                onCancel={() => setFormMode("closed")}
              />
            ) : selected && selectedRecord ? (
              <JobDetailPanel
                job={selected}
                record={selectedRecord}
                onStatus={(status) => store.setStatus(selected.id, status)}
                onFlag={(flag) => store.toggleFlag(selected.id, flag)}
                onNote={(note) => store.setNote(selected.id, note)}
                onEdit={() => {
                  setFormId(selected.id)
                  setFormMode("edit")
                }}
                onDelete={() => deleteJob(selected.id)}
              />
            ) : (
              <p className="py-16 text-center text-sm text-muted-foreground">
                点「添加岗位」把 JD 链接贴进来。已投的四条在左边，新岗位会跟它们排在一起。
              </p>
            )}
          </section>
        </div>
      </main>
    </div>
  )
}

function JobRow({
  job,
  record,
  selected,
  onSelect,
  onStatus,
}: {
  job: Job
  record: ApplicationRecord
  selected: boolean
  onSelect: () => void
  onStatus: (status: StatusId) => void
}) {
  return (
    <li
      className={cn(
        "flex items-start gap-2 px-3 py-2.5 pl-9",
        selected && "bg-card"
      )}
    >
      <button type="button" onClick={onSelect} className="min-w-0 flex-1 text-left">
        <p className="truncate text-sm font-medium">{job.role}</p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {job.locations.slice(0, 3).join(" / ")}
          {job.locations.length > 3 ? " 等" : ""}
        </p>
        <p className="mt-1 flex flex-wrap gap-1">
          <span
            className={cn(
              "rounded-full border px-1.5 py-0.5 text-[10px]",
              statusTone(record.status)
            )}
          >
            {statusLabel(record.status)}
          </span>
          {isPendingDetails(job) ? (
            <span className="rounded-full border border-orange-200 bg-orange-50 px-1.5 py-0.5 text-[10px] text-orange-900">
              待补细则
            </span>
          ) : (
            <span className="rounded-full border border-border px-1.5 py-0.5 text-[10px] tabular-nums">
              {matchStars(job.matchScore)} {job.matchScore}%
            </span>
          )}
          {job.tags.includes("日本") ? (
            <span className="rounded-full border border-border px-1.5 py-0.5 text-[10px]">
              日本
            </span>
          ) : null}
          {job.tags.includes("海外") ? (
            <span className="rounded-full border border-border px-1.5 py-0.5 text-[10px]">
              海外
            </span>
          ) : null}
          {isUrgent(job) ? (
            <span className="rounded-full border border-orange-200 bg-orange-50 px-1.5 py-0.5 text-[10px] text-orange-900">
              高匹配
            </span>
          ) : null}
        </p>
      </button>
      <div className="flex shrink-0 flex-col items-end gap-1 pt-0.5">
        <select
          aria-label={`${job.role}进度`}
          value={record.status}
          onChange={(event) => onStatus(event.target.value as StatusId)}
          onClick={(event) => event.stopPropagation()}
          className="max-w-24 rounded-md border border-border bg-background px-1.5 py-1 text-[11px] outline-none"
        >
          {STATUSES.map((status) => (
            <option key={status.id} value={status.id}>
              {status.label}
            </option>
          ))}
        </select>
        {job.applyKind === "direct" ? (
          <a
            href={job.applyUrl}
            target="_blank"
            rel="noreferrer"
            onClick={(event) => event.stopPropagation()}
            className="text-[10px] text-primary underline-offset-2 hover:underline"
          >
            投递
          </a>
        ) : null}
      </div>
    </li>
  )
}
