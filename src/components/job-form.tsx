"use client"

import { useState, type FormEvent } from "react"

import { Button } from "@/components/ui/button"
import { INDUSTRIES, JOB_TAGS, type Industry, type Job, type JobInput, type JobTag, type Track } from "@/data/job-model"

const TRACKS: Track[] = ["正式校招", "校招储备实习", "管培 / 专项"]

const fieldClass =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"

const areaClass =
  "min-h-20 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"

function lines(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean)
}

export function jobToForm(job?: Job): {
  company: string
  role: string
  locations: string
  applyUrl: string
  officialSite: string
  industry: Industry
  track: Track
  tags: JobTag[]
  responsibilities: string
  requirements: string
  note: string
} {
  return {
    company: job?.company ?? "",
    role: job?.role ?? "",
    locations: job?.locations.join(" / ") ?? "",
    applyUrl: job?.applyUrl ?? "",
    officialSite: job?.officialSite ?? "",
    industry: job?.industry ?? "游戏",
    track: job?.track ?? "正式校招",
    tags: job?.tags ?? [],
    responsibilities: job?.responsibilities.filter((item) => item !== "待补充").join("\n") ?? "",
    requirements: job?.requirements.filter((item) => item !== "待补充").join("\n") ?? "",
    note: job?.matchReasons[0] && !job.matchReasons[0].includes("手动添加") ? job.matchReasons.join("\n") : "",
  }
}

export function JobForm({
  jobId,
  initial,
  onSave,
  onCancel,
}: {
  jobId: string
  initial?: Job
  onSave: (input: JobInput) => void
  onCancel: () => void
}) {
  const seed = jobToForm(initial)
  const [company, setCompany] = useState(seed.company)
  const [role, setRole] = useState(seed.role)
  const [locations, setLocations] = useState(seed.locations)
  const [applyUrl, setApplyUrl] = useState(seed.applyUrl)
  const [officialSite, setOfficialSite] = useState(seed.officialSite)
  const [industry, setIndustry] = useState<Industry>(seed.industry)
  const [track, setTrack] = useState<Track>(seed.track)
  const [tags, setTags] = useState<JobTag[]>(seed.tags)
  const [responsibilities, setResponsibilities] = useState(seed.responsibilities)
  const [requirements, setRequirements] = useState(seed.requirements)
  const [note, setNote] = useState(seed.note)
  const [error, setError] = useState("")

  function toggleTag(tag: JobTag) {
    setTags((current) =>
      current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag]
    )
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!company.trim() || !role.trim()) {
      setError("公司和岗位名称必填。")
      return
    }
    const url = applyUrl.trim()
    if (!url) {
      setError("先把岗位 / 投递链接贴进来。")
      return
    }
    const locationList = locations
      .split(/[/、,，]/)
      .map((item) => item.trim())
      .filter(Boolean)
    const duty = lines(responsibilities)
    const req = lines(requirements)
    const notes = lines(note)
    onSave({
      id: jobId,
      company: company.trim(),
      role: role.trim(),
      industry,
      track,
      locations: locationList.length ? locationList : ["待填"],
      applyUrl: url,
      officialSite: officialSite.trim() || url,
      applyKind: "direct",
      jdUrl: url,
      tags,
      custom: true,
      match: "high",
      matchReasons: notes.length
        ? notes
        : ["你手动添加的岗位。链接已保存，岗位细则可以之后再补。"],
      responsibilities: duty.length ? duty : ["待补充"],
      requirements: req.length ? req : ["待补充"],
      batch: "手动添加",
    })
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <h2 className="font-heading text-2xl">{initial ? "编辑岗位" : "添加岗位"}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          先填公司和链接就行。职责、要求可以以后再贴；你把 JD 发给我之后，我再帮你补匹配度和改简历建议。
        </p>
      </div>

      <label className="block text-sm">
        公司
        <input
          value={company}
          onChange={(event) => setCompany(event.target.value)}
          className={`${fieldClass} mt-1`}
          placeholder="例如：库洛游戏"
        />
      </label>
      <label className="block text-sm">
        岗位名称
        <input
          value={role}
          onChange={(event) => setRole(event.target.value)}
          className={`${fieldClass} mt-1`}
          placeholder="例如：日本社区运营"
        />
      </label>
      <label className="block text-sm">
        岗位 / 投递链接
        <input
          value={applyUrl}
          onChange={(event) => setApplyUrl(event.target.value)}
          className={`${fieldClass} mt-1`}
          placeholder="把官网职位详情页链接贴在这里"
        />
      </label>
      <label className="block text-sm">
        地点
        <input
          value={locations}
          onChange={(event) => setLocations(event.target.value)}
          className={`${fieldClass} mt-1`}
          placeholder="上海 / 广州，用 / 分隔"
        />
      </label>
      <label className="block text-sm">
        校招官网（选填）
        <input
          value={officialSite}
          onChange={(event) => setOfficialSite(event.target.value)}
          className={`${fieldClass} mt-1`}
          placeholder="不填就用上面的岗位链接"
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          行业
          <select
            value={industry}
            onChange={(event) => setIndustry(event.target.value as Industry)}
            className={`${fieldClass} mt-1`}
          >
            {INDUSTRIES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          类型
          <select
            value={track}
            onChange={(event) => setTrack(event.target.value as Track)}
            className={`${fieldClass} mt-1`}
          >
            {TRACKS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
      </div>

      <fieldset>
        <legend className="text-sm">方向（可多选）</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {JOB_TAGS.map((tag) => (
            <label key={tag} className="inline-flex items-center gap-1.5 text-xs">
              <input
                type="checkbox"
                className="size-3.5 accent-current"
                checked={tags.includes(tag)}
                onChange={() => toggleTag(tag)}
              />
              {tag}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="block text-sm">
        职责（选填，一行一条）
        <textarea
          value={responsibilities}
          onChange={(event) => setResponsibilities(event.target.value)}
          className={`${areaClass} mt-1`}
          placeholder="暂时空着也没关系"
        />
      </label>
      <label className="block text-sm">
        任职要求（选填，一行一条）
        <textarea
          value={requirements}
          onChange={(event) => setRequirements(event.target.value)}
          className={`${areaClass} mt-1`}
          placeholder="暂时空着也没关系"
        />
      </label>
      <label className="block text-sm">
        自己的备注（选填）
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          className={`${areaClass} mt-1`}
          placeholder="比如：内推码、为什么想投、截止时间"
        />
      </label>

      {error ? <p className="text-sm text-rose-700">{error}</p> : null}

      <div className="flex flex-wrap gap-2">
        <Button type="submit">{initial ? "保存修改" : "保存岗位"}</Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          取消
        </Button>
      </div>
    </form>
  )
}
