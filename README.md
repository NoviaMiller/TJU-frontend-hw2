# Wiki System Frontend

这是课程 Wiki 系统的前端项目，基于 `Vue 3 + Vite + TypeScript` 开发。

项目定位参考根目录的 [AGENTS.md](</E:/TJU-front/group/AGENTS.md>)：当前阶段以前端为主，先使用本地 mock 数据跑通页面、路由、权限和业务流程；后续再对接 `Node + Express + MySQL` 后端。

## 如何启动

### 运行环境

- Node.js `22.18.0` 或更高版本
- npm 可正常使用

### 1. 进入前端项目目录

```bash
cd wiki-system
```

### 2. 安装依赖

```bash
npm install
```

### 3. 启动开发环境

```bash
npm run dev
```

启动成功后，终端会输出本地访问地址，通常为：

```bash
http://localhost:5173
```

### 4. 其他常用命令

类型检查：

```bash
npm run type-check
```

代码检查：

```bash
npm run lint
```

生产构建：

```bash
npm run build
```

本地预览构建结果：

```bash
npm run preview
```

## 项目介绍

### 项目目标

本项目要实现一个 Wiki 系统，包含两条主要业务线：

- 前台展示：面向普通用户，负责文章浏览、分类筛选、详情阅读和评论互动
- 后台管理：面向管理员，负责登录、文章发布、编辑、删除、置顶和内容维护

### 当前阶段说明

当前前端项目采用“先前端、后后端”的开发方式：

- 当前接口是本地 mock API，不依赖真实后端服务
- 数据默认保存在浏览器 `localStorage` 中
- 前端接口结构已经按后续真实 RESTful API 的形式组织
- 数据库最终目标是 `MySQL`，但当前阶段先不直接接库

这意味着你现在只启动前端项目，也可以完整体验主要交互流程。

### 技术栈

- `Vue 3`
- `Vite`
- `TypeScript`
- `Vue Router`
- `Pinia`
- `Axios`
- `VueQuill / Quill`
- `marked`

### 当前功能范围

前台功能：

- 首页文章列表展示
- 文章分页浏览
- 分类筛选
- 文章详情查看
- Markdown / 富文本内容渲染
- 评论列表展示
- 登录后发表评论
- 浅色 / 暗色主题切换

后台功能：

- 管理员登录
- 路由权限控制
- 文章列表管理
- 新建文章
- 编辑文章
- 删除文章
- 文章置顶 / 状态管理
- 封面图模拟上传

### 当前路由页面

- `/`：首页
- `/library`：文章库
- `/posts/:id`：文章详情
- `/login`：后台登录
- `/admin/posts`：后台文章管理
- `/admin/posts/create`：新建文章
- `/admin/posts/:id/edit`：编辑文章

### 账号说明

当前 mock 数据内置了可直接使用的测试账号：

- 管理员：`admin` / `admin123`
- 普通用户：`guest` / `guest123`

管理员可进入后台管理页面，普通用户主要用于前台浏览和评论体验。

### 接口设计方向

当前前端已经按后续后端对接方式组织 API，核心接口方向包括：

- `POST /api/login`
- `GET /api/user`
- `GET /api/posts`
- `GET /api/posts/:id`
- `POST /api/posts`
- `PUT /api/posts/:id`
- `DELETE /api/posts/:id`
- `GET /api/comments`
- `POST /api/comments`

后续切换到真实后端时，原则上只需要替换接口实现，不需要大改页面层逻辑。

### 推荐开发思路

如果继续完善这个项目，建议按下面顺序推进：

1. 先稳定前端页面、状态管理和 mock 数据结构
2. 再拆分和整理 `src/api`、`src/types`、`src/views` 等目录
3. 然后补齐真实后端 `wiki-server`
4. 最后接入 `MySQL`，完成从 mock 到真实接口的切换
