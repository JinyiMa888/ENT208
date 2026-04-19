import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import JobJourney3D from "@/components/JobJourney3D";
import { Briefcase, FileSearch, PenTool, MessageSquare, ArrowRight, CheckCircle, Sparkles } from "lucide-react";

const features = [
  {
    icon: Briefcase,
    title: "岗位智能推荐",
    desc: "上传简历，AI 自动匹配最适合你的岗位，展示匹配理由与差距分析",
    link: "/jobs",
    iconBg: "bg-accent",
  },
  {
    icon: FileSearch,
    title: "简历匹配分析",
    desc: "逐句对比简历与JD，三色标注匹配/部分匹配/缺失，量化评分",
    link: "/match",
    iconBg: "bg-accent",
  },
  {
    icon: PenTool,
    title: "智能简历改写",
    desc: "3种风格一键改写，补充关键词、优化表述，实时预览提升分数",
    link: "/rewrite",
    iconBg: "bg-accent",
  },
  {
    icon: MessageSquare,
    title: "面试智能辅导",
    desc: "AI 预测面试问题，STAR框架回答建议，语音模拟面试实时评分",
    link: "/interview",
    iconBg: "bg-accent",
  },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden py-24 md:py-32">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-primary/20 blur-[120px]" />
        </div>
        <div className="container relative text-center">
          <div className="mx-auto mb-8 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-5 py-2 text-sm font-medium text-primary">
            <Sparkles className="h-4 w-4" />
            你的 AI 求职伙伴
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            智能求职，
          </h1>
          <h1 className="mt-2 bg-gradient-to-r from-primary via-emerald-600 to-teal-500 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl md:text-6xl">
            不止一份简历。
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground leading-relaxed">
            上传简历、告诉偏好，系统帮你找公司、改简历、练面试，<br className="hidden sm:block" />从投递到 offer 全程辅助。
          </p>
          <div className="mt-10">
            <Button size="lg" className="h-14 rounded-full px-10 text-base font-semibold shadow-lg shadow-primary/25" asChild>
              <Link to="/jobs">
                立即开始 <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* 3D 数字人求职旅程 - 滚动触发 */}
      <JobJourney3D />

      {/* How it works - S-curve layout */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <h2 className="text-center text-3xl font-bold">推荐 → 匹配 → 改写 → 面试</h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-muted-foreground">
            完整闭环，一站式搞定求职全流程
          </p>

          <div className="mx-auto mt-14 max-w-3xl space-y-6">
            <div className="grid grid-cols-2 gap-8">
              <div className="flex flex-col items-center text-center rounded-2xl bg-card p-6 shadow-sm border">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">1</div>
                <h3 className="mt-4 text-lg font-semibold">上传简历</h3>
                <p className="mt-1 text-sm text-muted-foreground">支持 PDF、DOCX、TXT 格式</p>
              </div>
              <div className="flex flex-col items-center text-center rounded-2xl bg-card p-6 shadow-sm border">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">2</div>
                <h3 className="mt-4 text-lg font-semibold">智能推荐</h3>
                <p className="mt-1 text-sm text-muted-foreground">AI 匹配最适合的岗位</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-8">
              <div className="flex flex-col items-center text-center rounded-2xl bg-card p-6 shadow-sm border">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">3</div>
                <h3 className="mt-4 text-lg font-semibold">匹配分析</h3>
                <p className="mt-1 text-sm text-muted-foreground">逐句对比简历与JD差距</p>
              </div>
              <div className="flex flex-col items-center text-center rounded-2xl bg-card p-6 shadow-sm border">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">4</div>
                <h3 className="mt-4 text-lg font-semibold">简历改写</h3>
                <p className="mt-1 text-sm text-muted-foreground">一键生成专属优化简历</p>
              </div>
            </div>
            <div className="flex justify-center">
              <div className="flex flex-col items-center text-center rounded-2xl bg-card p-6 shadow-sm border w-full max-w-xs">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">5</div>
                <h3 className="mt-4 text-lg font-semibold">模拟面试</h3>
                <p className="mt-1 text-sm text-muted-foreground">AI 面试官语音对话练到完美</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="container">
          <h2 className="text-center text-3xl font-bold">四大核心模块</h2>
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {features.map((f, i) => (
              <Card key={i} className="group transition-all hover:shadow-lg hover:-translate-y-1">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${f.iconBg}`}>
                      <f.icon className="h-6 w-6 text-accent-foreground" />
                    </div>
                    <CardTitle className="text-xl">{f.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{f.desc}</p>
                  <Button variant="link" className="mt-4 p-0" asChild>
                    <Link to={f.link}>
                      立即使用 <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Highlights */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <h2 className="text-center text-3xl font-bold">为什么选择 MatchResume</h2>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              "20+ 知名公司内置岗位库，即开即用",
              "逐句三色标注，一眼看清匹配差距",
              "3 种改写风格，一键生成专属简历",
              "AI 预测面试题，基于简历薄弱项",
              "语音模拟面试，还原真实面试场景",
              "数据看板追踪进度，越用越精准",
            ].map((text, i) => (
              <div key={i} className="flex items-start gap-3 rounded-xl border bg-card p-5 transition-shadow hover:shadow-md">
                <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                <span className="text-sm">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container">
          <div className="mx-auto max-w-2xl rounded-3xl bg-primary px-8 py-14 text-center shadow-xl shadow-primary/20">
            <h2 className="text-3xl font-bold text-primary-foreground">从投递到 Offer，全程 AI 辅助</h2>
            <p className="mx-auto mt-4 max-w-lg text-primary-foreground/80">
              立即开始，让 AI 帮你找到最适合的工作
            </p>
            <Button size="lg" variant="secondary" className="mt-8 rounded-full px-8" asChild>
              <Link to="/jobs">立即开始</Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t py-8">
        <div className="container text-center text-sm text-muted-foreground">
          © 2026 MatchResume. 一站式智能求职助手。
        </div>
      </footer>
    </div>
  );
};

export default Index;
