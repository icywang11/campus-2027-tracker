export const STATUSES = [
  { id: "todo", label: "未投递", hint: "还没动手" },
  { id: "applied", label: "投递中", hint: "已网申 / 等初筛" },
  { id: "assessment", label: "测评中", hint: "在线测评 / AI 面" },
  { id: "written", label: "笔试中", hint: "笔试待完成或待出分" },
  { id: "interview", label: "面试中", hint: "已约面或进行中" },
  { id: "waiting", label: "等结果", hint: "面完等 HC / Offer" },
  { id: "offer", label: "已拿 Offer", hint: "意向书或正式 Offer" },
  { id: "rejected", label: "已拒绝", hint: "被拒或挂掉" },
  { id: "dropped", label: "已放弃", hint: "不继续跟这条" },
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
