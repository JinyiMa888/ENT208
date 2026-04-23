# ResumeBoost · AI 智能简历优化平台

> 面向中英文双语场景的一站式求职助手：AI 简历分析、岗位匹配、简历改写、模拟面试，一站搞定。

🌐 **在线预览**：https://resume-angel-55.lovable.app

---

## ✨ 核心功能

| 模块 | 说明 |
| --- | --- |
| 📄 **简历上传与解析** | 支持 PDF / DOCX，自动提取文本并保存到云端 |
| 🎯 **岗位匹配分析** | AI 对比简历与岗位 JD，输出匹配度评分、维度分析、优化建议 |
| 💼 **岗位推荐** | 内置 50+ 个 500 强岗位（含物流 / 供应链专题），AI 根据简历智能排序推荐 |
| ✍️ **简历改写** | 一键根据目标岗位重写简历，突出关键词与成就 |
| 🎤 **模拟面试** | AI 面试官分轮提问 + 实时反馈，支持中英文 |
| 🌍 **中英文双语** | 全站 UI、岗位数据、AI 输出均支持一键切换 |
| 📚 **历史记录** | 保存每次分析结果，可随时回看对比 |

---

## 🛠️ 技术栈

- **前端**：React 18 + Vite 5 + TypeScript 5
- **样式**：Tailwind CSS v3 + shadcn/ui
- **后端**：Lovable Cloud（Supabase 托管：PostgreSQL + Auth + Storage + Edge Functions）
- **AI**：Lovable AI Gateway（默认 `google/gemini-3-flash-preview`，无需自备 API Key）
- **路由 / 状态**：React Router + TanStack Query

---

## 📦 项目结构

```
src/
├── components/        # 通用组件（Navbar、LanguageToggle、ResumeUploader 等）
├── hooks/             # useAuth / useLanguage / useResumeText
├── pages/             # 路由页面
│   ├── Index.tsx          # 首页
│   ├── AuthPage.tsx       # 登录 / 注册
│   ├── DashboardPage.tsx  # 工作台
│   ├── JobsPage.tsx       # 岗位列表 + AI 推荐
│   ├── MatchPage.tsx      # 简历匹配分析
│   ├── RewritePage.tsx    # 简历改写
│   ├── InterviewPage.tsx  # 模拟面试
│   └── HistoryPage.tsx    # 历史记录
├── integrations/supabase/ # 自动生成的 client / types（勿手动改）
└── lib/                   # 工具函数（如简历导出）

supabase/
├── functions/         # Edge Functions
│   ├── analyze-resume/
│   ├── match-resume-job/
│   ├── recommend-jobs/
│   ├── rewrite-resume/
│   └── interview-coach/
└── migrations/        # 数据库迁移脚本
```

---

## 🗄️ 数据库表

| 表 | 用途 |
| --- | --- |
| `profiles` | 用户基本信息 |
| `user_roles` | 用户角色（独立表，避免越权） |
| `resume_analyses` | 简历分析历史记录 |
| `job_listings` | 双语岗位库（含 `_en` 后缀字段） |

所有表均启用 **Row-Level Security (RLS)**，确保用户只能访问自己的数据。

---

## 🌍 双语系统

- 右上角 **EN / 中** 一键切换
- 全部 UI 文案通过 `useLanguage()` hook 统一管理
- 岗位数据库存储中英两套字段（如 `job_title` / `job_title_en`）
- AI 调用时根据当前语言传入对应描述，输出语言与界面保持一致

---

## 🚀 本地开发

```bash
# 安装依赖
bun install   # 或 npm install

# 启动开发服务器
bun run dev   # 或 npm run dev

# 构建生产版本
bun run build
```

> Lovable Cloud 已自动配置 `.env`（`VITE_SUPABASE_URL`、`VITE_SUPABASE_PUBLISHABLE_KEY` 等），无需手动填写。

---

## 🔐 认证

- 邮箱 + 密码注册 / 登录
- 注册后需邮箱验证才能登录
- 受保护路由通过 `<ProtectedRoute>` 自动跳转登录

---

## 🤖 AI 能力一览

| Edge Function | 功能 |
| --- | --- |
| `analyze-resume` | 解析上传简历文本 |
| `match-resume-job` | 简历 ↔ 岗位深度匹配分析 |
| `recommend-jobs` | 根据简历对岗位库智能打分排序 |
| `rewrite-resume` | 针对目标岗位优化简历 |
| `interview-coach` | 模拟面试问答 + 反馈 |

均通过 Lovable AI Gateway 调用，**无需用户自备 API Key**。

---

## 📌 演示重点

本项目特别针对 **物流 / 供应链** 行业场景做了内容增强，岗位库包含 DHL、Maersk、京东物流、顺丰国际、中远海运、菜鸟、Apple Global Supply Chain、UPS 等知名雇主的双语 JD，适合面向国际客户演示。

---

## 📄 License

MIT
