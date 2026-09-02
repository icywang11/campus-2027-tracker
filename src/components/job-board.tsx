"use client"

import { useMemo, useRef, useState } from "react"
import {
  ArrowUpRight,
  Briefcase,
  ChevronRight,
  Download,
  Filter,
  MapPin,
  RotateCcw,
  Search,
  Sparkles,
  Upload,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { profile } from "@/data/profile"
import {
  INDUSTRIES,
  LOCATIONS,
  jobs,
  type Industry,
  type Job,
  type MatchLevel,
} from "@/data/jobs"
import {
  FLAGS,
  STATUSES,
  type ApplicationRecord,
  type FlagId,
  type StatusId,
} from "@/data/status"
import { useApplicationStore } from "@/lib/use-application-store"
import { cn } from "@/lib/utils"

const ACTIVE_STATUSES: StatusId[] = [
  "applied",
  "assessment",
  "assessed",
  "written",
  "interview",
  "waiting",
]

function statusTone(id: StatusId) {
  switch (id) {
    case "todo":
      return "border-border bg-background text-muted-foreground"
    case "applied":
      return "border-sky-300 bg-sky-50 text-sky-800"
    case "assessment":
      return "border-violet-300 bg-violet-50 text-violet-800"
    case "assessed":
      return "border-teal-300 bg-teal-50 text-teal-800"
    case "written":
      return "border-indigo-300 bg-indigo-50 text-indigo-800"
    case "interview":
      return "border-amber-300 bg-amber-50 text-amber-900"
    case "waiting":
      return "border-orange-300 bg-orange-50 text-orange-900"
    case "offer":
      return "border-emerald-300 bg-emerald-50 text-emerald-800"
    case "rejected":
      return "border-rose-300 bg-rose-50 text-rose-800"
    case "dropped":
      return "border-stone-300 bg-stone-100 text-stone-600"
    default:
      return "border-border bg-muted text-muted-foreground"
  }
}

function statusLabel(id: StatusId) {
  return STATUSES.find((item) => item.id === id)?.label ?? id
}

function StatusChips({
  value,
  onChange,
}: {
  value: StatusId
  onChange: (status: StatusId) => void
}) {
  return (
    <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="当前进度">
      {STATUSES.map((status) => {
        const checked = value === status.id
        return (
          <button
            key={status.id}
            type="button"
            role="radio"
            aria-checked={checked}
            onClick={() => onChange(status.id)}
            className={cn(
              "inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors",
              checked
                ? statusTone(status.id)
                : "border-border bg-background text-muted-foreground hover:bg-muted"
            )}
          >
            <span
              className={cn(
                "grid size-3.5 place-items-center rounded-[3px] border border-current/40",
                checked && "bg-current/90"
              )}
            >
              {checked ? (
                <span className="block size-1.5 rounded-[1px] bg-background" />
              ) : null}
            </span>
            {status.label}
          </button>
        )
      })}
    </div>
  )
}

export function JobBoard() {
  const store = useApplicationStore()
  const fileRef = useRef<HTMLInputElement>(null)
  const detailRef = useRef<HTMLElement>(null)
  const [query, setQuery] = useState("")
  const [industry, setIndustry] = useState<Industry | "all">("all")
  const [location, setLocation] = useState("all")
  const [match, setMatch] = useState<MatchLevel | "all">("all")
  const [statusFilter, setStatusFilter] = useState<StatusId | "all" | "active">(
    "all"
  )
  const [onlyPriority, setOnlyPriority] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const rank = (job: Job) => {
      const status = store.get(job.id).status
      if (ACTIVE_STATUSES.includes(status) || status === "offer") return 0
      if (job.seed) return 1
      if (job.match === "high") return 2
      return 3
    }
    return jobs
      .filter((job) => {
        const record = store.get(job.id)
        const haystack = [
          job.company,
          job.role,
          job.industry,
          ...job.locations,
          ...job.matchReasons,
        ]
          .join(" ")
          .toLowerCase()
        if (query && !haystack.includes(query.trim().toLowerCase())) return false
        if (industry !== "all" && job.industry !== industry) return false
        if (location !== "all" && !job.locations.includes(location)) return false
        if (match !== "all" && job.match !== match) return false
        if (statusFilter === "active" && !ACTIVE_STATUSES.includes(record.status))
          return false
        if (
          statusFilter !== "all" &&
          statusFilter !== "active" &&
          record.status !== statusFilter
        )
          return false
        if (onlyPriority && !record.flags.includes("priority")) return false
        return true
      })
      .sort((a, b) => {
        const diff = rank(a) - rank(b)
        if (diff !== 0) return diff
        return a.company.localeCompare(b.company, "zh")
      })
  }, [industry, location, match, onlyPriority, query, statusFilter, store])

  const activeId =
    selectedId && filtered.some((job) => job.id === selectedId)
      ? selectedId
      : (filtered[0]?.id ?? null)
  const selected = filtered.find((job) => job.id === activeId) ?? null
  const selectedRecord = selected ? store.get(selected.id) : undefined

  function openJob(id: string) {
    setSelectedId(id)
    if (window.matchMedia("(max-width: 1023px)").matches) {
      window.setTimeout(() => {
        detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
      }, 50)
    }
  }

  return (
    <div className="min-h-full bg-background">
      <header className="border-b border-border/80 bg-paper">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="font-heading text-[11px] tracking-[0.28em] text-muted-foreground uppercase">
                2027 届校招目录 · {profile.englishName}
              </p>
              <h1 className="font-heading mt-2 text-3xl leading-tight sm:text-4xl">
                {profile.name}的投递台账
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                左侧目录勾进度，点进一条看 JD 和投递链接。已投的腾讯、灵犀、阿里国际、米哈游会排在前面。
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <a
                href={profile.portfolio}
                target="_blank"
                rel="noreferrer"
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                个人主页
                <ArrowUpRight />
              </a>
              <Button variant="outline" size="sm" onClick={store.exportJson}>
                <Download />
                导出进度
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
                  if (file) store.importJson(file)
                  event.target.value = ""
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label="目录" value={jobs.length} hint={`${filtered.length} 条在筛`} />
            <StatCard
              label="进行中"
              value={store.counts.inProcess}
              hint="投递 / 测评 / 面试 / 等结果"
            />
            <StatCard label="已拿 Offer" value={store.counts.offer} hint="意向书也算" />
            <StatCard
              label="已结束"
              value={store.counts.closed}
              hint="拒绝或主动放弃"
            />
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
                placeholder="搜公司、岗位、城市"
                className="h-8 w-full min-w-0 rounded-lg border border-input bg-transparent py-1 pr-2.5 pl-9 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </div>
            <div className="flex flex-wrap gap-2">
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
                label="城市"
                value={location}
                onChange={setLocation}
                options={[
                  { value: "all", label: "全部地点" },
                  ...LOCATIONS.map((item) => ({ value: item, label: item })),
                ]}
              />
              <FilterSelect
                label="匹配"
                value={match}
                onChange={(value) => setMatch(value as MatchLevel | "all")}
                options={[
                  { value: "all", label: "全部匹配" },
                  { value: "high", label: "高匹配" },
                  { value: "medium", label: "可投" },
                ]}
              />
              <FilterSelect
                label="进度"
                value={statusFilter}
                onChange={(value) =>
                  setStatusFilter(value as StatusId | "all" | "active")
                }
                options={[
                  { value: "all", label: "全部进度" },
                  { value: "active", label: "进行中" },
                  ...STATUSES.map((item) => ({
                    value: item.id,
                    label: item.label,
                  })),
                ]}
              />
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
            目录 {filtered.length} / {jobs.length}
            {query ? ` · 含「${query}」` : ""}
          </p>
        </section>

        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] xl:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="border-b border-border px-4 py-3">
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                岗位目录
              </p>
            </div>
            {filtered.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-muted-foreground">
                没有符合筛选的岗位
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {filtered.map((job) => (
                  <DirectoryRow
                    key={job.id}
                    job={job}
                    record={store.get(job.id)}
                    selected={job.id === activeId}
                    onSelect={() => openJob(job.id)}
                    onStatus={(status) => store.setStatus(job.id, status)}
                  />
                ))}
              </ul>
            )}
          </div>

          <section
            ref={detailRef}
            className="min-h-80 rounded-2xl border border-border bg-card p-4 sm:p-5"
          >
            {selected && selectedRecord ? (
              <JobDetail
                job={selected}
                record={selectedRecord}
                onStatus={(status) => store.setStatus(selected.id, status)}
                onFlag={(flag) => store.toggleFlag(selected.id, flag)}
                onNote={(note) => store.setNote(selected.id, note)}
              />
            ) : (
              <p className="py-16 text-center text-sm text-muted-foreground">
                从左边点一条，看 JD 和投递链接。
              </p>
            )}
          </section>
        </div>
      </main>
    </div>
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
        className="max-w-32 bg-transparent font-medium outline-none"
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

function DirectoryRow({
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
        "flex items-start gap-2 px-3 py-3",
        selected && "bg-muted/70"
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        className="min-w-0 flex-1 text-left"
      >
        <p className="flex items-center gap-1.5 text-sm font-medium">
          <span className="truncate">{job.company}</span>
          {selected ? <ChevronRight className="size-3.5 shrink-0" /> : null}
        </p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {job.role}
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
          <span className="rounded-full border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">
            {job.industry}
          </span>
        </p>
      </button>
      <label className="shrink-0 pt-0.5">
        <span className="sr-only">进度</span>
        <select
          aria-label={`${job.company}进度`}
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
      </label>
    </li>
  )
}

function JobDetail({
  job,
  record,
  onStatus,
  onFlag,
  onNote,
}: {
  job: Job
  record: ApplicationRecord
  onStatus: (status: StatusId) => void
  onFlag: (flag: FlagId) => void
  onNote: (note: string) => void
}) {
  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-heading text-2xl">{job.company}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {job.role} · {job.industry}
          </p>
          <p className="mt-1 inline-flex items-center gap-1 text-sm">
            <MapPin className="size-3.5" />
            {job.locations.join(" / ")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href={job.applyUrl}
            target="_blank"
            rel="noreferrer"
            className={cn(buttonVariants({ size: "sm" }))}
          >
            打开投递链接
            <ArrowUpRight />
          </a>
          <a
            href={job.officialSite}
            target="_blank"
            rel="noreferrer"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            校招官网
          </a>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Badge>{job.match === "high" ? "高匹配" : "可投"}</Badge>
        <Badge variant="outline">{job.track}</Badge>
        <Badge variant="outline">{job.batch}</Badge>
      </div>

      <div className="mt-5">
        <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
          当前进度（单选）
        </p>
        <StatusChips value={record.status} onChange={onStatus} />
        <div className="mt-3 flex flex-wrap gap-3">
          {FLAGS.map((flag) => (
            <label key={flag.id} className="inline-flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                className="size-3.5 accent-current"
                checked={record.flags.includes(flag.id)}
                onChange={() => onFlag(flag.id)}
              />
              {flag.label}
            </label>
          ))}
        </div>
        <Textarea
          value={record.note}
          onChange={(event) => onNote(event.target.value)}
          placeholder="进度备注：内推人、测评截止日期、面试轮次…"
          className="mt-3 min-h-16 resize-y"
        />
      </div>

      <section className="mt-6">
        <h3 className="flex items-center gap-2 text-sm font-medium">
          <Sparkles className="size-4" />
          为什么适配你
        </h3>
        <ul className="mt-2 space-y-1.5 text-sm leading-6">
          {job.matchReasons.map((item) => (
            <li key={item}>· {item}</li>
          ))}
        </ul>
      </section>

      <section className="mt-4">
        <h3 className="flex items-center gap-2 text-sm font-medium">
          <Briefcase className="size-4" />
          职位职责
        </h3>
        <ul className="mt-2 space-y-1.5 text-sm leading-6">
          {job.responsibilities.map((item) => (
            <li key={item}>· {item}</li>
          ))}
        </ul>
      </section>

      <section className="mt-4">
        <h3 className="text-sm font-medium">任职要求</h3>
        <ul className="mt-2 space-y-1.5 text-sm leading-6">
          {job.requirements.map((item) => (
            <li key={item}>· {item}</li>
          ))}
        </ul>
      </section>

      {job.plus?.length ? (
        <section className="mt-4">
          <h3 className="text-sm font-medium">加分项</h3>
          <p className="mt-2 text-sm leading-6">{job.plus.join(" · ")}</p>
        </section>
      ) : null}

      {job.caveat ? (
        <p className="mt-4 rounded-xl bg-muted px-3 py-2 text-xs leading-5 text-muted-foreground">
          {job.caveat}
        </p>
      ) : null}
    </div>
  )
}
