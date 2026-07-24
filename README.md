# 八卦运势 · 网页版落地页

暗红粒子大屏风格的单页 / 多屏滚动落地页。纯 HTML/CSS/JS，**零框架、零外部依赖、零图片资源**，整页自包含，可直接发布到 GitHub Pages。

页面结构（从上往下 9 屏）：

1. 八卦运势（Hero，文案锁定）
2. 八字命理 — 四柱 · 大运 · 流年 · 黄历
3. 紫微斗数 — 十二宫 · 四化 · 大限
4. 梅花易数 — 起卦 · 体用 · 变卦 · 爻辞
5. 六爻纳甲 — 铜钱卦 · 世应 · 纳甲
6. 塔罗占卜 — RWS 78 张 · 正逆位 · 牌阵
7. 风水择吉 — 飞星 · 奇门 · 择日
8. 合婚人格 — 合婚 · MBTI
9. 免责声明

## 链接汇总

| 类型 | 地址 | 状态 |
|------|------|------|
| **CloudStudio**（国内直开，可立即访问） | https://f886d3fbd67e42ceb9e1a5162c8ad50c.app.codebuddy.work | ✅ 已部署 |
| **GitHub 仓库** | https://github.com/haleyzzz/-bagua-fortune | ✅ 代码已上线 |
| **Gitee 仓库** | https://gitee.com/haleyzzz/bagua-fortune | ✅ 代码已上线 |
| **本地文件** | `F:/bagua-fortune/index.html` | ✅ 双击即可预览 |

> CloudStudio 为沙箱环境，链接有生命周期，久了可能回收需重新部署。GitHub / Gitee 仓库需开启 Pages 服务后才是「打开即看」的网页（见下）。

## 本地预览

- 直接双击 `index.html` 用浏览器打开（离线可运行，所有样式与粒子动画均内联）
- 或起本地服务：`python -m http.server 8000`，访问 http://localhost:8000

## 发布 / 开启网页访问

代码已在 GitHub 与 Gitee 上线，要变成「打开即看」的网页需各自开 Pages：

- **GitHub Pages**：仓库 Settings → Pages → Deploy from a branch → 分支 `main` / 目录 `/root` → Save → `https://haleyzzz.github.io/-bagua-fortune/`
- **Gitee Pages**：仓库「服务 → Gitee Pages」→ 部署 `main` 分支 → `https://haleyzzz.gitee.io/bagua-fortune/`
- **腾讯云 EdgeOne**：此前已关联 Gitee 仓库，代码填入后点「重新部署」即可跑起来。

### 以后改代码同步两边

本地已配双 remote（`origin`→GitHub、`gitee`→Gitee），一条命令同步：

```bash
git push origin main && git push gitee main
```

> ⚠️ 以上为玄学体系的传统解读与象征推演，仅供参考。本页由 AI 生成，不构成医疗、法律、财务或投资建议；命理是参考，不是定数。
