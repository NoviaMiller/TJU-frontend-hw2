# Wiki System

这是一个基于 `Vue 3 + Vite + TypeScript` 开发的课程 Wiki 前端项目，包含前台文章展示和后台文章管理两部分。当前接口为前端模拟数据版本，后续可以继续接入 `Node + Express + MySQL`。

## 1. 如何启动

### 运行环境

- Node.js 22 及以上
- npm 10 及以上

### 第一步：进入项目目录

```bash
cd wiki-system
```

### 第二步：安装依赖

```bash
npm install
```

本项目当前会安装并使用这些核心依赖：

- `vue`：前端框架
- `vue-router`：路由管理
- `pinia`：状态管理
- `axios`：请求封装与 Token 拦截器
- `@vueup/vue-quill`、`quill`：富文本编辑器
- `marked`：Markdown 渲染

### 第三步：启动开发服务器

```bash
npm run dev
```

启动后，终端会输出本地访问地址，通常类似：

```bash
http://localhost:5173
```

在浏览器中打开这个地址即可查看项目。

### 第四步：如需构建生产版本

```bash
npm run build
```

构建完成后会生成 `dist` 目录。

### 第五步：如需进行类型检查

```bash
npm run type-check
```

### 第六步：如需代码检查

```bash
npm run lint
```

## 2. 功能介绍

### 前台功能

- 文章列表分页展示
- 支持按关键词搜索文章
- 支持按分类筛选文章
- 展示文章标签、阅读量、更新时间和置顶状态
- 文章详情页支持 `Markdown` 和富文本内容渲染
- 游客可直接发表评论
- 评论列表按时间展示
- 支持响应式布局
- 支持浅色 / 暗色模式切换

### 后台功能

- 管理员登录
- 使用 Axios 拦截器自动携带 Token
- 路由权限控制：普通用户只能浏览，管理员可进入后台
- 文章发布
- 文章编辑
- 文章删除
- 文章置顶
- 草稿 / 发布状态切换
- 封面图上传（当前为模拟上传，返回图片 URL）
- 富文本编辑器写作
- Markdown 模式写作

### 当前模拟账号

- 管理员账号：`admin`
- 管理员密码：`admin123`
- 普通用户账号：`guest`
- 普通用户密码：`guest123`

### 当前技术实现说明

- 前端接口使用本地 mock 数据模拟 RESTful API
- 数据会暂存在浏览器 `localStorage` 中
- 已按后续后端对接习惯设计接口结构：
  - `POST /api/login`
  - `GET /api/user`
  - `GET /api/posts`
  - `POST /api/posts`
  - `PUT /api/posts/:id`
  - `DELETE /api/posts/:id`
  - `GET /api/comments`
  - `POST /api/comments`

### 后续可扩展方向

- 对接 `Node + Express + MySQL`
- 接入真实图片上传服务
- 增加文章审核功能
- 增加评论管理功能
- 增加用户管理与角色细分
