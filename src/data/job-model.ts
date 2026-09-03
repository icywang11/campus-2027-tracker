import type { FlagId, StatusId } from "./status"

export const INDUSTRIES = [
  "游戏",
  "短视频 / 直播",
  "内容社区",
  "跨境电商",
  "本地生活",
  "消费电子",
  "搜索 / AI",
] as const

export type Industry = (typeof INDUSTRIES)[number]
export type MatchLevel = "high" | "medium"
export type Track = "正式校招" | "校招储备实习" | "管培 / 专项"
export type ApplyKind = "direct" | "portal" | "closed"

export const JOB_TAGS = [
  "游戏",
  "海外",
  "日本",
  "社区",
  "内容",
  "用户运营",
  "市场",
  "产品",
  "本地化",
  "发行",
  "跨境",
  "增长",
] as const

export type JobTag = (typeof JOB_TAGS)[number]

export const DIRECTIONS = [
  "游戏",
  "海外",
  "日本",
  "社区",
  "用户运营",
  "内容",
  "市场",
  "产品",
] as const

export type Direction = (typeof DIRECTIONS)[number]

export type MatchBreakdown = {
  industry: number
  direction: number
  japanese: number
  overseas: number
  community: number
  location: number
}

export type ResumeChanges = {
  must: string[]
  should: string[]
  keep: string[]
}

export type Job = {
  id: string
  company: string
  companyGroup: string
  industry: Industry
  role: string
  track: Track
  locations: string[]
  applyUrl: string
  officialSite: string
  jdUrl?: string
  applyKind: ApplyKind
  tags: JobTag[]
  match: MatchLevel
  matchScore: number
  matchBreakdown: MatchBreakdown
  matchReasons: string[]
  highlights: string[]
  resumeChanges: ResumeChanges
  responsibilities: string[]
  requirements: string[]
  plus?: string[]
  batch: string
  deadline?: string
  caveat?: string
  postedAt?: string
  lastChecked: string
  custom?: boolean
  seed?: {
    status: StatusId
    note?: string
    flags?: FlagId[]
  }
}

export type JobInput = Omit<
  Job,
  | "companyGroup"
  | "applyKind"
  | "tags"
  | "matchScore"
  | "matchBreakdown"
  | "resumeChanges"
  | "highlights"
  | "lastChecked"
  | "jdUrl"
> & {
  companyGroup?: string
  applyKind?: ApplyKind
  tags?: JobTag[]
  matchScore?: number
  matchBreakdown?: Partial<MatchBreakdown>
  resumeChanges?: Partial<ResumeChanges>
  highlights?: string[]
  lastChecked?: string
  jdUrl?: string
}

const LAST_CHECKED = "2026-09-02"

const GROUP_ALIASES: Record<string, string> = {
  网易: "网易",
  腾讯: "腾讯",
  字节: "字节跳动",
  朝夕: "字节跳动",
  美团: "美团",
  阿里: "阿里巴巴",
  灵犀: "阿里巴巴",
  雷火: "网易",
}

export function inferCompanyGroup(company: string): string {
  for (const [key, group] of Object.entries(GROUP_ALIASES)) {
    if (company.includes(key)) return group
  }
  return company.split("·")[0].split("/")[0].trim()
}

function inferTags(input: JobInput): JobTag[] {
  const text = [
    input.company,
    input.role,
    input.industry,
    ...(input.matchReasons ?? []),
    ...(input.responsibilities ?? []),
  ].join(" ")
  const tags = new Set<JobTag>()
  if (input.industry === "游戏") tags.add("游戏")
  if (input.industry === "跨境电商") tags.add("跨境")
  if (input.industry === "内容社区") tags.add("内容")
  if (/日本|日语|Japan/.test(text)) tags.add("日本")
  if (/海外|国际|Global|跨境|出海|境外/.test(text)) tags.add("海外")
  if (/社区|玩家|Discord|社媒|Community/.test(text)) tags.add("社区")
  if (/内容|创作者|社媒|KOC|KOL/.test(text)) tags.add("内容")
  if (/用户运营|玩家运营|用户增长/.test(text)) tags.add("用户运营")
  if (/市场|营销|Marketing|品牌/.test(text)) tags.add("市场")
  if (/产品运营|产品/.test(text) && !/游戏产品/.test(input.role)) tags.add("产品")
  if (/本地化|LQA|Localization|翻译/.test(text)) tags.add("本地化")
  if (/发行|Publishing|publisher/i.test(text)) tags.add("发行")
  if (/增长|投放|获客/.test(text)) tags.add("增长")
  if (tags.size === 0) tags.add("用户运营")
  return [...tags]
}

function inferApplyKind(input: JobInput): ApplyKind {
  if (input.applyKind) return input.applyKind
  const url = input.applyUrl
  if (/post_detail|postid=|\/position\/\d{6,}/.test(url)) return "direct"
  return "portal"
}

function clampScore(value: number) {
  return Math.max(20, Math.min(98, Math.round(value)))
}

function inferBreakdown(input: JobInput, tags: JobTag[]): MatchBreakdown {
  const text = `${input.role} ${input.requirements.join(" ")} ${input.caveat ?? ""}`
  const westLangHard = /葡语|西语|葡萄牙语|西班牙语/.test(text) && !/日语/.test(input.role)
  const japanFocus = tags.includes("日本") || /日语/.test(text)
  const overseasFocus = tags.includes("海外") || tags.includes("跨境")
  const communityFocus = tags.includes("社区") || tags.includes("用户运营")
  const gameFocus = input.industry === "游戏" || tags.includes("游戏")
  const loc = input.locations.join(" ")
  const locationScore = /日本|东京|大阪/.test(loc)
    ? 62
    : /上海|广州|杭州|深圳|北京/.test(loc)
      ? 90
      : /香港|新加坡|Remote|远程/.test(loc)
        ? 72
        : 78

  return {
    industry: clampScore(gameFocus ? 92 : input.industry === "跨境电商" ? 86 : input.industry === "内容社区" ? 84 : 70),
    direction: clampScore(
      (japanFocus ? 18 : 0) +
        (overseasFocus ? 18 : 0) +
        (communityFocus ? 16 : 0) +
        (tags.includes("发行") || tags.includes("市场") ? 12 : 8) +
        40
    ),
    japanese: clampScore(westLangHard ? 28 : japanFocus ? 96 : /英语/.test(text) ? 68 : 74),
    overseas: clampScore(overseasFocus ? 90 : japanFocus ? 86 : 64),
    community: clampScore(communityFocus ? 88 : tags.includes("内容") ? 80 : 62),
    location: clampScore(locationScore),
  }
}

function scoreFromBreakdown(breakdown: MatchBreakdown) {
  return clampScore(
    breakdown.industry * 0.15 +
      breakdown.direction * 0.25 +
      breakdown.japanese * 0.2 +
      breakdown.overseas * 0.2 +
      breakdown.community * 0.15 +
      breakdown.location * 0.05
  )
}

function inferResumeChanges(input: JobInput, tags: JobTag[]): ResumeChanges {
  const must: string[] = [
    `把网易互娱「海外运营」实习放到第一条，标题靠近「${input.role}」，保留私信触达 100 万+、福利领取 10 万+。`,
  ]
  const should: string[] = [
    "自我评价改成 3 条可验证能力：日语工作语言、海外社区运营、数据复盘；删掉空泛性格描述。",
  ]
  const keep = [
    "教育：山东大学日语笔译硕士 + 大东文化大学交换，不要压缩。",
    "团委新媒体 100+ 篇原创推文，作为内容/活动执行证据保留。",
  ]

  if (tags.includes("日本") || /日语/.test(input.role)) {
    must.push(
      "学历和技能栏写明日语可作为工作语言（笔译硕士 / 日本交换），不要只写「日语专业」。"
    )
    must.push(
      "得物实习标题改成「全球化运营（日本商家）」：30+ 商家、单季 GMV +20%、10 万+ SKU。"
    )
  }
  if (tags.includes("社区") || tags.includes("用户运营")) {
    must.push(
      "网易实习保留 Discord 189 场活动对照、中奖重复率 -23.46%、闯关参与 +225% 这组机制数字。"
    )
    should.push("补一句你常看的社区（Discord / 米游社 / 小红书 / X）和你在里面做过的事。")
  }
  if (tags.includes("海外") || tags.includes("发行")) {
    must.push(
      "把「多语言文案 JSON + 名单去重 + 私信导入」写成一条可复用的海外触达流程，而不是「使用 AI」。"
    )
  }
  if (tags.includes("内容") || tags.includes("市场")) {
    should.push(
      "团委经历提前到校园经历第一条，强调栏目化选题、阅读复盘，不要只写「负责推文」。"
    )
  }
  if (tags.includes("跨境")) {
    must.push("得物经历突出日本市场洞察、竞品机制和 SOP，弱化纯国内电商表述。")
  }
  if (tags.includes("游戏")) {
    should.push(
      "游戏经历写成表格：王者 / LOL 手游 / 飞车 / 地平线 5 / 燕云十六声 / 原神，补时长或段位，贴岗位产品。"
    )
  }
  if (/葡语|西语/.test(input.requirements.join(" "))) {
    must.push(
      "不要把日语写成该岗工作语言。开头用一句话承认葡语/西语缺口，改强调跨境大促与数据复盘。"
    )
  }
  if (input.company.includes("米哈游") || input.company.includes("库洛") || /原神|鸣潮/.test(input.role)) {
    should.push("简历附一段对该公司产品社区现象的看法（版本争议、国际服差异、创作者生态任选其一）。")
  }

  return {
    must: [...new Set(must)].slice(0, 5),
    should: [...new Set(should)].slice(0, 4),
    keep: [...new Set(keep)].slice(0, 3),
  }
}

function inferHighlights(input: JobInput, tags: JobTag[]): string[] {
  const items: string[] = []
  if (tags.includes("日本")) items.push("日语可作为工作语言 / 理解日本玩家或市场")
  if (tags.includes("海外")) items.push("海外或跨文化运营、能独立推进项目")
  if (tags.includes("社区")) items.push("社区/玩家运营：活动、舆情、活跃")
  if (tags.includes("内容")) items.push("内容或社媒：选题、创作者、传播复盘")
  if (tags.includes("游戏")) items.push("游戏行业理解，能讲清品类和玩家心态")
  items.push("数据复盘：能把活动/渠道效果讲成数字")
  return items.slice(0, 5)
}

export function finalizeJob(input: JobInput): Job {
  const tags = input.tags?.length ? input.tags : inferTags(input)
  const applyKind = inferApplyKind(input)
  const breakdownBase = inferBreakdown(input, tags)
  const matchBreakdown: MatchBreakdown = {
    industry: input.matchBreakdown?.industry ?? breakdownBase.industry,
    direction: input.matchBreakdown?.direction ?? breakdownBase.direction,
    japanese: input.matchBreakdown?.japanese ?? breakdownBase.japanese,
    overseas: input.matchBreakdown?.overseas ?? breakdownBase.overseas,
    community: input.matchBreakdown?.community ?? breakdownBase.community,
    location: input.matchBreakdown?.location ?? breakdownBase.location,
  }
  const matchScore = input.matchScore ?? scoreFromBreakdown(matchBreakdown)
  const resumeBase = inferResumeChanges(input, tags)
  const applyUrlIsDetail = applyKind === "direct"

  return {
    ...input,
    companyGroup: input.companyGroup ?? inferCompanyGroup(input.company),
    tags,
    applyKind,
    jdUrl: input.jdUrl ?? (applyUrlIsDetail ? input.applyUrl : undefined),
    matchBreakdown,
    matchScore,
    match: matchScore >= 80 ? "high" : "medium",
    highlights: input.highlights ?? inferHighlights(input, tags),
    resumeChanges: {
      must: input.resumeChanges?.must ?? resumeBase.must,
      should: input.resumeChanges?.should ?? resumeBase.should,
      keep: input.resumeChanges?.keep ?? resumeBase.keep,
    },
    lastChecked: input.lastChecked ?? LAST_CHECKED,
  }
}

export function matchStars(score: number) {
  if (score >= 90) return "★★★★★"
  if (score >= 80) return "★★★★☆"
  if (score >= 70) return "★★★☆☆"
  if (score >= 60) return "★★☆☆☆"
  return "★☆☆☆☆"
}

export function isUrgent(job: Job) {
  return job.matchScore >= 88 && job.applyKind !== "closed"
}
