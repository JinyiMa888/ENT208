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
  Award, MessageCircle, Zap, BookOpen
} from "lucide-react";

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
      utterance.lang = "zh-CN";
      utterance.rate = 0.95;
      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();
      synthRef.current.speak(utterance);
    });
  }, []);

  const requestMicPermission = useCallback(async (): Promise<boolean> => {
    try {
      // Check permission status first
      try {
        if (navigator.permissions) {
          const status = await navigator.permissions.query({ name: "microphone" as PermissionName });
          if (status.state === "denied") {
            setMicError("麦克风权限被拒绝，请在浏览器设置中允许麦克风访问");
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
        setMicError("麦克风权限被拒绝，请点击地址栏左侧的锁图标允许麦克风");
      } else if (err.name === "NotFoundError") {
        setMicError("未检测到麦克风设备");
      } else {
        setMicError("无法访问麦克风：" + err.message);
      }
      return false;
    }
  }, []);

  const startListeningForAnswer = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setMicError("浏览器不支持语音识别，请使用 Chrome");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "zh-CN";
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
        setMicError("麦克风权限被拒绝");
      }
    };

    recognition.onend = () => {
      // Don't auto-restart, user controls flow
    };

    recognition.start();
    recognitionRef.current = recognition;
    setMockPhase("listening");
  }, []);

  const generateReport = useCallback(async (history: QARecord[]) => {
    setReportLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("interview-coach", {
        body: {
          action: "generate_report",
          jobTitle, company, resumeText,
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
      toast.error("报告生成失败：" + (err.message || "未知错误"));
    } finally {
      setReportLoading(false);
    }
  }, [jobTitle, company, resumeText]);

  const stopListeningAndSubmit = useCallback(async () => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;

    const answer = finalTranscriptRef.current || currentTranscript;
    if (!answer.trim()) {
      toast.error("未检测到语音内容，请重试");
      setMockPhase("asking");
      return;
    }

    setMockPhase("processing");

    try {
      const newHistory = [...qaHistory, { question: currentQuestion, answer }];
      const { data, error } = await supabase.functions.invoke("interview-coach", {
        body: {
          action: "mock_interview",
          jobTitle, company, resumeText,
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
      if (nextQ && !nextQ.includes("面试结束") && !nextQ.includes("总结")) {
        setCurrentQuestion(nextQ);
        setMockPhase("asking");
        await speakText(nextQ);
      } else {
        setCurrentQuestion("");
        setMockPhase("done");
        toast.success("模拟面试结束，正在生成面试报告...");
        generateReport(updatedHistory);
      }
    } catch (err: any) {
      toast.error(err.message || "处理回答失败");
      setMockPhase("asking");
    }
  }, [qaHistory, currentQuestion, currentTranscript, jobTitle, company, resumeText, speakText, generateReport]);

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
        body: { action: "mock_interview", jobTitle, company, resumeText },
      });
      if (error) throw error;

      const firstQ = data.response || data.nextQuestion;
      setCurrentQuestion(firstQ);
      setMockPhase("asking");
      await speakText(firstQ);
    } catch (err: any) {
      toast.error(err.message || "启动面试失败");
      setMockPhase("idle");
    } finally {
      setMockLoading(false);
    }
  }, [jobTitle, company, resumeText, requestMicPermission, speakText]);

  const skipQuestion = useCallback(async () => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setCurrentTranscript("");
    setMockPhase("processing");

    try {
      const newHistory = [...qaHistory, { question: currentQuestion, answer: "（跳过）" }];
      const { data, error } = await supabase.functions.invoke("interview-coach", {
        body: {
          action: "mock_interview", jobTitle, company, resumeText,
          answer: "我选择跳过这个问题",
          conversationHistory: newHistory.flatMap(qa => [
            { role: "interviewer", content: qa.question },
            { role: "user", content: qa.answer },
          ]),
        },
      });
      if (error) throw error;

      const updatedHistory = [...qaHistory, { question: currentQuestion, answer: "（跳过）" }];
      setQaHistory(updatedHistory);
      setQuestionIndex(prev => prev + 1);

      const nextQ = data.response || data.nextQuestion;
      if (nextQ && !nextQ.includes("面试结束")) {
        setCurrentQuestion(nextQ);
        setMockPhase("asking");
        await speakText(nextQ);
      } else {
        setMockPhase("done");
        generateReport(updatedHistory);
      }
    } catch (err: any) {
      toast.error(err.message || "跳过失败");
      setMockPhase("asking");
    }
  }, [qaHistory, currentQuestion, jobTitle, company, resumeText, speakText, generateReport]);

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
    if (!jobTitle) { toast.error("请输入目标职位"); return; }
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("interview-coach", {
        body: { action: "generate_questions", resumeText, jobTitle, company },
      });
      if (error) throw error;
      setWeaknessQuestions(data.weaknessQuestions || []);
      setCommonQuestions(data.commonQuestions || []);
      toast.success("面试题目生成完成！");
    } catch (err: any) {
      toast.error(err.message || "生成失败");
    } finally {
      setGenerating(false);
    }
  };

  const evaluateAnswer = async () => {
    if (!selectedQuestion || !userAnswer) { toast.error("请选择问题并输入回答"); return; }
    setEvaluating(true);
    setEvalResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("interview-coach", {
        body: { action: "evaluate_answer", question: selectedQuestion, answer: userAnswer, jobTitle, resumeText },
      });
      if (error) throw error;
      setEvalResult(data);
    } catch (err: any) {
      toast.error(err.message || "评估失败");
    } finally {
      setEvaluating(false);
    }
  };

  /* ── Render helpers ── */
  const difficultyBadge = (d: string) => {
    if (d === "hard") return <Badge variant="destructive" className="text-xs">困难</Badge>;
    if (d === "medium") return <Badge variant="secondary" className="text-xs">中等</Badge>;
    return <Badge variant="outline" className="text-xs">简单</Badge>;
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
                    练习
                  </Button>
                </div>
              </div>
              {isExpanded && q.sampleAnswer && (
                <div className="mt-3 rounded bg-accent p-3 text-xs">
                  <p className="font-medium">参考回答框架：</p>
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
        <h1 className="text-3xl font-bold">面试智能辅导</h1>
        <p className="mt-2 text-muted-foreground">AI 预测面试问题、语音模拟练习、实时评分</p>

        <div className="mt-6 grid gap-6 lg:grid-cols-[300px_1fr]">
          <div className="space-y-4">
            <ResumeUploader />
            <Card>
              <CardContent className="space-y-3 pt-6">
                <Input placeholder="目标职位 *" value={jobTitle} onChange={e => setJobTitle(e.target.value)} />
                <Input placeholder="目标公司" value={company} onChange={e => setCompany(e.target.value)} />
                <Button className="w-full" onClick={generateQuestions} disabled={generating}>
                  {generating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />生成中...</> : <><Brain className="mr-2 h-4 w-4" />生成面试题</>}
                </Button>
              </CardContent>
            </Card>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="questions">题目预测</TabsTrigger>
              <TabsTrigger value="practice">回答练习</TabsTrigger>
              <TabsTrigger value="mock">
                <Mic className="mr-1 h-3.5 w-3.5" />语音模拟面试
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
                  {weaknessQuestions.length > 0 && renderQuestionList(weaknessQuestions, "基于简历薄弱项的追问", <Target className="h-4 w-4 text-primary" />)}
                  {commonQuestions.length > 0 && renderQuestionList(commonQuestions, "岗位通用高频题", <Brain className="h-4 w-4 text-primary" />)}
                </>
              )}
            </TabsContent>

            {/* ── Practice Tab ── */}
            <TabsContent value="practice" className="space-y-4">
              <Card>
                <CardContent className="space-y-4 pt-6">
                  <div>
                    <p className="mb-2 text-sm font-medium">选择或输入面试问题</p>
                    <Textarea placeholder="输入面试问题..." value={selectedQuestion} onChange={e => setSelectedQuestion(e.target.value)} rows={2} />
                  </div>
                  <div>
                    <p className="mb-2 text-sm font-medium">你的回答</p>
                    <Textarea placeholder="输入你的回答（建议使用STAR框架）..." value={userAnswer} onChange={e => setUserAnswer(e.target.value)} rows={6} />
                  </div>
                  <Button onClick={evaluateAnswer} disabled={evaluating} className="w-full">
                    {evaluating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />评估中...</> : <><Star className="mr-2 h-4 w-4" />AI 评分</>}
                  </Button>
                </CardContent>
              </Card>
              {evalResult && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <span className="text-2xl font-bold">{evalResult.overallScore}分</span>
                      <span className="text-sm text-muted-foreground">/ 100</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {evalResult.dimensions && Object.entries(evalResult.dimensions).map(([key, val]: [string, any]) => (
                      <div key={key}>
                        <div className="mb-1 flex justify-between text-sm">
                          <span>{key === "keywordCoverage" ? "关键词覆盖" : key === "structureCompleteness" ? "结构完整性" : key === "quantification" ? "成果量化" : "相关性"}</span>
                          <span>{val.score}%</span>
                        </div>
                        <Progress value={val.score} className="h-2" />
                        <p className="mt-1 text-xs text-muted-foreground">{val.feedback}</p>
                      </div>
                    ))}
                    {evalResult.strengths?.length > 0 && (
                      <div>
                        <p className="text-sm font-medium flex items-center gap-1" style={{ color: "hsl(var(--primary))" }}><CheckCircle className="h-3.5 w-3.5" /> 亮点</p>
                        {evalResult.strengths.map((s: string, i: number) => <p key={i} className="text-xs text-muted-foreground">• {s}</p>)}
                      </div>
                    )}
                    {evalResult.improvements?.length > 0 && (
                      <div>
                        <p className="text-sm font-medium flex items-center gap-1 text-amber-600"><AlertTriangle className="h-3.5 w-3.5" /> 改进</p>
                        {evalResult.improvements.map((s: string, i: number) => <p key={i} className="text-xs text-muted-foreground">• {s}</p>)}
                      </div>
                    )}
                    {evalResult.improvedAnswer && (
                      <div className="rounded-lg bg-accent p-3">
                        <p className="mb-1 text-xs font-medium">优化后的回答</p>
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
                    <p className="text-xl font-semibold">语音一问一答模拟面试</p>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                      AI 面试官将逐题提问并朗读问题，你通过麦克风语音作答。<br />
                      每道题回答后 AI 会即时评分，最后生成面试总结。
                    </p>
                    {micError && (
                      <div className="mt-3 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                        {micError}
                      </div>
                    )}
                    <Button className="mt-6" size="lg" onClick={startMockInterview} disabled={mockLoading}>
                      {mockLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mic className="mr-2 h-4 w-4" />}
                      开始面试
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
                        <p className="text-sm text-muted-foreground">正在生成面试表现报告...</p>
                      </div>
                    </Card>
                  ) : interviewReport ? (
                    <>
                      {/* Overall Score Card */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center justify-between">
                            <span className="flex items-center gap-2"><FileText className="h-5 w-5 text-primary" /> 面试表现报告</span>
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
                                  professionalKnowledge: "专业知识",
                                  communication: "沟通表达",
                                  logicalThinking: "逻辑思维",
                                  stressHandling: "抗压应变",
                                  jobFit: "岗位匹配",
                                };
                                return (
                                  <div key={key}>
                                    <div className="mb-1 flex justify-between text-sm">
                                      <span className="font-medium">{labels[key] || key}</span>
                                      <span>{val.score}分</span>
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
                                <p className="text-sm font-semibold flex items-center gap-1 mb-2"><CheckCircle className="h-4 w-4 text-primary" /> 面试亮点</p>
                                {interviewReport.strengths.map((s: string, i: number) => (
                                  <p key={i} className="text-xs text-muted-foreground mb-1">• {s}</p>
                                ))}
                              </div>
                            )}
                            {interviewReport.weaknesses?.length > 0 && (
                              <div className="rounded-lg bg-destructive/5 p-4">
                                <p className="text-sm font-semibold flex items-center gap-1 mb-2"><AlertTriangle className="h-4 w-4 text-destructive" /> 待改进</p>
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
                              <Badge variant={qr.score >= 70 ? "default" : "secondary"} className="shrink-0">{qr.score}分</Badge>
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-1">你的回答</p>
                              <p className="text-sm rounded-lg bg-muted p-3">{qr.userAnswer}</p>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-1">评析</p>
                              <p className="text-sm">{qr.analysis}</p>
                            </div>
                            {expandedReport === i ? (
                              <>
                                <div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-4">
                                  <p className="text-xs font-semibold mb-2 flex items-center gap-1"><Lightbulb className="h-3.5 w-3.5 text-primary" /> 建议回答</p>
                                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{qr.suggestedAnswer}</p>
                                </div>
                                {qr.improvementTips?.length > 0 && (
                                  <div>
                                    <p className="text-xs font-semibold mb-1">改进建议</p>
                                    {qr.improvementTips.map((tip: string, j: number) => (
                                      <p key={j} className="text-xs text-muted-foreground mb-1">• {tip}</p>
                                    ))}
                                  </div>
                                )}
                                <Button size="sm" variant="ghost" onClick={() => setExpandedReport(null)}>
                                  <ChevronUp className="mr-1 h-3.5 w-3.5" /> 收起
                                </Button>
                              </>
                            ) : (
                              <Button size="sm" variant="outline" onClick={() => setExpandedReport(i)}>
                                <ChevronDown className="mr-1 h-3.5 w-3.5" /> 查看建议回答与改进
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
                              <p className="text-sm font-semibold flex items-center gap-1 mb-2"><TrendingUp className="h-4 w-4 text-primary" /> 整体改进建议</p>
                              {interviewReport.overallSuggestions.map((s: string, i: number) => (
                                <p key={i} className="text-sm text-muted-foreground mb-1">{i + 1}. {s}</p>
                              ))}
                            </div>
                          )}
                          {interviewReport.nextSteps?.length > 0 && (
                            <div>
                              <p className="text-sm font-semibold flex items-center gap-1 mb-2"><Award className="h-4 w-4 text-primary" /> 下一步行动</p>
                              {interviewReport.nextSteps.map((s: string, i: number) => (
                                <p key={i} className="text-sm text-muted-foreground mb-1">{i + 1}. {s}</p>
                              ))}
                            </div>
                          )}
                          <Button variant="outline" className="w-full" onClick={resetMockInterview}>
                            <RotateCcw className="mr-2 h-4 w-4" /> 重新开始
                          </Button>
                        </CardContent>
                      </Card>
                    </>
                  ) : (
                    /* Fallback: basic summary if report failed */
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span>面试总结</span>
                          <Badge variant="outline" className="text-lg px-3 py-1">{avgScore} 分</Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {qaHistory.map((qa, i) => (
                          <div key={i} className="rounded-lg border p-4 space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-medium">Q{i + 1}: {qa.question}</p>
                              {qa.score !== undefined && (
                                <Badge variant={qa.score >= 70 ? "default" : "secondary"} className="shrink-0">{qa.score}分</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">A: {qa.answer}</p>
                            {qa.feedback && <p className="text-xs text-muted-foreground italic">{qa.feedback}</p>}
                          </div>
                        ))}
                        <Button variant="outline" className="w-full" onClick={() => generateReport(qaHistory)}>
                          <FileText className="mr-2 h-4 w-4" /> 生成详细报告
                        </Button>
                        <Button variant="ghost" className="w-full" onClick={resetMockInterview}>
                          <RotateCcw className="mr-2 h-4 w-4" /> 重新开始
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
                      <span className="text-sm font-medium">第 {questionIndex + 1} 题</span>
                      {qaHistory.length > 0 && (
                        <span className="text-xs text-muted-foreground">
                          已答 {qaHistory.length} 题 · 平均 {avgScore} 分
                        </span>
                      )}
                    </div>
                    <Button variant="ghost" size="sm" onClick={resetMockInterview}>
                      <StopCircle className="mr-1 h-3.5 w-3.5" /> 结束面试
                    </Button>
                  </div>

                  {/* Question display */}
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6">
                    {/* Interviewer question */}
                    <div className="w-full max-w-2xl">
                      <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">面试官提问</p>
                      <div className="rounded-xl bg-muted p-6">
                        <p className="text-base leading-relaxed">{currentQuestion}</p>
                        <Button size="sm" variant="ghost" className="mt-3 text-xs" onClick={() => speakText(currentQuestion)}>
                          <Volume2 className="mr-1 h-3 w-3" /> 重新朗读
                        </Button>
                      </div>
                    </div>

                    {/* Voice recording area */}
                    {mockPhase === "asking" && (
                      <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">准备好后，点击麦克风开始作答</p>
                        <Button
                          size="lg"
                          className="h-20 w-20 rounded-full"
                          onClick={startListeningForAnswer}
                        >
                          <Mic className="h-8 w-8" />
                        </Button>
                        <div>
                          <Button variant="ghost" size="sm" onClick={skipQuestion}>
                            <SkipForward className="mr-1 h-3.5 w-3.5" /> 跳过此题
                          </Button>
                        </div>
                      </div>
                    )}

                    {mockPhase === "listening" && (
                      <div className="space-y-4 w-full max-w-2xl">
                        {/* Listening indicator */}
                        <div className="flex items-center justify-center gap-2">
                          <div className="h-3 w-3 animate-pulse rounded-full bg-destructive" />
                          <span className="text-sm font-medium text-destructive">正在录音...</span>
                        </div>

                        {/* Live transcript */}
                        <div className="rounded-xl border-2 border-dashed border-primary/30 p-6 min-h-[80px]">
                          {currentTranscript ? (
                            <p className="text-sm leading-relaxed">{currentTranscript}</p>
                          ) : (
                            <p className="text-sm text-muted-foreground">请开始说话，语音内容将实时显示在这里...</p>
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
                        <p className="text-xs text-muted-foreground">说完后点击红色按钮提交回答</p>
                      </div>
                    )}

                    {mockPhase === "processing" && (
                      <div className="space-y-3">
                        <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">AI 正在评估你的回答...</p>
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
                            variant={qa.answer === "（跳过）" ? "outline" : qa.score && qa.score >= 70 ? "default" : "secondary"}
                            className="shrink-0"
                          >
                            Q{i + 1}: {qa.score ? `${qa.score}分` : "跳过"}
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
