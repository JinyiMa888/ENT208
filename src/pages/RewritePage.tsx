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
import { useLanguage } from "@/hooks/useLanguage";
import { toast } from "sonner";
import { PenTool, Loader2, ArrowRight, TrendingUp, Download, Lightbulb, FileText, FileType } from "lucide-react";
import { exportToWord, exportToPDF } from "@/lib/resumeExport";

interface RewriteResult {
  rewrittenContent: string;
  changes: { original: string; rewritten: string; reason: string; type: string }[];
  addedKeywords: string[];
  estimatedScoreImprovement: number;
  tips: string[];
}

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
  const { t } = useLanguage();

  const styles = [
    { id: "achievement", labelKey: "rewrite.style1", descKey: "rewrite.style1Desc" },
    { id: "responsibility", labelKey: "rewrite.style2", descKey: "rewrite.style2Desc" },
    { id: "data-driven", labelKey: "rewrite.style3", descKey: "rewrite.style3Desc" },
  ];

  useEffect(() => { if (jobId) loadJob(jobId); }, [jobId]);

  const loadJob = async (id: string) => {
    const { data } = await supabase.from("job_listings").select("*").eq("id", id).single();
    if (data) {
      setJobTitle(data.job_title);
      setCompany(data.company);
      setJobDescription(`${data.description}\n\n${data.requirements}`);
    }
  };

  const handleRewrite = async () => {
    if (!resumeText) { toast.error(t("rewrite.uploadFirst")); return; }
    if (!jobTitle) { toast.error(t("rewrite.titleRequired")); return; }
    setRewriting(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("rewrite-resume", {
        body: { resumeText, jobDescription, jobTitle, style: selectedStyle },
      });
      if (error) throw error;
      setResult(data as RewriteResult);
      toast.success(t("rewrite.success"));
    } catch (err: any) {
      toast.error(err.message || t("rewrite.failed"));
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
    a.download = `Resume_${jobTitle}_${selectedStyle}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const changeTypeBadge = (type: string) => {
    const map: Record<string, { key: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
      keyword_add: { key: "rewrite.changeKeywordAdd", variant: "default" },
      rephrase: { key: "rewrite.changeRephrase", variant: "secondary" },
      new_point: { key: "rewrite.changeNewPoint", variant: "outline" },
      remove: { key: "rewrite.changeRemove", variant: "destructive" },
    };
    const info = map[type] || { key: type, variant: "outline" as const };
    return <Badge variant={info.variant} className="text-xs">{t(info.key)}</Badge>;
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
        <h1 className="text-3xl font-bold">{t("rewrite.title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("rewrite.subtitle")}</p>

        <div className="mt-6 grid gap-6 lg:grid-cols-[350px_1fr]">
          <div className="space-y-4">
            <ResumeUploader />
            <Card>
              <CardHeader><CardTitle className="text-base">{t("rewrite.settings")}</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Input placeholder={t("rewrite.targetTitle")} value={jobTitle} onChange={e => setJobTitle(e.target.value)} />
                <Input placeholder={t("rewrite.targetCompany")} value={company} onChange={e => setCompany(e.target.value)} />
                <Textarea placeholder={t("rewrite.jdPh")} value={jobDescription} onChange={e => setJobDescription(e.target.value)} rows={5} />
                <div className="space-y-2">
                  <p className="text-sm font-medium">{t("rewrite.styleLabel")}</p>
                  {styles.map(s => (
                    <button
                      key={s.id}
                      onClick={() => setSelectedStyle(s.id)}
                      className={`w-full rounded-lg border p-3 text-left transition ${selectedStyle === s.id ? "border-primary bg-accent" : "hover:bg-muted"}`}
                    >
                      <p className="text-sm font-medium">{t(s.labelKey)}</p>
                      <p className="text-xs text-muted-foreground">{t(s.descKey)}</p>
                    </button>
                  ))}
                </div>
                <Button className="w-full" onClick={handleRewrite} disabled={rewriting}>
                  {rewriting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t("rewrite.rewriting")}</> : <><PenTool className="mr-2 h-4 w-4" />{t("rewrite.startBtn")}</>}
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            {!result && !rewriting && (
              <Card className="flex min-h-[400px] items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <PenTool className="mx-auto h-16 w-16 opacity-30" />
                  <p className="mt-4 text-lg">{t("rewrite.placeholderTitle")}</p>
                </div>
              </Card>
            )}

            {rewriting && (
              <Card className="flex min-h-[400px] items-center justify-center">
                <div className="text-center">
                  <Loader2 className="mx-auto h-16 w-16 animate-spin text-primary" />
                  <p className="mt-4 text-lg font-medium">{t("rewrite.aiRewriting")}</p>
                </div>
              </Card>
            )}

            {result && (
              <>
                <Card>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      <span className="font-medium">{t("rewrite.scoreImprove")}{result.estimatedScoreImprovement}%</span>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={downloadText}>
                        <Download className="mr-1.5 h-4 w-4" />{t("rewrite.exportTxt")}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => exportToWord(result.rewrittenContent, jobTitle, selectedStyle)}>
                        <FileText className="mr-1.5 h-4 w-4" />{t("rewrite.exportWord")}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => exportToPDF(result.rewrittenContent, jobTitle, selectedStyle)}>
                        <FileType className="mr-1.5 h-4 w-4" />{t("rewrite.exportPdf")}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Tabs defaultValue="tips">
                  <TabsList>
                    <TabsTrigger value="tips">{t("rewrite.tabTips")}</TabsTrigger>
                    <TabsTrigger value="compare">{t("rewrite.tabCompare")}</TabsTrigger>
                    <TabsTrigger value="full">{t("rewrite.tabFull")}</TabsTrigger>
                  </TabsList>

                  <TabsContent value="compare" className="space-y-3">
                    {result.addedKeywords.length > 0 && (
                      <Card>
                        <CardContent className="p-4">
                          <p className="mb-2 text-sm font-medium">{t("rewrite.addedKeywords")}</p>
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
                              <p className="mb-1 text-xs font-medium text-red-600">{t("rewrite.original")}</p>
                              {c.original}
                            </div>
                            <ArrowRight className="hidden self-center text-muted-foreground md:block" />
                            <div className="rounded bg-green-50 p-3 text-sm dark:bg-green-950/20">
                              <p className="mb-1 text-xs font-medium text-green-600">{t("rewrite.rewritten")}</p>
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
                        {result.tips.map((tip, i) => (
                          <div key={i} className="flex gap-3 rounded-lg bg-accent p-3 text-sm">
                            <Lightbulb className="h-4 w-4 flex-shrink-0 text-primary mt-0.5" />
                            <span>{tip}</span>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>

                <Card className="border-primary/30 bg-primary/5">
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <p className="font-medium">{t("rewrite.nextStepTitle")}</p>
                      <p className="text-sm text-muted-foreground">{t("rewrite.nextStepDesc")}</p>
                    </div>
                    <Button onClick={goToInterview}>
                      {t("rewrite.toInterview")} <ArrowRight className="ml-1 h-4 w-4" />
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
