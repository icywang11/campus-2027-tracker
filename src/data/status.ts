export const STATUSES = [
  { id: "todo", label: "待查看", hint: "还没打开 JD" },
  { id: "viewed", label: "已查看", hint: "看过，还没准备投" },
  { id: "ready", label: "准备投递", hint: "简历改完，待提交" },
  { id: "applied", label: "已投递", hint: "已网申 / 等初筛" },
  { id: "assessment", label: "测评中", hint: "在线测评 / AI 面" },
  { id: "assessed", label: "测评完", hint: "测评已交，等筛选或面试" },
  { id: "written", label: "笔试", hint: "笔试待完成或待出分" },
  { id: "interview", label: "一面", hint: "已约面或进行中" },
  { id: "interview2", label: "二面", hint: "二面或终面" },
  { id: "waiting", label: "等结果", hint: "面完等 HC / Offer" },
  { id: "offer", label: "Offer", hint: "意向书或正式 Offer" },
  { id: "rejected", label: "拒绝", hint: "被拒或挂掉" },
  { id: "dropped", label: "暂停", hint: "这条先不跟了" },
] as const

export type StatusId = (typeof STATUSES)[number]["id"]

export const FLAGS = [
  { id: "referral", label: "已内推" },
  { id: "prep", label: "材料已备" },
  { id: "followup", label: "需跟进" },
  { id: "priority", label: "优先冲" },
] as const

export type FlagId = (typeof FLAGS)[number]["id"]

export type ApplicationRecord = {
  status: StatusId
  flags: FlagId[]
  note: string
  updatedAt: string
}

export const defaultRecord = (): ApplicationRecord => ({
  status: "todo",
  flags: [],
  note: "",
  updatedAt: new Date().toISOString(),
})

export const PIPELINE_STATUSES: StatusId[] = [
  "todo",
  "viewed",
  "ready",
  "applied",
  "assessment",
  "assessed",
  "written",
  "interview",
  "interview2",
  "waiting",
  "offer",
]

export const CLOSED_STATUSES: StatusId[] = ["rejected", "dropped"]

export const ACTIVE_STATUSES: StatusId[] = [
  "applied",
  "assessment",
  "assessed",
  "written",
  "interview",
  "interview2",
  "waiting",
]
