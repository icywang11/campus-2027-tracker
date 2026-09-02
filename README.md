# 王怡晨 2027 届校招投递台账

在线页面：**https://icywang11.github.io/campus-2027-tracker/**

仓库：https://github.com/icywang11/campus-2027-tracker

个人主页：[icywang11.github.io/portfolio-archive](https://icywang11.github.io/portfolio-archive/)

给 2027 届整理的个人求职投递台账。左边按公司折叠看岗，右边看匹配度、投递前改简历建议和进度。只有独立职位链接才会出现「立即投递」。

当前岗位池约 80 条、40+ 家公司，覆盖游戏 / 出海 / 日本 / 社区 / 跨境。岗位来自 2026 年 8–9 月各公司官方校招通道，**以官网实时为准**。多数岗位没有稳定的职位详情 URL，页面会标明「去官网找岗」，避免把招聘首页伪装成 JD。

## 备份

`backup/progress-seed.json` 是已投四条（腾讯测评完、灵犀日语游戏营销、阿里国际整合营销、米哈游国际化发行运营）的进度备份。页面右上角「导入」可选这个文件恢复。

## 本地运行

需要 Node.js 18+。

```bash
npm install
npm run dev
```

浏览器打开 [http://127.0.0.1:43217](http://127.0.0.1:43217)。

更新在线页面：

```bash
bash scripts/deploy-pages.sh
```
