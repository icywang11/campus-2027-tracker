# 王怡晨 2027 届校招投递台账

在线页面：**https://icywang11.github.io/campus-2027-tracker/**

仓库：https://github.com/icywang11/campus-2027-tracker

个人主页：[icywang11.github.io/portfolio-archive](https://icywang11.github.io/portfolio-archive/)

自己加岗位、把 JD / 投递链接贴进去。细则可以先空着。已投的腾讯、灵犀、阿里国际、米哈游还在。

准备好之后，把链接（或点页面上的「复制岗位清单」）发我，我再按岗位补职责、匹配度和改简历建议。

## 备份

`backup/progress-seed.json` 是已投四条的进度备份。页面右上角「导入」可选这个文件恢复。你自己加的岗位会保存在浏览器本地，导出 JSON 可以带走。

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
