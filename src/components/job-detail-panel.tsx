"use client"

import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  CircleAlert,
  CircleDashed,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  isUrgent,
  matchStars,
  type Job,
  type MatchBreakdown,
} from "@/data/jobs"
import {
  FLAGS,
  STATUSES,
  type ApplicationRecord,
  type FlagId,
  type StatusId,
} from "@/data/status"
import { cn } from "@/lib/utils"

export function statusTone(id: StatusId) {
  switch (id) {
    case "todo":
      return "border-border bg-background text-muted-foreground"
    case "viewed":
      return "border-stone-300 bg-stone-50 text-stone-700"
    case "ready":
      return "border-cyan-300 bg-cyan-50 text-cyan-900"
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
    case "interview2":
      return "border-amber-400 bg-amber-100 text-amber-950"
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

export function statusLabel(id: StatusId) {
  return STATUSES.find((item) => item.id === id)?.label ?? id
}

export function StatusChips({
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

const BREAKDOWN_LABEL: Record<keyof MatchBreakdown, string> = {
  industry: "行业",
  direction: "岗位方向",
  japanese: "日语",
  overseas: "海外经验",
  community: "社区运营",
  location: "工作地点",
}

function fitLevel(score: number) {
  if (score >= 85)
    return { label: "强匹配", icon: CheckCircle2, className: "text-emerald-700" }
  if (score >= 65)
    return { label: "部分匹配", icon: CircleAlert, className: "text-amber-800" }
  return { label: "明显缺口", icon: CircleDashed, className: "text-rose-700" }
}

export function ApplyButtons({ job }: { job: Job }) {
  if (job.applyKind === "closed") {
    return <Badge variant="destructive">已关闭</Badge>
  }

  return (
    <div className="flex flex-wrap gap-2">
      {job.applyKind === "direct" ? (
        <a
          href={job.applyUrl}
          target="_blank"
          rel="noreferrer"
          className={cn(buttonVariants({ size: "sm" }))}
        >
          立即投递
          <ArrowUpRight />
        </a>
      ) : (
        <a
          href={job.applyUrl}
          target="_blank"
          rel="noreferrer"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          去官网找岗
          <ArrowUpRight />
        </a>
      )}
      {job.jdUrl && job.applyKind === "direct" ? (
        <a
          href={job.jdUrl}
          target="_blank"
          rel="noreferrer"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          查看 JD
        </a>
      ) : null}
      <a
        href={job.officialSite}
        target="_blank"
        rel="noreferrer"
        className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
      >
        校招官网
      </a>
    </div>
  )
}

export function JobDetailPanel({
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
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="font-heading text-[11px] tracking-[0.22em] text-muted-foreground uppercase">
            {job.companyGroup}
          </p>
          <h2 className="font-heading mt-1 text-2xl leading-tight">{job.company}</h2>
          <p className="mt-1 text-base font-medium">{job.role}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {job.locations.join(" / ")} · {job.track}
          </p>
        </div>
        <ApplyButtons job={job} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="font-heading text-lg tabular-nums">
          {matchStars(job.matchScore)} {job.matchScore}%
        </span>
        {isUrgent(job) ? (
          <Badge className="border-orange-200 bg-orange-100 text-orange-950">
            高匹配
          </Badge>
        ) : (
          <Badge variant="outline">{job.match === "high" ? "较匹配" : "可投备选"}</Badge>
        )}
        {job.tags.slice(0, 6).map((tag) => (
          <Badge key={tag} variant="outline">
            {tag}
          </Badge>
        ))}
        {job.applyKind === "direct" ? (
          <Badge>可直接投递</Badge>
        ) : (
          <Badge variant="secondary">需在官网搜岗</Badge>
        )}
      </div>

      {job.applyKind === "portal" ? (
        <p className="text-xs leading-5 text-muted-foreground">
          没有独立职位详情链接。请在官网搜索「{job.role}」，点进岗位详情后再投。
        </p>
      ) : null}

      <section>
        <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
          投递进度
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
      </section>

      <section className="rounded-xl border border-orange-300/80 bg-orange-50/60 p-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-orange-950">
          <AlertTriangle className="size-4 text-orange-700" />
          投递前建议修改
        </h3>
        <p className="mt-1 text-xs text-orange-900/80">
          投这份之前先改简历，不要直接用同一版投所有岗。
        </p>
        <div className="mt-3 space-y-3 text-sm leading-6">
          <div>
            <p className="text-xs font-medium text-rose-800">必须修改</p>
            <ul className="mt-1 space-y-1">
              {job.resumeChanges.must.map((item) => (
                <li key={item}>· {item}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-medium text-amber-800">建议修改</p>
            <ul className="mt-1 space-y-1">
              {job.resumeChanges.should.map((item) => (
                <li key={item}>· {item}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-medium text-emerald-800">可以保持</p>
            <ul className="mt-1 space-y-1">
              {job.resumeChanges.keep.map((item) => (
                <li key={item}>· {item}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-sm font-medium">匹配情况</h3>
        <div className="mt-2 overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <tbody>
              {(Object.keys(BREAKDOWN_LABEL) as (keyof MatchBreakdown)[]).map(
                (key) => {
                  const score = job.matchBreakdown[key]
                  const fit = fitLevel(score)
                  const Icon = fit.icon
                  return (
                    <tr key={key} className="border-t border-border first:border-t-0">
                      <td className="px-3 py-2 text-muted-foreground">
                        {BREAKDOWN_LABEL[key]}
                      </td>
                      <td className="px-3 py-2 tabular-nums">{score}%</td>
                      <td className={cn("px-3 py-2", fit.className)}>
                        <span className="inline-flex items-center gap-1">
                          <Icon className="size-3.5" />
                          {fit.label}
                        </span>
                      </td>
                    </tr>
                  )
                }
              )}
            </tbody>
          </table>
        </div>
        <ul className="mt-3 space-y-1.5 text-sm leading-6">
          {job.matchReasons.map((item) => (
            <li key={item}>· {item}</li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="text-sm font-medium">岗位核心要求</h3>
        <ul className="mt-2 space-y-1.5 text-sm leading-6">
          {job.highlights.map((item) => (
            <li key={item}>· {item}</li>
          ))}
        </ul>
      </section>

      <details className="rounded-xl border border-border bg-muted/30 px-3 py-2">
        <summary className="cursor-pointer text-sm font-medium">
          职责与任职要求
        </summary>
        <div className="mt-3 space-y-3 pb-2 text-sm leading-6">
          <div>
            <p className="text-xs text-muted-foreground">职责</p>
            <ul className="mt-1 space-y-1">
              {job.responsibilities.map((item) => (
                <li key={item}>· {item}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">任职要求</p>
            <ul className="mt-1 space-y-1">
              {job.requirements.map((item) => (
                <li key={item}>· {item}</li>
              ))}
            </ul>
          </div>
          {job.plus?.length ? (
            <p>加分：{job.plus.join(" · ")}</p>
          ) : null}
        </div>
      </details>

      {job.caveat ? (
        <p className="rounded-xl bg-muted px-3 py-2 text-xs leading-5 text-muted-foreground">
          {job.caveat}
        </p>
      ) : null}
      <p className="text-[11px] text-muted-foreground">
        {job.batch}
        {job.deadline ? ` · 窗口至 ${job.deadline}` : ""}
        {` · 核对于 ${job.lastChecked}`}
      </p>
    </div>
  )
}
