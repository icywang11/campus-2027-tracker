"use client"

import { useMemo, useRef, useState } from "react"
import {
  ArrowUpRight,
  Briefcase,
  Download,
  Filter,
  GraduationCap,
  MapPin,
  RotateCcw,
  Search,
  Sparkles,
  Upload,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
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

export function JobBoard() {
  const store = useApplicationStore()
  const fileRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState("")
  const [industry, setIndustry] = useState<Industry | "all">("all")
  const [location, setLocation] = useState("all")
  const [match, setMatch] = useState<MatchLevel | "all">("all")
  const [statusFilter, setStatusFilter] = useState<StatusId | "all" | "active">(
    "all"
  )
  const [onlyPriority, setOnlyPriority] = useState(false)
  const [openJob, setOpenJob] = useState<Job | null>(null)

  const filtered = useMemo(() => {
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
        if (a.match !== b.match) return a.match === "high" ? -1 : 1
        return a.company.localeCompare(b.company, "zh")
      })
  }, [industry, location, match, onlyPriority, query, statusFilter, store])

  const highCount = jobs.filter((job) => job.match === "high").length

  return (
    <div className="min-h-full bg-background">
      <header className="border-b border-border/80 bg-paper">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-2xl">
              <p className="font-heading text-[11px] tracking-[0.28em] text-muted-foreground uppercase">
                2027 届校招看板 · {profile.englishName}
              </p>
              <h1 className="font-heading mt-2 text-3xl leading-tight text-foreground sm:text-4xl">
                {profile.name}的投递台账
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
                按简历匹配过的中大厂校招岗：海外运营、游戏社区、内容与跨境。
                状态存在这台浏览器里，勾选投递中、测评中、面试中，随时改。
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                nativeButton={false}
                render={
                  <a href={profile.portfolio} target="_blank" rel="noreferrer" />
                }
              >
                个人主页
                <ArrowUpRight />
              </Button>
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
                  if (window.confirm("清空本机全部投递状态？")) store.resetAll()
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

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="收录岗位" value={jobs.length} hint={`高匹配 ${highCount} 个`} />
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

          <div className="grid gap-4 rounded-2xl border border-border bg-card/70 p-4 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <p className="flex items-center gap-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                <GraduationCap className="size-3.5" />
                为什么按这个方向筛
              </p>
              <ul className="mt-2 space-y-1.5 text-sm leading-6 text-foreground/85">
                {profile.strengths.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="mt-2 size-1 shrink-0 rounded-full bg-primary" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="text-sm leading-6 text-muted-foreground">
              <p>
                {profile.education[0]}
                <br />
                {profile.internships[0]}
                <br />
                {profile.internships[1]}
              </p>
              <p className="mt-3">
                游戏经历：{profile.games.join(" · ")}
              </p>
              <p className="mt-3 text-xs">
                信息整理自 2026 年 8–9 月公开校招公告。HC 和 JD 以官网实时更新为准，投之前再点开链接核对。
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <section className="sticky top-0 z-20 -mx-4 mb-5 border-b border-border/70 bg-background/90 px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="relative grow">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="搜公司、岗位、城市、匹配理由"
                  className="pl-9"
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
                  <Checkbox
                    checked={onlyPriority}
                    onCheckedChange={(checked) => setOnlyPriority(Boolean(checked))}
                  />
                  只看优先冲
                </label>
              </div>
            </div>
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <Filter className="size-3.5" />
              当前 {filtered.length} / {jobs.length} 个岗位
              {query ? ` · 含「${query}」` : ""}
            </p>
          </div>
        </section>

        <div className="grid gap-4">
          {filtered.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              record={store.get(job.id)}
              onStatus={(status) => store.setStatus(job.id, status)}
              onFlag={(flag) => store.toggleFlag(job.id, flag)}
              onNote={(note) => store.setNote(job.id, note)}
              onOpen={() => setOpenJob(job)}
            />
          ))}
          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border px-6 py-16 text-center">
              <p className="font-heading text-lg">没有符合筛选的岗位</p>
              <p className="mt-2 text-sm text-muted-foreground">
                换一个行业或清掉搜索词再看。岗位还在，只是被筛掉了。
              </p>
            </div>
          ) : null}
        </div>
      </main>

      <JobDialog
        job={openJob}
        record={openJob ? store.get(openJob.id) : undefined}
        onClose={() => setOpenJob(null)}
        onStatus={(status) => openJob && store.setStatus(openJob.id, status)}
        onFlag={(flag) => openJob && store.toggleFlag(openJob.id, flag)}
        onNote={(note) => openJob && store.setNote(openJob.id, note)}
      />
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

function JobCard({
  job,
  record,
  onStatus,
  onFlag,
  onNote,
  onOpen,
}: {
  job: Job
  record: ApplicationRecord
  onStatus: (status: StatusId) => void
  onFlag: (flag: FlagId) => void
  onNote: (note: string) => void
  onOpen: () => void
}) {
  return (
    <article className="rounded-2xl border border-border bg-card p-4 shadow-[0_1px_0_rgba(28,25,23,0.04)] sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-heading text-xl text-foreground">{job.company}</h2>
            <Badge variant={job.match === "high" ? "default" : "secondary"}>
              {job.match === "high" ? "高匹配" : "可投"}
            </Badge>
            <Badge variant="outline">{job.industry}</Badge>
            <Badge variant="outline">{job.track}</Badge>
          </div>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-foreground/80">
            <span className="inline-flex items-center gap-1">
              <Briefcase className="size-3.5" />
              {job.role}
            </span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3.5" />
              {job.locations.join(" / ")}
            </span>
          </p>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {job.matchReasons[0]}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button size="sm" onClick={onOpen}>
            看 JD
          </Button>
          <Button
            size="sm"
            variant="outline"
            nativeButton={false}
            render={<a href={job.applyUrl} target="_blank" rel="noreferrer" />}
          >
            去投递
            <ArrowUpRight />
          </Button>
        </div>
      </div>

      <div className="mt-4 border-t border-border/80 pt-4">
        <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
          当前进度（单选）
        </p>
        <div className="flex flex-wrap gap-1.5">
          {STATUSES.map((status) => {
            const checked = record.status === status.id
            return (
              <label
                key={status.id}
                className={cn(
                  "inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors",
                  checked
                    ? statusTone(status.id)
                    : "border-border bg-background text-muted-foreground hover:bg-muted"
                )}
              >
                <input
                  type="checkbox"
                  className="size-3.5 accent-current"
                  checked={checked}
                  onChange={() => onStatus(status.id)}
                />
                {status.label}
              </label>
            )
          })}
        </div>
        <p className="mt-3 mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
          额外标记（可多选）
        </p>
        <div className="flex flex-wrap gap-3">
          {FLAGS.map((flag) => (
            <label key={flag.id} className="inline-flex items-center gap-2 text-xs">
              <Checkbox
                checked={record.flags.includes(flag.id)}
                onCheckedChange={() => onFlag(flag.id)}
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
    </article>
  )
}

function JobDialog({
  job,
  record,
  onClose,
  onStatus,
  onFlag,
  onNote,
}: {
  job: Job | null
  record?: ApplicationRecord
  onClose: () => void
  onStatus: (status: StatusId) => void
  onFlag: (flag: FlagId) => void
  onNote: (note: string) => void
}) {
  return (
    <Dialog open={Boolean(job)} onOpenChange={(open) => !open && onClose()}>
      {job && record ? (
        <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-heading pr-8 text-2xl">
              {job.company}
            </DialogTitle>
            <DialogDescription>
              {job.role} · {job.industry} · {job.locations.join(" / ")}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-wrap gap-2">
            <Badge>{job.match === "high" ? "高匹配" : "可投"}</Badge>
            <Badge variant="outline">{job.track}</Badge>
            <Badge variant="outline">{job.batch}</Badge>
          </div>

          <section>
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

          <section>
            <h3 className="text-sm font-medium">职位职责</h3>
            <ul className="mt-2 space-y-1.5 text-sm leading-6 text-foreground/90">
              {job.responsibilities.map((item) => (
                <li key={item}>· {item}</li>
              ))}
            </ul>
          </section>

          <section>
            <h3 className="text-sm font-medium">任职要求</h3>
            <ul className="mt-2 space-y-1.5 text-sm leading-6 text-foreground/90">
              {job.requirements.map((item) => (
                <li key={item}>· {item}</li>
              ))}
            </ul>
          </section>

          {job.plus?.length ? (
            <section>
              <h3 className="text-sm font-medium">加分项</h3>
              <p className="mt-2 text-sm leading-6">{job.plus.join(" · ")}</p>
            </section>
          ) : null}

          {job.caveat ? (
            <p className="rounded-xl bg-muted px-3 py-2 text-xs leading-5 text-muted-foreground">
              {job.caveat}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button
              nativeButton={false}
              render={<a href={job.applyUrl} target="_blank" rel="noreferrer" />}
            >
              打开投递链接
              <ArrowUpRight />
            </Button>
            <Button
              variant="outline"
              nativeButton={false}
              render={
                <a href={job.officialSite} target="_blank" rel="noreferrer" />
              }
            >
              校招官网
            </Button>
          </div>

          <div className="border-t border-border pt-4">
            <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
              当前进度
            </p>
            <div className="flex flex-wrap gap-1.5">
              {STATUSES.map((status) => (
                <label
                  key={status.id}
                  className={cn(
                    "inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs",
                    record.status === status.id
                      ? statusTone(status.id)
                      : "border-border bg-background text-muted-foreground"
                  )}
                >
                  <input
                    type="checkbox"
                    className="size-3.5 accent-current"
                    checked={record.status === status.id}
                    onChange={() => onStatus(status.id)}
                  />
                  {status.label}
                </label>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-3">
              {FLAGS.map((flag) => (
                <label
                  key={flag.id}
                  className="inline-flex items-center gap-2 text-xs"
                >
                  <Checkbox
                    checked={record.flags.includes(flag.id)}
                    onCheckedChange={() => onFlag(flag.id)}
                  />
                  {flag.label}
                </label>
              ))}
            </div>
            <Textarea
              value={record.note}
              onChange={(event) => onNote(event.target.value)}
              placeholder="进度备注"
              className="mt-3 min-h-16"
            />
          </div>
        </DialogContent>
      ) : null}
    </Dialog>
  )
}
