import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import {
  FileText, Upload, Brain, CheckCircle, Star,
  Building2, Briefcase, GraduationCap, Code, TrendingUp, Users
} from "lucide-react";

const resumeTemplates = [
  { title: "技术工程师", desc: "适用于软件工程师、前端/后端开发等技术岗位", icon: Code, tags: ["Python", "React", "AWS"] },
  { title: "产品经理", desc: "适用于产品经理、项目管理等岗位", icon: TrendingUp, tags: ["Agile", "用户研究", "数据分析"] },
  { title: "市场营销", desc: "适用于品牌营销、数字营销等岗位", icon: Users, tags: ["SEO", "内容营销", "社交媒体"] },
  { title: "金融分析", desc: "适用于投行、基金、财务分析等岗位", icon: TrendingUp, tags: ["财务建模", "Excel", "风控"] },
  { title: "数据科学家", desc: "适用于数据分析、机器学习等岗位", icon: Brain, tags: ["Python", "SQL", "TensorFlow"] },
  { title: "UI/UX设计", desc: "适用于产品设计、交互设计等岗位", icon: Star, tags: ["Figma", "用户体验", "原型设计"] },
];

const companyRequirements = [
  {
    company: "Google", role: "Software Engineer L4",
    skills: ["数据结构与算法", "系统设计", "至少一门编程语言精通", "分布式系统经验"],
    education: "计算机科学或相关专业本科及以上", highlight: "注重问题解决能力和编码质量"
  },
  {
    company: "Apple", role: "iOS Developer",
    skills: ["Swift/Objective-C", "UIKit/SwiftUI", "性能优化", "多线程编程"],
    education: "计算机科学或相关专业", highlight: "对产品细节有极致追求"
  },
  {
    company: "Microsoft", role: "Product Manager",
    skills: ["产品规划与路线图", "数据驱动决策", "跨团队协作", "用户研究"],
    education: "本科及以上，MBA优先", highlight: "需要展示领导力和影响力"
  },
  {
    company: "Amazon", role: "Data Scientist",
    skills: ["统计学与机器学习", "SQL与Python", "A/B测试", "业务指标分析"],
    education: "统计学/数学/计算机科学硕士及以上", highlight: "Leadership Principles面试是关键"
  },
  {
    company: "Meta", role: "Frontend Engineer",
    skills: ["React/JavaScript精通", "性能优化", "可访问性", "大规模系统经验"],
    education: "计算机科学或相关专业", highlight: "重视系统设计和编码能力"
  },
  {
    company: "Tesla", role: "Mechanical Engineer",
    skills: ["CAD/CAE工具", "制造工艺", "材料科学", "项目管理"],
    education: "机械工程本科及以上", highlight: "快速迭代和创新思维"
  },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-primary py-24">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: "radial-gradient(circle at 25% 50%, hsl(210 60% 60%) 0%, transparent 50%), radial-gradient(circle at 75% 50%, hsl(38 92% 50%) 0%, transparent 50%)"
          }} />
        </div>
        <div className="container relative text-center">
          <h1 className="text-4xl font-bold tracking-tight text-primary-foreground sm:text-5xl md:text-6xl">
            AI 智能简历优化
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-primary-foreground/80">
            上传您的简历，输入期望职位，AI 将智能分析匹配度并提供专业优化建议，让您的简历脱颖而出
          </p>
          <div className="mt-10 flex justify-center gap-4">
            <Button size="lg" variant="secondary" asChild>
              <Link to="/workspace">开始优化简历</Link>
            </Button>
            <Button size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10" asChild>
              <Link to="/register">免费注册</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20">
        <div className="container">
          <h2 className="text-center text-3xl font-bold text-foreground">三步完成简历优化</h2>
          <p className="mx-auto mt-4 max-w-xl text-center text-muted-foreground">
            简单高效的流程，让 AI 为你的求职之路加速
          </p>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {[
              { icon: Upload, title: "上传简历", desc: "支持 PDF、DOCX 格式，安全加密存储" },
              { icon: Brain, title: "AI 智能分析", desc: "多维度分析简历与目标职位的匹配度" },
              { icon: CheckCircle, title: "获取优化建议", desc: "针对性建议，一键优化简历内容" },
            ].map((step, i) => (
              <div key={i} className="flex flex-col items-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent">
                  <step.icon className="h-8 w-8 text-primary" />
                </div>
                <div className="mt-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {i + 1}
                </div>
                <h3 className="mt-4 text-xl font-semibold">{step.title}</h3>
                <p className="mt-2 text-muted-foreground">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Resume Templates */}
      <section className="bg-muted/50 py-20">
        <div className="container">
          <h2 className="text-center text-3xl font-bold">优秀简历模板</h2>
          <p className="mx-auto mt-4 max-w-xl text-center text-muted-foreground">
            针对不同行业和岗位精心打造的专业简历模板
          </p>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {resumeTemplates.map((t, i) => (
              <Card key={i} className="transition-shadow hover:shadow-lg">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
                      <t.icon className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{t.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{t.desc}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {t.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Fortune 500 Requirements */}
      <section className="py-20">
        <div className="container">
          <div className="text-center">
            <h2 className="text-3xl font-bold">500强公司招聘要求</h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              了解顶级公司的招聘标准，有针对性地优化你的简历
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {companyRequirements.map((c, i) => (
              <Card key={i} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Building2 className="h-6 w-6 text-primary" />
                    <div>
                      <CardTitle className="text-lg">{c.company}</CardTitle>
                      <p className="text-sm text-muted-foreground">{c.role}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Briefcase className="h-4 w-4 text-primary" />
                      关键技能
                    </div>
                    <ul className="mt-2 space-y-1">
                      {c.skills.map((s) => (
                        <li key={s} className="text-sm text-muted-foreground">• {s}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <GraduationCap className="h-4 w-4 text-primary" />
                      学历要求
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{c.education}</p>
                  </div>
                  <div className="mt-auto rounded-lg bg-accent px-3 py-2">
                    <p className="text-xs font-medium text-primary">💡 {c.highlight}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary py-16">
        <div className="container text-center">
          <h2 className="text-3xl font-bold text-primary-foreground">准备好优化你的简历了吗？</h2>
          <p className="mx-auto mt-4 max-w-lg text-primary-foreground/80">
            加入数千名求职者，让 AI 帮你打造完美简历
          </p>
          <Button size="lg" variant="secondary" className="mt-8" asChild>
            <Link to="/workspace">立即开始</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container text-center text-sm text-muted-foreground">
          © 2026 ResumeBoost. AI 智能简历优化平台。
        </div>
      </footer>
    </div>
  );
};

export default Index;
