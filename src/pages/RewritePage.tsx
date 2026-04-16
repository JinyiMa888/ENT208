import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navbar from "@/components/Navbar";
import WorkflowSteps from "@/components/WorkflowSteps";
import ResumeUploader from "@/components/ResumeUploader";
import { useResumeStore } from "@/hooks/useResumeText";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PenTool, Loader2, ArrowRight, TrendingUp, Download, Lightbulb } from "lucide-react";

interface RewriteResult {
  rewrittenContent: string;
  changes: { original: string; rewritten: string; reason: string; type: string }[];
  addedKeywords: string[];
  estimatedScoreImprovement: number;
  tips: string[];
}

const styles = [
  { id: "achievement", label: "成果导向", desc: "强调量化成果和具体贡献" },
  { id: "responsibility", label: "职责导向", desc: "突出管理能力和工作范围" },
  { id: "data-driven", label: "数据驱动", desc: "以数据和KPI为核心叙述" },
];

const RewritePage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const jobId = searchParams.get("jobId");
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [selectedStyle, setSelectedStyle] = useState("achievement");
  const [rewriting, setRewriting] = useState(false);
  const [result, setResult] = useState<RewriteResult | null>(null);
  const { resumeText } = useResumeStore();

  useEffect(() => { if (jobId) loadJob(jobId); }, [jobId]);

  const loadJob = async (id: string) => {
    const { data } = await supabase.from("job_listings").select("*").eq("id", id).single();
    if (data) {
      setJobTitle(data.job_title);
      setCompany(data.company);
      setJobDescription(`${data.description}\n\n要求：${data.requirements}`);
    }
  };

  const handleRewrite = async () => {
    if (!resumeText) { toast.error("请先上传简历"); return; }
    if (!jobTitle) { toast.error("请输入目标职位"); return; }
    setRewriting(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("rewrite-resume", {
        body: { resumeText, jobDescription, jobTitle, style: selectedStyle },
      });
      if (error) throw error;
      setResult(data as RewriteResult);
      toast.success("改写完成！");
    } catch (err: any) {
      toast.error(err.message || "改写失败");
    } finally {
      setRewriting(false);
    }
  };

  const downloadText = () => {
    if (!result) return;
    const blob = new Blob([result.rewrittenContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `优化简历_${jobTitle}_${selectedStyle}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const changeTypeBadge = (type: string) => {
    const map: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
      keyword_add: { label: "补充关键词", variant: "default" },
      rephrase: { label: "重写表述", variant: "secondary" },
      new_point: { label: "新增要点", variant: "outline" },
      remove: { label: "删除冗余", variant: "destructive" },
    };
    const info = map[type] || { label: type, variant: "outline" as const };
    return <Badge variant={info.variant} className="text-xs">{info.label}</Badge>;
  };

  const goToInterview = () => {
    const params = new URLSearchParams();
    if (jobTitle) params.set("jobTitle", jobTitle);
    if (company) params.set("company", company);
    navigate(`/interview?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-8">
        <WorkflowSteps />
        <h1 className="text-3xl font-bold">智能简历改写</h1>
        <p className="mt-2 text-muted-foreground">3种风格一键生成针对岗位的专属简历</p>

        <div className="mt-6 grid gap-6 lg:grid-cols-[350px_1fr]">
          <div className="space-y-4">
            <ResumeUploader />
            <Card>
              <CardHeader><CardTitle className="text-base">改写设置</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Input placeholder="目标职位 *" value={jobTitle} onChange={e => setJobTitle(e.target.value)} />
                <Input placeholder="目标公司" value={company} onChange={e => setCompany(e.target.value)} />
                <Textarea placeholder="岗位描述（JD）" value={jobDescription} onChange={e => setJobDescription(e.target.value)} rows={5} />
                <div className="space-y-2">
                  <p className="text-sm font-medium">改写风格</p>
                  {styles.map(s => (
                    <button
                      key={s.id}
                      onClick={() => setSelectedStyle(s.id)}
                      className={`w-full rounded-lg border p-3 text-left transition ${selectedStyle === s.id ? "border-primary bg-accent" : "hover:bg-muted"}`}
                    >
                      <p className="text-sm font-medium">{s.label}</p>
                      <p className="text-xs text-muted-foreground">{s.desc}</p>
                    </button>
                  ))}
                </div>
                <Button className="w-full" onClick={handleRewrite} disabled={rewriting}>
                  {rewriting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />改写中...</> : <><PenTool className="mr-2 h-4 w-4" />开始改写</>}
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            {!result && !rewriting && (
              <Card className="flex min-h-[400px] items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <PenTool className="mx-auto h-16 w-16 opacity-30" />
                  <p className="mt-4 text-lg">上传简历，设置目标岗位和改写风格</p>
                </div>
              </Card>
            )}

            {rewriting && (
              <Card className="flex min-h-[400px] items-center justify-center">
                <div className="text-center">
                  <Loader2 className="mx-auto h-16 w-16 animate-spin text-primary" />
                  <p className="mt-4 text-lg font-medium">AI 正在智能改写...</p>
                </div>
              </Card>
            )}

            {result && (
              <>
                <Card>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="h-5 w-5 text-green-500" />
                      <span className="font-medium">预计匹配分提升 +{result.estimatedScoreImprovement}%</span>
                    </div>
                    <Button size="sm" variant="outline" onClick={downloadText}>
                      <Download className="mr-1.5 h-4 w-4" />导出TXT
                    </Button>
                  </CardContent>
                </Card>

                <Tabs defaultValue="compare">
                  <TabsList>
                    <TabsTrigger value="compare">修改对照</TabsTrigger>
                    <TabsTrigger value="full">完整简历</TabsTrigger>
                    <TabsTrigger value="tips">优化建议</TabsTrigger>
                  </TabsList>

                  <TabsContent value="compare" className="space-y-3">
                    {result.addedKeywords.length > 0 && (
                      <Card>
                        <CardContent className="p-4">
                          <p className="mb-2 text-sm font-medium">新增关键词</p>
                          <div className="flex flex-wrap gap-1.5">
                            {result.addedKeywords.map(k => <Badge key={k} variant="default" className="text-xs">{k}</Badge>)}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                    {result.changes.map((c, i) => (
                      <Card key={i}>
                        <CardContent className="p-4">
                          <div className="mb-2">{changeTypeBadge(c.type)}</div>
                          <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr]">
                            <div className="rounded bg-red-50 p-3 text-sm dark:bg-red-950/20">
                              <p className="mb-1 text-xs font-medium text-red-600">原文</p>
                              {c.original}
                            </div>
                            <ArrowRight className="hidden self-center text-muted-foreground md:block" />
                            <div className="rounded bg-green-50 p-3 text-sm dark:bg-green-950/20">
                              <p className="mb-1 text-xs font-medium text-green-600">改写</p>
                              {c.rewritten}
                            </div>
                          </div>
                          <p className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
                            <Lightbulb className="h-3 w-3" /> {c.reason}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </TabsContent>

                  <TabsContent value="full">
                    <Card>
                      <CardContent className="p-6">
                        <div className="whitespace-pre-wrap text-sm">{result.rewrittenContent}</div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="tips">
                    <Card>
                      <CardContent className="space-y-3 p-6">
                        {result.tips.map((t, i) => (
                          <div key={i} className="flex gap-3 rounded-lg bg-accent p-3 text-sm">
                            <Lightbulb className="h-4 w-4 flex-shrink-0 text-primary mt-0.5" />
                            <span>{t}</span>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>

                {/* Next step CTA */}
                <Card className="border-primary/30 bg-primary/5">
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <p className="font-medium">下一步：模拟面试准备</p>
                      <p className="text-sm text-muted-foreground">用语音和 AI 面试官练习，为面试做好准备</p>
                    </div>
                    <Button onClick={goToInterview}>
                      面试辅导 <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RewritePage;
