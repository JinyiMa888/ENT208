import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import WorkflowSteps from "@/components/WorkflowSteps";
import ResumeUploader from "@/components/ResumeUploader";
import MarkAppliedButton from "@/components/MarkAppliedButton";
import { useResumeStore } from "@/hooks/useResumeText";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { toast } from "sonner";
import { FileSearch, Loader2, CheckCircle, AlertTriangle, XCircle, Target, ArrowRight } from "lucide-react";

interface MatchResult {
  overallScore: number;
  dimensions: { name: string; score: number; detail: string }[];
  sentenceAnalysis: { resumeSentence: string; status: string; relatedRequirement: string; comment: string }[];
  missingItems: { requirement: string; importance: string; suggestion: string }[];
  keywords: { matched: string[]; missing: string[]; extra: string[] };
}

const MatchPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const jobId = searchParams.get("jobId");
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<MatchResult | null>(null);
  const { resumeText } = useResumeStore();
  const { user } = useAuth();
  const { t, lang } = useLanguage();

  useEffect(() => { if (jobId) loadJob(jobId); }, [jobId]);

  const loadJob = async (id: string) => {
    const { data } = await supabase.from("job_listings").select("*").eq("id", id).single();
    if (data) {
      setJobTitle(data.job_title);
      setCompany(data.company);
      setJobDescription(`${data.description}\n\n${t("match.requirements")}${data.requirements}`);
    }
  };

  const handleAnalyze = async () => {
    if (!resumeText) { toast.error(t("match.uploadFirst")); return; }
    if (!jobDescription) { toast.error(t("match.jdRequired")); return; }
    setAnalyzing(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("match-resume-job", {
        body: { resumeText, jobDescription, jobTitle, company, lang },
      });
      if (error) throw error;
      const matchData = data as MatchResult;
      setResult(matchData);

      if (user && jobTitle) {
        await supabase.from("resume_analyses").insert([{
          user_id: user.id,
          job_title: jobTitle,
          company: company || null,
          match_score: matchData.overallScore,
          dimensions: matchData.dimensions as never,
          suggestions: {
            sentenceAnalysis: matchData.sentenceAnalysis,
            missingItems: matchData.missingItems,
            keywords: matchData.keywords,
          } as never,
        }]);
      }
      toast.success(t("match.success"));
    } catch (err: any) {
      toast.error(err.message || t("match.failed"));
    } finally {
      setAnalyzing(false);
    }
  };

  const statusIcon = (status: string) => {
    if (status === "match") return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (status === "partial") return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    return <XCircle className="h-4 w-4 text-red-500" />;
  };

  const statusBg = (status: string) => {
    if (status === "match") return "border-l-green-500 bg-green-50 dark:bg-green-950/20";
    if (status === "partial") return "border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950/20";
    return "border-l-red-500 bg-red-50 dark:bg-red-950/20";
  };

  const importanceBadge = (imp: string) => {
    if (imp === "high") return <Badge variant="destructive" className="text-xs">{t("match.impHigh")}</Badge>;
    if (imp === "medium") return <Badge variant="secondary" className="text-xs">{t("match.impMedium")}</Badge>;
    return <Badge variant="outline" className="text-xs">{t("match.impLow")}</Badge>;
  };

  const goToRewrite = () => {
    const params = new URLSearchParams();
    if (jobId) params.set("jobId", jobId);
    navigate(`/rewrite?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-8">
        <WorkflowSteps />
        <h1 className="text-3xl font-bold">{t("match.title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("match.subtitle")}</p>

        <div className="mt-6 grid gap-6 lg:grid-cols-[350px_1fr]">
          <div className="space-y-4">
            <ResumeUploader />
            <Card>
              <CardHeader><CardTitle className="text-base">{t("match.targetJob")}</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Input placeholder={t("match.jobTitlePh")} value={jobTitle} onChange={e => setJobTitle(e.target.value)} />
                <Input placeholder={t("match.companyPh")} value={company} onChange={e => setCompany(e.target.value)} />
                <Textarea placeholder={t("match.jdPh")} value={jobDescription} onChange={e => setJobDescription(e.target.value)} rows={8} />
                <Button className="w-full" onClick={handleAnalyze} disabled={analyzing}>
                  {analyzing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t("match.analyzing")}</> : <><FileSearch className="mr-2 h-4 w-4" />{t("match.startBtn")}</>}
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            {!result && !analyzing && (
              <Card className="flex min-h-[400px] items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <Target className="mx-auto h-16 w-16 opacity-30" />
                  <p className="mt-4 text-lg">{t("match.placeholderTitle")}</p>
                  <p className="mt-1 text-sm">{t("match.placeholderSub")}</p>
                </div>
              </Card>
            )}

            {analyzing && (
              <Card className="flex min-h-[400px] items-center justify-center">
                <div className="text-center">
                  <Loader2 className="mx-auto h-16 w-16 animate-spin text-primary" />
                  <p className="mt-4 text-lg font-medium">{t("match.analyzingTitle")}</p>
                </div>
              </Card>
            )}

            {result && (
              <>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-8">
                      <div className="relative flex h-32 w-32 items-center justify-center">
                        <svg className="-rotate-90" viewBox="0 0 100 100" width="128" height="128">
                          <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
                          <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--primary))" strokeWidth="8" strokeDasharray={`${result.overallScore * 2.64} 264`} strokeLinecap="round" />
                        </svg>
                        <span className="absolute text-3xl font-bold">{result.overallScore}%</span>
                      </div>
                      <div className="flex-1 space-y-3">
                        {result.dimensions.map(d => (
                          <div key={d.name}>
                            <div className="mb-1 flex justify-between text-sm">
                              <span>{d.name}</span>
                              <span className="font-medium">{d.score}%</span>
                            </div>
                            <Progress value={d.score} className="h-2" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle className="text-base">{t("match.keywordTitle")}</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="mb-1.5 text-xs font-medium text-green-600 flex items-center gap-1">
                        <CheckCircle className="h-3.5 w-3.5" /> {t("match.kwMatched")}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {result.keywords.matched.map(k => <Badge key={k} className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">{k}</Badge>)}
                      </div>
                    </div>
                    <div>
                      <p className="mb-1.5 text-xs font-medium text-red-600 flex items-center gap-1">
                        <XCircle className="h-3.5 w-3.5" /> {t("match.kwMissing")}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {result.keywords.missing.map(k => <Badge key={k} variant="destructive" className="text-xs">{k}</Badge>)}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle className="text-base">{t("match.sentenceTitle")}</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    {result.sentenceAnalysis.map((s, i) => (
                      <div key={i} className={`rounded border-l-4 p-3 ${statusBg(s.status)}`}>
                        <div className="flex items-start gap-2">
                          {statusIcon(s.status)}
                          <div className="flex-1">
                            <p className="text-sm font-medium">{s.resumeSentence}</p>
                            {s.relatedRequirement && <p className="mt-1 text-xs text-muted-foreground">{t("match.relatedReq")}{s.relatedRequirement}</p>}
                            <p className="mt-1 text-xs text-muted-foreground">{s.comment}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {result.missingItems.length > 0 && (
                  <Card>
                    <CardHeader><CardTitle className="text-base">{t("match.missingTitle")}</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                      {result.missingItems.map((m, i) => (
                        <div key={i} className="rounded-lg border p-3">
                          <div className="flex items-center gap-2">
                            {importanceBadge(m.importance)}
                            <span className="text-sm font-medium">{m.requirement}</span>
                          </div>
                          <p className="mt-1.5 text-xs text-muted-foreground flex items-center gap-1">
                            <Loader2 className="h-3 w-3" /> {m.suggestion}
                          </p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                <Card className="border-primary/30 bg-primary/5">
                  <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                    <div>
                      <p className="font-medium">{t("match.nextStepTitle")}</p>
                      <p className="text-sm text-muted-foreground">{t("match.nextStepDesc")}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {jobTitle && company && (
                        <MarkAppliedButton
                          jobListingId={jobId}
                          jobTitle={jobTitle}
                          company={company}
                          matchScore={result?.overallScore}
                          size="default"
                        />
                      )}
                      <Button onClick={goToRewrite}>
                        {t("match.toRewrite")} <ArrowRight className="ml-1 h-4 w-4" />
                      </Button>
                    </div>
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

export default MatchPage;
