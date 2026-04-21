import { useState, useRef, useCallback, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import Navbar from "@/components/Navbar";
import WorkflowSteps from "@/components/WorkflowSteps";
import ResumeUploader from "@/components/ResumeUploader";
import { useResumeStore } from "@/hooks/useResumeText";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Loader2, Star, Brain, Target, ChevronDown, ChevronUp,
  Mic, MicOff, Volume2, Lightbulb, CheckCircle, AlertTriangle,
  StopCircle, SkipForward, RotateCcw, FileText, TrendingUp,
  Award
} from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

/* ── Types ── */
interface Question {
  question: string;
  category: string;
  difficulty: string;
  framework?: string;
  sampleAnswer?: string;
  why?: string;
}

interface QARecord {
  question: string;
  answer: string;
  score?: number;
  feedback?: string;
}

/* ── Component ── */
const InterviewPage = () => {
  const [searchParams] = useSearchParams();
  const { t, lang } = useLanguage();
  const [jobTitle, setJobTitle] = useState(searchParams.get("jobTitle") || "");
  const [company, setCompany] = useState(searchParams.get("company") || "");
  const { resumeText } = useResumeStore();
  const [activeTab, setActiveTab] = useState("questions");

  // Questions tab
  const [generating, setGenerating] = useState(false);
  const [weaknessQuestions, setWeaknessQuestions] = useState<Question[]>([]);
  const [commonQuestions, setCommonQuestions] = useState<Question[]>([]);
  const [expandedQ, setExpandedQ] = useState<number | null>(null);

  // Practice tab
  const [selectedQuestion, setSelectedQuestion] = useState("");
  const [userAnswer, setUserAnswer] = useState("");
  const [evaluating, setEvaluating] = useState(false);
  const [evalResult, setEvalResult] = useState<any>(null);

  // Mock interview (voice Q&A)
  const [mockPhase, setMockPhase] = useState<"idle" | "asking" | "listening" | "processing" | "done">("idle");
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [currentTranscript, setCurrentTranscript] = useState("");
  const [qaHistory, setQaHistory] = useState<QARecord[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [mockLoading, setMockLoading] = useState(false);
  const [micError, setMicError] = useState("");
  const [interviewReport, setInterviewReport] = useState<any>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [expandedReport, setExpandedReport] = useState<number | null>(null);

  // Refs
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef(typeof window !== "undefined" ? window.speechSynthesis : null);
  const finalTranscriptRef = useRef("");

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
      synthRef.current?.cancel();
    };
  }, []);

  /* ── Speech helpers ── */
  const speakText = useCallback((text: string): Promise<void> => {
    return new Promise((resolve) => {
      if (!synthRef.current) { resolve(); return; }
      synthRef.current.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang === "en" ? "en-US" : "zh-CN";
      utterance.rate = 0.95;
      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();
      synthRef.current.speak(utterance);
    });
  }, [lang]);

  const requestMicPermission = useCallback(async (): Promise<boolean> => {
    try {
      // Check permission status first
      try {
        if (navigator.permissions) {
          const status = await navigator.permissions.query({ name: "microphone" as PermissionName });
          if (status.state === "denied") {
            setMicError(t("interview.micDenied"));
            return false;
          }
        }
      } catch { /* Safari doesn't support this query */ }

      // Actually request access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => t.stop()); // release immediately
      setMicError("");
      return true;
    } catch (err: any) {
      if (err.name === "NotAllowedError") {
        setMicError(t("interview.micDenied2"));
      } else if (err.name === "NotFoundError") {
        setMicError(t("interview.micNotFound"));
      } else {
        setMicError(t("interview.micCantAccess") + err.message);
      }
      return false;
    }
  }, [t]);

  const startListeningForAnswer = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setMicError(t("interview.notSupported"));
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = lang === "en" ? "en-US" : "zh-CN";
    recognition.interimResults = true;
    recognition.continuous = true;

    finalTranscriptRef.current = "";

    recognition.onresult = (event: any) => {
      let interim = "";
      let final = "";
      for (let i = 0; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += t;
        } else {
          interim += t;
        }
      }
      finalTranscriptRef.current = final;
      setCurrentTranscript(final + interim);
    };

    recognition.onerror = (e: any) => {
      console.error("Speech recognition error:", e.error);
      if (e.error === "not-allowed") {
        setMicError(t("interview.micDenied"));
      }
    };

    recognition.onend = () => {
      // Don't auto-restart, user controls flow
    };

    recognition.start();
    recognitionRef.current = recognition;
    setMockPhase("listening");
  }, [lang, t]);

  const generateReport = useCallback(async (history: QARecord[]) => {
    setReportLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("interview-coach", {
        body: {
          action: "generate_report",
          jobTitle, company, resumeText, lang,
          conversationHistory: history.map(qa => ({
            question: qa.question,
            answer: qa.answer,
            score: qa.score,
            feedback: qa.feedback,
          })),
        },
      });
      if (error) throw error;
      setInterviewReport(data);
    } catch (err: any) {
      toast.error(t("interview.reportFailed") + (err.message || t("interview.unknownError")));
    } finally {
      setReportLoading(false);
    }
  }, [jobTitle, company, resumeText, lang, t]);

  const stopListeningAndSubmit = useCallback(async () => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;

    const answer = finalTranscriptRef.current || currentTranscript;
    if (!answer.trim()) {
      toast.error(t("interview.noVoice"));
      setMockPhase("asking");
      return;
    }

    setMockPhase("processing");

    try {
      const newHistory = [...qaHistory, { question: currentQuestion, answer }];
      const { data, error } = await supabase.functions.invoke("interview-coach", {
        body: {
          action: "mock_interview",
          jobTitle, company, resumeText, lang,
          answer,
          conversationHistory: newHistory.flatMap(qa => [
            { role: "interviewer", content: qa.question },
            { role: "user", content: qa.answer },
          ]),
        },
      });
      if (error) throw error;

      const record: QARecord = {
        question: currentQuestion,
        answer,
        score: data.feedbackOnLastAnswer?.score,
        feedback: data.feedbackOnLastAnswer?.brief,
      };

      const updatedHistory = [...qaHistory, record];
      setQaHistory(updatedHistory);
      setQuestionIndex(prev => prev + 1);
      setCurrentTranscript("");

      const nextQ = data.response || data.nextQuestion;
      const endMarkers = lang === "en" ? ["interview is over", "interview ended", "summary", "thank you for your time"] : ["面试结束", "总结"];
      const isEnd = nextQ && endMarkers.some(m => nextQ.toLowerCase().includes(m.toLowerCase()));
      if (nextQ && !isEnd) {
        setCurrentQuestion(nextQ);
        setMockPhase("asking");
        await speakText(nextQ);
      } else {
        setCurrentQuestion("");
        setMockPhase("done");
        toast.success(t("interview.mockEnded"));
        generateReport(updatedHistory);
      }
    } catch (err: any) {
      toast.error(err.message || t("interview.processFailed"));
      setMockPhase("asking");
    }
  }, [qaHistory, currentQuestion, currentTranscript, jobTitle, company, resumeText, lang, t, speakText, generateReport]);

  /* ── Mock interview flow ── */
  const startMockInterview = useCallback(async () => {
    const hasPermission = await requestMicPermission();
    if (!hasPermission) return;

    setMockLoading(true);
    setQaHistory([]);
    setQuestionIndex(0);
    setCurrentTranscript("");

    try {
      const { data, error } = await supabase.functions.invoke("interview-coach", {
        body: { action: "mock_interview", jobTitle, company, resumeText, lang },
      });
      if (error) throw error;

      const firstQ = data.response || data.nextQuestion;
      setCurrentQuestion(firstQ);
      setMockPhase("asking");
      await speakText(firstQ);
    } catch (err: any) {
      toast.error(err.message || t("interview.startFailed"));
      setMockPhase("idle");
    } finally {
      setMockLoading(false);
    }
  }, [jobTitle, company, resumeText, lang, t, requestMicPermission, speakText]);

  const skipQuestion = useCallback(async () => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setCurrentTranscript("");
    setMockPhase("processing");

    try {
      const skippedLabel = t("interview.skipped");
      const skippedAnswer = t("interview.skippedAnswer");
      const newHistory = [...qaHistory, { question: currentQuestion, answer: skippedLabel }];
      const { data, error } = await supabase.functions.invoke("interview-coach", {
        body: {
          action: "mock_interview", jobTitle, company, resumeText, lang,
          answer: skippedAnswer,
          conversationHistory: newHistory.flatMap(qa => [
            { role: "interviewer", content: qa.question },
            { role: "user", content: qa.answer },
          ]),
        },
      });
      if (error) throw error;

      const updatedHistory = [...qaHistory, { question: currentQuestion, answer: skippedLabel }];
      setQaHistory(updatedHistory);
      setQuestionIndex(prev => prev + 1);

      const nextQ = data.response || data.nextQuestion;
      const endMarkers = lang === "en" ? ["interview is over", "interview ended"] : ["面试结束"];
      const isEnd = nextQ && endMarkers.some(m => nextQ.toLowerCase().includes(m.toLowerCase()));
      if (nextQ && !isEnd) {
        setCurrentQuestion(nextQ);
        setMockPhase("asking");
        await speakText(nextQ);
      } else {
        setMockPhase("done");
        generateReport(updatedHistory);
      }
    } catch (err: any) {
      toast.error(err.message || t("interview.skipFailed"));
      setMockPhase("asking");
    }
  }, [qaHistory, currentQuestion, jobTitle, company, resumeText, lang, t, speakText, generateReport]);

  const resetMockInterview = useCallback(() => {
    recognitionRef.current?.abort();
    synthRef.current?.cancel();
    setMockPhase("idle");
    setCurrentQuestion("");
    setCurrentTranscript("");
    setQaHistory([]);
    setQuestionIndex(0);
    setMicError("");
    setInterviewReport(null);
  }, []);

  /* ── Questions generation & evaluation ── */
  const generateQuestions = async () => {
    if (!jobTitle) { toast.error(t("interview.titleRequired")); return; }
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("interview-coach", {
        body: { action: "generate_questions", resumeText, jobTitle, company, lang },
      });
      if (error) throw error;
      setWeaknessQuestions(data.weaknessQuestions || []);
      setCommonQuestions(data.commonQuestions || []);
      toast.success(t("interview.generateSuccess"));
    } catch (err: any) {
      toast.error(err.message || t("interview.generateFailed"));
    } finally {
      setGenerating(false);
    }
  };

  const evaluateAnswer = async () => {
    if (!selectedQuestion || !userAnswer) { toast.error(t("interview.evalRequired")); return; }
    setEvaluating(true);
    setEvalResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("interview-coach", {
        body: { action: "evaluate_answer", question: selectedQuestion, answer: userAnswer, jobTitle, resumeText, lang },
      });
      if (error) throw error;
      setEvalResult(data);
    } catch (err: any) {
      toast.error(err.message || t("interview.evalFailed"));
    } finally {
      setEvaluating(false);
    }
  };

  /* ── Render helpers ── */
  const difficultyBadge = (d: string) => {
    if (d === "hard") return <Badge variant="destructive" className="text-xs">{t("interview.diffHard")}</Badge>;
    if (d === "medium") return <Badge variant="secondary" className="text-xs">{t("interview.diffMedium")}</Badge>;
    return <Badge variant="outline" className="text-xs">{t("interview.diffEasy")}</Badge>;
  };

  const renderQuestionList = (questions: Question[], title: string, icon: React.ReactNode) => (
    <div>
      <h3 className="mb-3 text-sm font-semibold flex items-center gap-2">{icon} {title}</h3>
      <div className="space-y-2">
        {questions.map((q, i) => {
          const key = `${title}-${i}`;
          const isExpanded = expandedQ === i;
          return (
            <div key={key} className="rounded-lg border p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {difficultyBadge(q.difficulty)}
                    <Badge variant="outline" className="text-xs">{q.category}</Badge>
                    {q.framework && <Badge variant="secondary" className="text-xs">{q.framework}</Badge>}
                  </div>
                  <p className="mt-2 text-sm font-medium">{q.question}</p>
                  {q.why && (
                    <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
                      <Lightbulb className="h-3 w-3" /> {q.why}
                    </p>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => setExpandedQ(isExpanded ? null : i)}>
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => { setSelectedQuestion(q.question); setActiveTab("practice"); }}>
                    {t("interview.practiceBtn")}
                  </Button>
                </div>
              </div>
              {isExpanded && q.sampleAnswer && (
                <div className="mt-3 rounded bg-accent p-3 text-xs">
                  <p className="font-medium">{t("interview.refAnswer")}</p>
                  <p className="mt-1 whitespace-pre-wrap">{q.sampleAnswer}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  const avgScore = qaHistory.filter(q => q.score).length > 0
    ? Math.round(qaHistory.reduce((sum, q) => sum + (q.score || 0), 0) / qaHistory.filter(q => q.score).length)
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-8">
        <WorkflowSteps />
        <h1 className="text-3xl font-bold">{t("interview.title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("interview.subtitle")}</p>

        <div className="mt-6 grid gap-6 lg:grid-cols-[300px_1fr]">
          <div className="space-y-4">
            <ResumeUploader />
            <Card>
              <CardContent className="space-y-3 pt-6">
                <Input placeholder={t("interview.targetTitle")} value={jobTitle} onChange={e => setJobTitle(e.target.value)} />
                <Input placeholder={t("interview.targetCompany")} value={company} onChange={e => setCompany(e.target.value)} />
                <Button className="w-full" onClick={generateQuestions} disabled={generating}>
                  {generating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t("interview.generating")}</> : <><Brain className="mr-2 h-4 w-4" />{t("interview.generateBtn")}</>}
                </Button>
              </CardContent>
            </Card>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="questions">{t("interview.tabQuestions")}</TabsTrigger>
              <TabsTrigger value="practice">{t("interview.tabPractice")}</TabsTrigger>
              <TabsTrigger value="mock">
                <Mic className="mr-1 h-3.5 w-3.5" />{t("interview.tabMock")}
              </TabsTrigger>
            </TabsList>

            {/* ── Questions Tab ── */}
            <TabsContent value="questions" className="space-y-6">
              {weaknessQuestions.length === 0 && commonQuestions.length === 0 ? (
                <Card className="flex min-h-[300px] items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <Target className="mx-auto h-12 w-12 opacity-30" />
                    <p className="mt-4">点击"生成面试题"开始</p>
                  </div>
                </Card>
              ) : (
                <>
                  {weaknessQuestions.length > 0 && renderQuestionList(weaknessQuestions, t("interview.weaknessTitle"), <Target className="h-4 w-4 text-primary" />)}
                  {commonQuestions.length > 0 && renderQuestionList(commonQuestions, t("interview.commonTitle"), <Brain className="h-4 w-4 text-primary" />)}
                </>
              )}
            </TabsContent>

            {/* ── Practice Tab ── */}
            <TabsContent value="practice" className="space-y-4">
              <Card>
                <CardContent className="space-y-4 pt-6">
                  <div>
                    <p className="mb-2 text-sm font-medium">{t("interview.qSelect")}</p>
                    <Textarea placeholder={t("interview.qPlaceholder")} value={selectedQuestion} onChange={e => setSelectedQuestion(e.target.value)} rows={2} />
                  </div>
                  <div>
                    <p className="mb-2 text-sm font-medium">{t("interview.aLabel")}</p>
                    <Textarea placeholder={t("interview.aPlaceholder")} value={userAnswer} onChange={e => setUserAnswer(e.target.value)} rows={6} />
                  </div>
                  <Button onClick={evaluateAnswer} disabled={evaluating} className="w-full">
                    {evaluating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t("interview.evaluating")}</> : <><Star className="mr-2 h-4 w-4" />{t("interview.aiScore")}</>}
                  </Button>
                </CardContent>
              </Card>
              {evalResult && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <span className="text-2xl font-bold">{evalResult.overallScore}{t("interview.points")}</span>
                      <span className="text-sm text-muted-foreground">/ 100</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {evalResult.dimensions && Object.entries(evalResult.dimensions).map(([key, val]: [string, any]) => (
                      <div key={key}>
                        <div className="mb-1 flex justify-between text-sm">
                          <span>{key === "keywordCoverage" ? t("interview.dimKeyword") : key === "structureCompleteness" ? t("interview.dimStructure") : key === "quantification" ? t("interview.dimQuant") : t("interview.dimRelevance")}</span>
                          <span>{val.score}%</span>
                        </div>
                        <Progress value={val.score} className="h-2" />
                        <p className="mt-1 text-xs text-muted-foreground">{val.feedback}</p>
                      </div>
                    ))}
                    {evalResult.strengths?.length > 0 && (
                      <div>
                        <p className="text-sm font-medium flex items-center gap-1" style={{ color: "hsl(var(--primary))" }}><CheckCircle className="h-3.5 w-3.5" /> {t("interview.strengths")}</p>
                        {evalResult.strengths.map((s: string, i: number) => <p key={i} className="text-xs text-muted-foreground">• {s}</p>)}
                      </div>
                    )}
                    {evalResult.improvements?.length > 0 && (
                      <div>
                        <p className="text-sm font-medium flex items-center gap-1 text-amber-600"><AlertTriangle className="h-3.5 w-3.5" /> {t("interview.improvements")}</p>
                        {evalResult.improvements.map((s: string, i: number) => <p key={i} className="text-xs text-muted-foreground">• {s}</p>)}
                      </div>
                    )}
                    {evalResult.improvedAnswer && (
                      <div className="rounded-lg bg-accent p-3">
                        <p className="mb-1 text-xs font-medium">{t("interview.improvedAnswer")}</p>
                        <p className="whitespace-pre-wrap text-sm">{evalResult.improvedAnswer}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* ── Voice Mock Interview Tab ── */}
            <TabsContent value="mock">
              {mockPhase === "idle" ? (
                <Card className="flex min-h-[400px] items-center justify-center">
                  <div className="text-center max-w-md">
                    <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                      <Mic className="h-10 w-10 text-primary" />
                    </div>
                    <p className="text-xl font-semibold">{t("interview.mockTitle")}</p>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                      {t("interview.mockDesc")}
                    </p>
                    {micError && (
                      <div className="mt-3 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                        {micError}
                      </div>
                    )}
                    <Button className="mt-6" size="lg" onClick={startMockInterview} disabled={mockLoading}>
                      {mockLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mic className="mr-2 h-4 w-4" />}
                      {t("interview.startMock")}
                    </Button>
                  </div>
                </Card>
              ) : mockPhase === "done" ? (
                /* ── Interview Report ── */
                <div className="space-y-6">
                  {reportLoading && !interviewReport ? (
                    <Card className="flex min-h-[300px] items-center justify-center">
                      <div className="text-center space-y-3">
                        <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">{t("interview.reportLoading")}</p>
                      </div>
                    </Card>
                  ) : interviewReport ? (
                    <>
                      {/* Overall Score Card */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center justify-between">
                            <span className="flex items-center gap-2"><FileText className="h-5 w-5 text-primary" /> {t("interview.reportTitle")}</span>
                            <div className="text-right">
                              <span className="text-3xl font-bold">{interviewReport.overallScore}</span>
                              <span className="text-sm text-muted-foreground"> / 100</span>
                            </div>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <p className="text-sm leading-relaxed">{interviewReport.overallComment}</p>

                          {/* Dimension scores */}
                          {interviewReport.dimensions && (
                            <div className="grid gap-3">
                              {Object.entries(interviewReport.dimensions).map(([key, val]: [string, any]) => {
                                const labels: Record<string, string> = {
                                  professionalKnowledge: t("interview.dimProf"),
                                  communication: t("interview.dimComm"),
                                  logicalThinking: t("interview.dimLogic"),
                                  stressHandling: t("interview.dimStress"),
                                  jobFit: t("interview.dimFit"),
                                };
                                return (
                                  <div key={key}>
                                    <div className="mb-1 flex justify-between text-sm">
                                      <span className="font-medium">{labels[key] || key}</span>
                                      <span>{val.score}{t("interview.points")}</span>
                                    </div>
                                    <Progress value={val.score} className="h-2" />
                                    <p className="mt-1 text-xs text-muted-foreground">{val.comment}</p>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Strengths & Weaknesses */}
                          <div className="grid gap-4 sm:grid-cols-2">
                            {interviewReport.strengths?.length > 0 && (
                              <div className="rounded-lg bg-primary/5 p-4">
                                <p className="text-sm font-semibold flex items-center gap-1 mb-2"><CheckCircle className="h-4 w-4 text-primary" /> {t("interview.highlights")}</p>
                                {interviewReport.strengths.map((s: string, i: number) => (
                                  <p key={i} className="text-xs text-muted-foreground mb-1">• {s}</p>
                                ))}
                              </div>
                            )}
                            {interviewReport.weaknesses?.length > 0 && (
                              <div className="rounded-lg bg-destructive/5 p-4">
                                <p className="text-sm font-semibold flex items-center gap-1 mb-2"><AlertTriangle className="h-4 w-4 text-destructive" /> {t("interview.toImprove")}</p>
                                {interviewReport.weaknesses.map((s: string, i: number) => (
                                  <p key={i} className="text-xs text-muted-foreground mb-1">• {s}</p>
                                ))}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>

                      {/* Per-question Reports */}
                      {interviewReport.questionReports?.map((qr: any, i: number) => (
                        <Card key={i}>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-start justify-between gap-2">
                              <span>Q{i + 1}: {qr.question}</span>
                              <Badge variant={qr.score >= 70 ? "default" : "secondary"} className="shrink-0">{qr.score}{t("interview.points")}</Badge>
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-1">{t("interview.yourAnswer")}</p>
                              <p className="text-sm rounded-lg bg-muted p-3">{qr.userAnswer}</p>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-1">{t("interview.analysis")}</p>
                              <p className="text-sm">{qr.analysis}</p>
                            </div>
                            {expandedReport === i ? (
                              <>
                                <div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-4">
                                  <p className="text-xs font-semibold mb-2 flex items-center gap-1"><Lightbulb className="h-3.5 w-3.5 text-primary" /> {t("interview.suggestedAnswer")}</p>
                                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{qr.suggestedAnswer}</p>
                                </div>
                                {qr.improvementTips?.length > 0 && (
                                  <div>
                                    <p className="text-xs font-semibold mb-1">{t("interview.improveTips")}</p>
                                    {qr.improvementTips.map((tip: string, j: number) => (
                                      <p key={j} className="text-xs text-muted-foreground mb-1">• {tip}</p>
                                    ))}
                                  </div>
                                )}
                                <Button size="sm" variant="ghost" onClick={() => setExpandedReport(null)}>
                                  <ChevronUp className="mr-1 h-3.5 w-3.5" /> {t("interview.collapse")}
                                </Button>
                              </>
                            ) : (
                              <Button size="sm" variant="outline" onClick={() => setExpandedReport(i)}>
                                <ChevronDown className="mr-1 h-3.5 w-3.5" /> {t("interview.viewSuggested")}
                              </Button>
                            )}
                          </CardContent>
                        </Card>
                      ))}

                      {/* Overall Suggestions & Next Steps */}
                      <Card>
                        <CardContent className="pt-6 space-y-4">
                          {interviewReport.overallSuggestions?.length > 0 && (
                            <div>
                              <p className="text-sm font-semibold flex items-center gap-1 mb-2"><TrendingUp className="h-4 w-4 text-primary" /> {t("interview.overallSuggestions")}</p>
                              {interviewReport.overallSuggestions.map((s: string, i: number) => (
                                <p key={i} className="text-sm text-muted-foreground mb-1">{i + 1}. {s}</p>
                              ))}
                            </div>
                          )}
                          {interviewReport.nextSteps?.length > 0 && (
                            <div>
                              <p className="text-sm font-semibold flex items-center gap-1 mb-2"><Award className="h-4 w-4 text-primary" /> {t("interview.nextSteps")}</p>
                              {interviewReport.nextSteps.map((s: string, i: number) => (
                                <p key={i} className="text-sm text-muted-foreground mb-1">{i + 1}. {s}</p>
                              ))}
                            </div>
                          )}
                          <Button variant="outline" className="w-full" onClick={resetMockInterview}>
                            <RotateCcw className="mr-2 h-4 w-4" /> {t("interview.restart")}
                          </Button>
                        </CardContent>
                      </Card>
                    </>
                  ) : (
                    /* Fallback: basic summary if report failed */
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span>{t("interview.summary")}</span>
                          <Badge variant="outline" className="text-lg px-3 py-1">{avgScore}{t("interview.points")}</Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {qaHistory.map((qa, i) => (
                          <div key={i} className="rounded-lg border p-4 space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-medium">Q{i + 1}: {qa.question}</p>
                              {qa.score !== undefined && (
                                <Badge variant={qa.score >= 70 ? "default" : "secondary"} className="shrink-0">{qa.score}{t("interview.points")}</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">A: {qa.answer}</p>
                            {qa.feedback && <p className="text-xs text-muted-foreground italic">{qa.feedback}</p>}
                          </div>
                        ))}
                        <Button variant="outline" className="w-full" onClick={() => generateReport(qaHistory)}>
                          <FileText className="mr-2 h-4 w-4" /> {t("interview.generateReport")}
                        </Button>
                        <Button variant="ghost" className="w-full" onClick={resetMockInterview}>
                          <RotateCcw className="mr-2 h-4 w-4" /> {t("interview.restart")}
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </div>
              ) : (
                /* ── Active Interview ── */
                <Card className="min-h-[500px] flex flex-col">
                  {/* Progress bar */}
                  <div className="border-b px-6 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium">{lang === "en" ? `Question ${questionIndex + 1}` : `第 ${questionIndex + 1} 题`}</span>
                      {qaHistory.length > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {lang === "en" ? `Answered ${qaHistory.length} · avg ${avgScore}` : `已答 ${qaHistory.length} 题 · 平均 ${avgScore} 分`}
                        </span>
                      )}
                    </div>
                    <Button variant="ghost" size="sm" onClick={resetMockInterview}>
                      <StopCircle className="mr-1 h-3.5 w-3.5" /> {t("interview.endInterview")}
                    </Button>
                  </div>

                  {/* Question display */}
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6">
                    {/* Interviewer question */}
                    <div className="w-full max-w-2xl">
                      <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">{t("interview.interviewerAsk")}</p>
                      <div className="rounded-xl bg-muted p-6">
                        <p className="text-base leading-relaxed">{currentQuestion}</p>
                        <Button size="sm" variant="ghost" className="mt-3 text-xs" onClick={() => speakText(currentQuestion)}>
                          <Volume2 className="mr-1 h-3 w-3" /> {t("interview.replay")}
                        </Button>
                      </div>
                    </div>

                    {/* Voice recording area */}
                    {mockPhase === "asking" && (
                      <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">{t("interview.readyTip")}</p>
                        <Button
                          size="lg"
                          className="h-20 w-20 rounded-full"
                          onClick={startListeningForAnswer}
                        >
                          <Mic className="h-8 w-8" />
                        </Button>
                        <div>
                          <Button variant="ghost" size="sm" onClick={skipQuestion}>
                            <SkipForward className="mr-1 h-3.5 w-3.5" /> {t("interview.skipQ")}
                          </Button>
                        </div>
                      </div>
                    )}

                    {mockPhase === "listening" && (
                      <div className="space-y-4 w-full max-w-2xl">
                        {/* Listening indicator */}
                        <div className="flex items-center justify-center gap-2">
                          <div className="h-3 w-3 animate-pulse rounded-full bg-destructive" />
                          <span className="text-sm font-medium text-destructive">{t("interview.recording")}</span>
                        </div>

                        {/* Live transcript */}
                        <div className="rounded-xl border-2 border-dashed border-primary/30 p-6 min-h-[80px]">
                          {currentTranscript ? (
                            <p className="text-sm leading-relaxed">{currentTranscript}</p>
                          ) : (
                            <p className="text-sm text-muted-foreground">{t("interview.transcriptHint")}</p>
                          )}
                        </div>

                        {/* Stop button */}
                        <div className="flex items-center justify-center gap-4">
                          <Button
                            size="lg"
                            variant="destructive"
                            className="h-20 w-20 rounded-full"
                            onClick={stopListeningAndSubmit}
                          >
                            <MicOff className="h-8 w-8" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">{t("interview.tapToSubmit")}</p>
                      </div>
                    )}

                    {mockPhase === "processing" && (
                      <div className="space-y-3">
                        <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">{t("interview.aiEvaluating")}</p>
                      </div>
                    )}
                  </div>

                  {/* Previous answers ticker */}
                  {qaHistory.length > 0 && (
                    <div className="border-t px-6 py-3 overflow-x-auto">
                      <div className="flex gap-2">
                        {qaHistory.map((qa, i) => (
                          <Badge
                            key={i}
                            variant={qa.answer === t("interview.skipped") ? "outline" : qa.score && qa.score >= 70 ? "default" : "secondary"}
                            className="shrink-0"
                          >
                            Q{i + 1}: {qa.score ? `${qa.score}${t("interview.points")}` : t("interview.skipped")}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default InterviewPage;
