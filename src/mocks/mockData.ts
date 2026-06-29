import type { Comment, Post, User } from '@/types'

interface StoredUser extends User {
  password: string
}

export interface MockDatabase {
  posts: Post[]
  comments: Comment[]
  users: StoredUser[]
  nextPostId: number
  nextCommentId: number
}

function makeCover(title: string, from: string, to: string) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 720">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${from}" />
          <stop offset="100%" stop-color="${to}" />
        </linearGradient>
      </defs>
      <rect width="1200" height="720" rx="48" fill="url(#bg)" />
      <circle cx="980" cy="130" r="140" fill="rgba(255,255,255,0.14)" />
      <circle cx="220" cy="620" r="190" fill="rgba(15,23,42,0.16)" />
      <text x="90" y="300" fill="#fffaf1" font-size="74" font-family="Segoe UI Variable, Noto Sans SC, sans-serif" font-weight="700">
        ${title}
      </text>
      <text x="92" y="372" fill="#fff7ed" font-size="28" font-family="Segoe UI Variable, Noto Sans SC, sans-serif">
        Wiki System Mock Cover
      </text>
    </svg>
  `.trim()

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

const posts: Post[] = [
  {
    id: 1,
    title: '构建课程 Wiki 的信息分层',
    summary: '从导航、分类到标签，把课程资料组织成学生真正找得到的知识库。',
    content: `# 先把“找得到”做好

课程 Wiki 最大的问题，通常不是内容太少，而是内容堆在一起以后没有清晰入口。

## 推荐结构

- 课程总览：介绍课程目标、先修要求和常见疑问
- 实验记录：按实验周次或专题整理
- 复习资料：按知识模块沉淀总结
- 资源索引：链接课件、仓库、答疑帖

## 为什么分页和分类很重要

当文章数量增加后，用户更常见的行为不是“从头到尾看”，而是：

1. 带着问题搜索
2. 先看分类再点进详情
3. 通过标签继续串联相关内容

> 一个好用的 Wiki 首页，本质上是内容地图，而不是文章仓库。`,
    format: 'markdown',
    category: '产品设计',
    tags: ['信息架构', '课程站', '前端作业'],
    coverImage: makeCover('信息分层', '#b45309', '#0f766e'),
    authorName: 'Lin',
    status: 'published',
    pinned: true,
    views: 1240,
    createdAt: '2026-05-03T09:20:00.000Z',
    updatedAt: '2026-06-18T08:00:00.000Z',
  },
  {
    id: 2,
    title: '用 Vue 3 搭一个更顺手的文章列表页',
    summary: '列表页不只要展示内容，更要让筛选、搜索和浏览节奏自然流动。',
    content: `<h2>列表页应该有自己的节奏</h2>
<p>如果首页只是把文章按时间顺序堆出来，用户很快就会迷失。更合理的做法，是把<strong>搜索、分类、阅读量、置顶</strong>这些信息一起整合到浏览路径里。</p>
<p>在这个作业里，我们把置顶文章抬高展示，同时保留分页，让新内容和重点内容都能被看到。</p>
<h3>交互建议</h3>
<ul>
  <li>搜索框支持标题和正文关键词</li>
  <li>分类切换后重置分页</li>
  <li>卡片上同时露出分类、标签和阅读量</li>
</ul>
<p>这样首页会更像一个内容入口，而不是静态公告板。</p>`,
    format: 'richtext',
    category: '前端开发',
    tags: ['Vue 3', '列表页', '交互'],
    coverImage: makeCover('文章列表', '#0f766e', '#164e63'),
    authorName: 'Lin',
    status: 'published',
    pinned: true,
    views: 880,
    createdAt: '2026-05-10T10:00:00.000Z',
    updatedAt: '2026-06-20T11:00:00.000Z',
  },
  {
    id: 3,
    title: 'Axios 拦截器在课程作业里怎么用',
    summary: '把 Token 注入、401 处理和接口封装统一起来，前后端切换会省很多事。',
    content: `# 拦截器的价值

真正有用的不是“会配 Axios”，而是你把权限逻辑放到了统一入口。

\`\`\`ts
http.interceptors.request.use((config) => {
  config.headers.Authorization = \`Bearer \${token}\`
  return config
})
\`\`\`

## 这样做的好处

- 登录后所有请求自动带 Token
- 后期从 mock 切到 Express + MySQL，不需要重写页面层代码
- 401 场景可以集中处理
`,
    format: 'markdown',
    category: '工程实践',
    tags: ['Axios', 'Token', '拦截器'],
    coverImage: makeCover('Axios Token', '#be123c', '#1d4ed8'),
    authorName: 'Ming',
    status: 'published',
    pinned: false,
    views: 645,
    createdAt: '2026-05-18T12:30:00.000Z',
    updatedAt: '2026-06-11T03:20:00.000Z',
  },
  {
    id: 4,
    title: '评论区设计：游客也能参与，但后台仍然可控',
    summary: '评论功能不复杂，关键在于表达路径清晰、列表可读、管理边界明确。',
    content: `<h2>评论区不是越复杂越好</h2>
<p>课程 Wiki 的评论区最重要的是降低参与门槛，所以游客也应该能直接留言。</p>
<p>但后台依然需要控制文章编辑权限，因此评论与文章管理应当拆开：前者开放，后者收紧。</p>
<blockquote>开放讨论，不等于开放管理。</blockquote>`,
    format: 'richtext',
    category: '交互设计',
    tags: ['评论', '游客', '后台'],
    coverImage: makeCover('评论交互', '#7c2d12', '#334155'),
    authorName: 'Zoe',
    status: 'published',
    pinned: false,
    views: 512,
    createdAt: '2026-05-20T07:45:00.000Z',
    updatedAt: '2026-06-09T09:00:00.000Z',
  },
  {
    id: 5,
    title: '暗色模式不只是换背景颜色',
    summary: '如果只是简单反色，信息层级和重点区域通常会一起塌掉。',
    content: `# 暗色模式的重点

暗色模式最容易出问题的，是层级不够分明。卡片、边框、悬浮态和按钮都需要重新分配对比度。

## 本项目里的处理

- 主题通过 Pinia 持久化
- 使用 CSS 变量统一切换色板
- 保持重点色在深浅模式下都足够醒目
`,
    format: 'markdown',
    category: '视觉设计',
    tags: ['暗色模式', '主题', 'CSS'],
    coverImage: makeCover('Dark Mode', '#0f172a', '#14532d'),
    authorName: 'Ming',
    status: 'published',
    pinned: false,
    views: 933,
    createdAt: '2026-05-28T15:10:00.000Z',
    updatedAt: '2026-06-24T05:30:00.000Z',
  },
  {
    id: 6,
    title: '文章封面上传的前端处理流程',
    summary: '先本地预览，再模拟上传返回 URL，让表单体验完整起来。',
    content: `<h2>上传体验决定“写作连续性”</h2>
<p>如果作者上传封面后没有即时反馈，编辑体验会被打断。最顺手的方式是：</p>
<ol>
  <li>选择图片后立即显示预览</li>
  <li>调用上传接口拿到 URL</li>
  <li>把 URL 回填到文章表单</li>
</ol>
<p>即使当前是 mock 数据，这个流程也值得先搭好。</p>`,
    format: 'richtext',
    category: '前端开发',
    tags: ['上传', '封面图', '表单'],
    coverImage: makeCover('封面上传', '#0f766e', '#7c3aed'),
    authorName: 'Zoe',
    status: 'published',
    pinned: false,
    views: 476,
    createdAt: '2026-06-02T08:15:00.000Z',
    updatedAt: '2026-06-15T14:05:00.000Z',
  },
  {
    id: 7,
    title: '准备中的 MySQL 数据模型草案',
    summary: '先在前端跑通字段结构，再落到数据库表设计会更稳。',
    content: `# 对接 MySQL 前可以先想好的表

- users
- posts
- comments
- post_tags

## 为什么前端先用 mock 也值得

因为你可以先验证字段是否顺手，比如：

- \`status\`
- \`pinned\`
- \`views\`
- \`coverImage\`
- \`format\`
`,
    format: 'markdown',
    category: '数据库',
    tags: ['MySQL', '数据模型', '后续对接'],
    coverImage: makeCover('MySQL 草案', '#1d4ed8', '#7c2d12'),
    authorName: 'Lin',
    status: 'draft',
    pinned: false,
    views: 98,
    createdAt: '2026-06-05T09:00:00.000Z',
    updatedAt: '2026-06-25T09:40:00.000Z',
  },
  {
    id: 8,
    title: '后台写作台的交互清单',
    summary: '文章编辑页至少要让作者在标题、分类、标签、格式和封面之间切换自然。',
    content: `<h2>一个顺手的写作台应该降低切换成本</h2>
<p>编辑者在写文章时，会频繁在内容、封面、标签和发布状态之间来回跳。如果布局太拥挤，错误率会上升。</p>
<p>因此我们把信息分成三个区块：基础信息、内容编辑、发布设置。</p>`,
    format: 'richtext',
    category: '后台设计',
    tags: ['管理台', '富文本', '表单'],
    coverImage: makeCover('写作台', '#9333ea', '#b45309'),
    authorName: 'Ming',
    status: 'published',
    pinned: false,
    views: 357,
    createdAt: '2026-06-07T11:30:00.000Z',
    updatedAt: '2026-06-26T01:20:00.000Z',
  },
]

const comments: Comment[] = [
  {
    id: 1,
    postId: 1,
    author: '匿名同学',
    content: '这个信息分层思路很适合拿来整理实验报告。',
    createdAt: '2026-06-20T07:20:00.000Z',
  },
  {
    id: 2,
    postId: 1,
    author: '前端课代表',
    content: '如果再加一个热门标签区，首页会更完整。',
    createdAt: '2026-06-22T09:05:00.000Z',
  },
  {
    id: 3,
    postId: 2,
    author: 'Yuki',
    content: '置顶和分页同时保留这个点很赞，确实更像真正的网站。',
    createdAt: '2026-06-25T15:40:00.000Z',
  },
]

const users: StoredUser[] = [
  {
    id: 1,
    username: 'admin',
    password: 'admin123',
    name: '课程管理员',
    role: 'admin',
    bio: '负责发布和维护 Wiki 内容。',
    avatar: makeCover('Admin', '#0f766e', '#1d4ed8'),
  },
  {
    id: 2,
    username: 'guest',
    password: 'guest123',
    name: '演示访客',
    role: 'viewer',
    bio: '可登录体验浏览权限，但不能编辑内容。',
    avatar: makeCover('Guest', '#7c2d12', '#475569'),
  },
]

export function createInitialDatabase(): MockDatabase {
  return {
    posts,
    comments,
    users,
    nextPostId: 9,
    nextCommentId: 4,
  }
}
