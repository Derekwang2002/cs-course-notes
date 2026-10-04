# CS Notes · 计算机学习笔记

从 21 份课程 slides 整理的中文教学网站，涵盖算法、数据结构、Java、设计模式、计算机网络与操作系统。

- 1,068 页原始课件逐页浏览，并映射到讲解章节。
- 详细题意、推导、执行状态表、Java 实现、非基础语法/API、边界和复杂度。
- 课程总览、全文检索、题目索引、Java 语法手册。
- BFS、递归调用栈、硬币兑换 DP、自底向上建堆交互演示。
- 60 幅 Mermaid 图，按阅读位置加载；学习进度只保存在浏览器本地。

## 本地使用

需要 Node.js 20.19+（推荐 22）。

```sh
npm ci
npm run check
npm run build
npm run dev
```

打开 http://127.0.0.1:4173 。`dist` 是完全静态的发布产物，支持 GitHub Pages 的项目子路径，不需要服务器端程序或 API key。

## 内容结构

- `content/*.md`：各章讲义。题目用显式 HTML anchor。
- `content/*.json`：来源、页数、题目索引和逐页覆盖映射。
- `assets/slides/<章节>/<页码>.jpg`：原课件渲染图。
- `syntax.md`：Java 非基础语法手册。
- `app.js`、`labs.js`、`style.css`：网站与交互演示。
- `scripts/check.mjs`：检查逐页覆盖、图像、题目锚点、章节链接。

章节编号沿用原文件：14 分成 14a/14b，原文件夹没有16。跨章节同题保留各章的教学位置，首页的题目数是讲解条目数，不是去重后的 LeetCode 数量。

## 代码与来源

算法题的 Java Solution 通常可用 Java 8；Java/OOP/系统章节的部分工程示例使用 Java 21，正文说明版本。TreeNode、ListNode 等类型由题目平台提供，本地运行需补定义。每个同名 Solution 应分别编译，不应把所有题目放入同一文件。

原课件保留原样。讲义用独立表述展开，发现的题号、边界、复杂度和版本错误在正文标明；题目与官方资料链接附在相关章节。原课件和外部资料的权利归各自作者所有。

## 发布

站点部署在 `gh-pages` 分支根目录，包含 `.nojekyll`。更新内容后，先检查和构建，再把 `dist` 的静态文件推送到该发布分支。源码位于 `main`。

## 验证

`npm run check` 验证全部来源页、题目锚点和跨章链接。浏览器回归检查全部21章、60幅图、题目筛选与跳转、全文搜索、课件图片、四个交互演示、进度保存和390px手机布局：

```sh
npx playwright install chromium
# 另一个终端先启动 npm run dev
npm run test:browser
```

若复用已安装的 Chromium，可设置 `PLAYWRIGHT_CHROMIUM_EXECUTABLE`。自动测试结果与截图写入 `.test-output/`，不进入发布目录。

本次整理另对各章节完整 Java 程序做了编译、样例与边界测试，树形DP采用穷举摄像头方案对照，Trie/Word Search采用独立查找对照，BST生成检查唯一性和节点共享，恢复BST检查不同交换位置。网站提供代码阅读与复制，不在浏览器内执行任意Java代码。
