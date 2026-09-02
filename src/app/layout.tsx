import type { Metadata } from "next"
import { Geist_Mono, Noto_Sans_SC, Noto_Serif_SC } from "next/font/google"

import "./globals.css"

const notoSans = Noto_Sans_SC({
  variable: "--font-noto-sans",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
})

const notoSerif = Noto_Serif_SC({
  variable: "--font-noto-serif",
  subsets: ["latin"],
  weight: ["600", "700"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "王怡晨 2027届校招投递台账",
  description:
    "按海外运营、游戏社区和跨境经历整理的中大厂 2027 届校招岗位，可勾选投递、测评、面试进度。",
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="zh-CN"
      className={`${notoSans.variable} ${notoSerif.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  )
}
