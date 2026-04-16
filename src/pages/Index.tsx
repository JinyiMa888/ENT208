import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import { Briefcase, FileSearch, PenTool, MessageSquare, ArrowRight, CheckCircle, Sparkles } from "lucide-react";

const features = [
  {
    icon: Briefcase,
    title: "岗位智能推荐",
    desc: "上传简历，AI 自动匹配最适合你的岗位，展示匹配理由（✅⚠️❌）",
    link: "/jobs",
    color: "bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
  },
  {
    icon: FileSearch,
    title: "简历匹配分析",
    desc: "逐句对比简历与JD，三色标注匹配/部分匹配/缺失，量化评分",
    link: "/match",
    color: "bg-green-100 text-green-600 dark:bg-green-500/10 dark:text-green-400",
  },
  {
    icon: PenTool,
    title: "智能简历改写",
    desc: "3种风格一键改写，补充关键词、优化表述，实时预览提升分数",
    link: "/rewrite",
    color: "bg-purple-100 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400",
  },
  {
    icon: MessageSquare,
    title: "面试智能辅导",
    desc: "AI 预测面试问题，STAR框架回答建议，模拟面试实时评分",
    link: "/interview",
    color: "bg-orange-100 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400",
  },
];

const steps = [
  { num: "1", title: "上传简历", desc: "支持 PDF、DOCX、TXT 格式" },
  { num: "2", title: "智能推荐", desc: "AI 匹配最适合的岗位" },
  { num: "3", title: "匹配分析", desc: "逐句对比简历与JD差距" },
  { num: "4", title: "简历改写", desc: "一键生成专属优化简历" },
  { num: "5", title: "模拟面试", desc: "AI 面试官帮你练到完美" },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero - Clean minimal style */}
      <section className="relative overflow-hidden py-28 md:py-36">
        <div className="container relative text-center">
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border bg-muted/50 px-4 py-1.5 text-sm font-medium text-muted-foreground">
            <Sparkles className="h-4 w-4 text-primary" />
            你的 AI 求职伙伴
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            智能求职，
          </h1>
          <h1 className="bg-gradient-to-r from-orange-400 via-rose-400 to-primary bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl md:text-6xl lg:text-7xl">
            不止一份简历。
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            上传简历、告诉偏好，系统帮你找公司、改简历、练面试，从投递到 offer 全程辅助。
          </p>
          <div className="mt-10">
            <Button size="lg" className="h-14 rounded-full px-10 text-base font-semibold shadow-lg" asChild>
              <Link to="/jobs">
                立即开始 <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20">
        <div className="container">
          <h2 className="text-center text-3xl font-bold">推荐 → 匹配 → 改写 → 面试</h2>
          <p className="mx-auto mt-4 max-w-xl text-center text-muted-foreground">
            完整闭环，一站式搞定求职全流程
          </p>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {steps.map((step, i) => (
              <div key={i} className="flex flex-col items-center text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
                  {step.num}
                </div>
                <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-muted/50 py-20">
        <div className="container">
          <h2 className="text-center text-3xl font-bold">四大核心模块</h2>
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {features.map((f, i) => (
              <Card key={i} className="group transition-shadow hover:shadow-lg">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${f.color}`}>
                      <f.icon className="h-6 w-6" />
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
      <section className="py-20">
        <div className="container">
          <h2 className="text-center text-3xl font-bold">为什么选择 MatchResume</h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              "20+ 知名公司内置岗位库，即开即用",
              "逐句三色标注，一眼看清匹配差距",
              "3 种改写风格，一键生成专属简历",
              "AI 预测面试题，基于简历薄弱项",
              "模拟面试实时评分，STAR 框架指导",
              "数据看板追踪进度，越用越精准",
            ].map((text, i) => (
              <div key={i} className="flex items-start gap-3 rounded-lg border p-4">
                <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                <span className="text-sm">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary py-16">
        <div className="container text-center">
          <h2 className="text-3xl font-bold text-primary-foreground">从投递到 Offer，全程 AI 辅助</h2>
          <p className="mx-auto mt-4 max-w-lg text-primary-foreground/80">
            立即开始，让 AI 帮你找到最适合的工作
          </p>
          <Button size="lg" variant="secondary" className="mt-8" asChild>
            <Link to="/jobs">立即开始</Link>
          </Button>
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
