import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";

import Navbar from "@/components/Navbar";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, Brain, FileText, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { useEffect } from "react";

interface AnalysisResult {
  matchScore: number;
  dimensions: { name: string; score: number }[];
  suggestions: string[];
  optimizedContent: string;
}

const Workspace = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      if (f.size > 10 * 1024 * 1024) {
        toast.error("文件大小不能超过10MB");
        return;
      }
      setFile(f);
    }
  };

  const handleAnalyze = async () => {
    if (!file) { toast.error("请先上传简历文件"); return; }
    if (!jobTitle) { toast.error("请输入期望职位"); return; }

    setAnalyzing(true);
    setResult(null);

    try {
      // Upload file to storage
      const fileExt = file.name.split(".").pop();
      const filePath = `${user!.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("resumes")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Call edge function for AI analysis
      const { data, error } = await supabase.functions.invoke("analyze-resume", {
        body: { filePath, jobTitle, company, jobDescription },
      });

      if (error) throw error;

      setResult(data as AnalysisResult);
      toast.success("分析完成！");
    } catch (err: any) {
      toast.error(err.message || "分析失败，请重试");
    } finally {
      setAnalyzing(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-8">
        <h1 className="text-3xl font-bold">简历优化工作台</h1>
        <p className="mt-2 text-muted-foreground">上传简历，AI 智能分析并提供优化建议</p>

        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          {/* Left: Upload & Input */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  上传简历
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border-2 border-dashed border-border p-8 text-center">
                  <input type="file" accept=".pdf,.docx,.doc" onChange={handleFileChange} className="hidden" id="resume-upload" />
                  <label htmlFor="resume-upload" className="cursor-pointer">
                    <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                    <p className="mt-2 text-sm font-medium">
                      {file ? file.name : "点击上传简历文件"}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">支持 PDF、DOCX 格式，最大 10MB</p>
                  </label>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  目标职位
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>期望职位 *</Label>
                  <Input placeholder="如：前端工程师" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>目标公司</Label>
                  <Input placeholder="如：Google" value={company} onChange={(e) => setCompany(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>职位描述（可选）</Label>
                  <Textarea placeholder="粘贴完整的职位描述，AI 将更精准匹配..." value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} rows={5} />
                </div>
                <Button className="w-full" onClick={handleAnalyze} disabled={analyzing}>
                  {analyzing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      AI 分析中...
                    </>
                  ) : (
                    "开始分析"
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right: Results */}
          <div className="space-y-6">
            {!result && !analyzing && (
              <Card className="flex min-h-[400px] items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <Brain className="mx-auto h-16 w-16 opacity-30" />
                  <p className="mt-4 text-lg">上传简历并填写目标职位</p>
                  <p className="mt-1 text-sm">AI 将为你生成详细的匹配分析报告</p>
                </div>
              </Card>
            )}

            {analyzing && (
              <Card className="flex min-h-[400px] items-center justify-center">
                <div className="text-center">
                  <Loader2 className="mx-auto h-16 w-16 animate-spin text-primary" />
                  <p className="mt-4 text-lg font-medium">AI 正在分析你的简历...</p>
                  <p className="mt-1 text-sm text-muted-foreground">这可能需要 30 秒左右</p>
                </div>
              </Card>
            )}

            {result && (
              <>
                {/* Match Score */}
                <Card>
                  <CardHeader>
                    <CardTitle>匹配度评分</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-center">
                      <div className="relative flex h-40 w-40 items-center justify-center">
                        <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
                          <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--primary))" strokeWidth="8" strokeDasharray={`${result.matchScore * 2.64} 264`} strokeLinecap="round" />
                        </svg>
                        <span className={`absolute text-4xl font-bold ${getScoreColor(result.matchScore)}`}>
                          {result.matchScore}%
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Dimensions */}
                <Card>
                  <CardHeader>
                    <CardTitle>维度分析</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {result.dimensions.map((d) => (
                      <div key={d.name}>
                        <div className="mb-1 flex justify-between text-sm">
                          <span>{d.name}</span>
                          <span className={getScoreColor(d.score)}>{d.score}%</span>
                        </div>
                        <Progress value={d.score} className="h-2" />
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Suggestions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5" />
                      优化建议
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {result.suggestions.map((s, i) => (
                        <li key={i} className="flex gap-3 rounded-lg bg-accent p-3 text-sm">
                          <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                {/* Optimized Content */}
                {result.optimizedContent && (
                  <Card>
                    <CardHeader>
                      <CardTitle>优化后简历内容</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="whitespace-pre-wrap rounded-lg bg-muted p-4 text-sm">
                        {result.optimizedContent}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Workspace;
