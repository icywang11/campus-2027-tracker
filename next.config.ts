import type { NextConfig } from "next"

const isGithubPages = process.env.GITHUB_PAGES === "true"

const nextConfig: NextConfig = {
  output: isGithubPages ? "export" : undefined,
  images: { unoptimized: true },
  trailingSlash: isGithubPages ? true : undefined,
  basePath: isGithubPages ? "/campus-2027-tracker" : undefined,
}

export default nextConfig
