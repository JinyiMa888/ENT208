import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import Navbar from "@/components/Navbar";
import ResumeUploader from "@/components/ResumeUploader";
import { useResumeStore } from "@/hooks/useResumeText";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MessageSquare, Loader2, Send, Star, Brain, Target, ChevronDown, ChevronUp } from "lucide-react";

interface Question {
  question: string;
  category: string;
  difficulty: string;
  framework?: string;
  sampleAnswer?: string;
  why?: string;
}

interface MockMessage {
  role: "interviewer" | "user";
  content: string;
  score?: number;
  feedback?: string;
}

const InterviewPage = () => {
  const [searchParams] = useSearchParams();
  const [jobTitle, setJobTitle] = useState(searchParams.get("jobTitle") || "");
  const [company, setCompany] = useState(searchParams.get("company") || "");
  const { resumeText } = useResumeStore();

  const [generating, setGenerating] = useState(false);
  const [weaknessQuestions, setWeaknessQuestions] = useState<Question[]>([]);
  const [commonQuestions, setCommonQuestions] = useState<Question[]>([]);
  const [expandedQ, setExpandedQ] = useState<number | null>(null);

  // Evaluate mode
  const [selectedQuestion, setSelectedQuestion] = useState("");
  const [userAnswer, setUserAnswer] = useState("");
  const [evaluating, setEvaluating] = useState(false);
  const [evalResult, setEvalResult] = useState<any>(null);

  // Mock interview mode
  const [mockMessages, setMockMessages] = useState<MockMessage[]>([]);
  const [mockInput, setMockInput] = useState("");
  const [mockLoading, setMockLoading] = useState(false);
  const [mockStarted, setMockStarted] = useState(false);

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

  const startMockInterview = async () => {
    setMockStarted(true);
    setMockMessages([]);
    setMockLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("interview-coach", {
        body: { action: "mock_interview", jobTitle, company, resumeText },
      });
      if (error) throw error;
      setMockMessages([{ role: "interviewer", content: data.response || data.nextQuestion }]);
    } catch (err: any) {
      toast.error(err.message || "启动失败");
    } finally {
      setMockLoading(false);
    }
  };

  const sendMockAnswer = async () => {
    if (!mockInput.trim()) return;
    const newMsgs: MockMessage[] = [...mockMessages, { role: "user", content: mockInput }];
    setMockMessages(newMsgs);
    setMockInput("");
    setMockLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("interview-coach", {
        body: {
          action: "mock_interview",
          jobTitle,
          company,
          resumeText,
          answer: mockInput,
          conversationHistory: newMsgs,
        },
      });
      if (error) throw error;
      const interviewerMsg: MockMessage = {
        role: "interviewer",
        content: data.response || data.nextQuestion,
        score: data.feedbackOnLastAnswer?.score,
        feedback: data.feedbackOnLastAnswer?.brief,
      };
      setMockMessages([...newMsgs, interviewerMsg]);
    } catch (err: any) {
      toast.error(err.message || "发送失败");
    } finally {
      setMockLoading(false);
    }
  };

  const difficultyBadge = (d: string) => {
    if (d === "hard") return <Badge variant="destructive" className="text-xs">困难</Badge>;
    if (d === "medium") return <Badge variant="secondary" className="text-xs">中等</Badge>;
    return <Badge variant="outline" className="text-xs">简单</Badge>;
  };

  const renderQuestionList = (questions: Question[], title: string) => (
    <div>
      <h3 className="mb-3 text-sm font-semibold">{title}</h3>
      <div className="space-y-2">
        {questions.map((q, i) => {
          const key = `${title}-${i}`;
          const isExpanded = expandedQ === i && title.includes(expandedQ >= 0 ? title : "");
          return (
            <div key={key} className="rounded-lg border p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {difficultyBadge(q.difficulty)}
                    <Badge variant="outline" className="text-xs">{q.category}</Badge>
                    {q.framework && <Badge variant="secondary" className="text-xs">{q.framework}</Badge>}
                  </div>
                  <p className="mt-2 text-sm font-medium">{q.question}</p>
                  {q.why && <p className="mt-1 text-xs text-muted-foreground">❓ {q.why}</p>}
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => setExpandedQ(isExpanded ? null : i)}>
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => { setSelectedQuestion(q.question); }}>
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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-8">
        <h1 className="text-3xl font-bold">面试智能辅导</h1>
        <p className="mt-2 text-muted-foreground">AI 预测面试问题、模拟练习、实时评分</p>

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

          <Tabs defaultValue="questions">
            <TabsList>
              <TabsTrigger value="questions">题目预测</TabsTrigger>
              <TabsTrigger value="practice">回答练习</TabsTrigger>
              <TabsTrigger value="mock">模拟面试</TabsTrigger>
            </TabsList>

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
                  {weaknessQuestions.length > 0 && renderQuestionList(weaknessQuestions, "🎯 基于简历薄弱项的追问")}
                  {commonQuestions.length > 0 && renderQuestionList(commonQuestions, "📋 岗位通用高频题")}
                </>
              )}
            </TabsContent>

            <TabsContent value="practice" className="space-y-4">
              <Card>
                <CardContent className="space-y-4 pt-6">
                  <div>
                    <p className="mb-2 text-sm font-medium">选择或输入面试问题</p>
                    <Textarea
                      placeholder="输入面试问题..."
                      value={selectedQuestion}
                      onChange={e => setSelectedQuestion(e.target.value)}
                      rows={2}
                    />
                  </div>
                  <div>
                    <p className="mb-2 text-sm font-medium">你的回答</p>
                    <Textarea
                      placeholder="输入你的回答（建议使用STAR框架）..."
                      value={userAnswer}
                      onChange={e => setUserAnswer(e.target.value)}
                      rows={6}
                    />
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
                        <p className="text-sm font-medium text-green-600">✅ 亮点</p>
                        {evalResult.strengths.map((s: string, i: number) => <p key={i} className="text-xs text-muted-foreground">• {s}</p>)}
                      </div>
                    )}
                    {evalResult.improvements?.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-yellow-600">⚠️ 改进</p>
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

            <TabsContent value="mock">
              {!mockStarted ? (
                <Card className="flex min-h-[400px] items-center justify-center">
                  <div className="text-center">
                    <MessageSquare className="mx-auto h-16 w-16 text-muted-foreground opacity-30" />
                    <p className="mt-4 text-lg font-medium">模拟面试</p>
                    <p className="mt-1 text-sm text-muted-foreground">AI 扮演面试官，逐题提问并评分</p>
                    <Button className="mt-6" onClick={startMockInterview} disabled={mockLoading}>
                      {mockLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      开始模拟面试
                    </Button>
                  </div>
                </Card>
              ) : (
                <Card className="flex flex-col" style={{ minHeight: "500px" }}>
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                      {mockMessages.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[80%] rounded-lg p-3 text-sm ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                            {msg.score !== undefined && (
                              <p className="mt-2 text-xs opacity-80">📊 上一题得分：{msg.score}/100 — {msg.feedback}</p>
                            )}
                          </div>
                        </div>
                      ))}
                      {mockLoading && (
                        <div className="flex justify-start">
                          <div className="rounded-lg bg-muted p-3">
                            <Loader2 className="h-4 w-4 animate-spin" />
                          </div>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                  <div className="border-t p-4">
                    <div className="flex gap-2">
                      <Textarea
                        placeholder="输入你的回答..."
                        value={mockInput}
                        onChange={e => setMockInput(e.target.value)}
                        rows={2}
                        className="flex-1"
                        onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMockAnswer(); } }}
                      />
                      <Button onClick={sendMockAnswer} disabled={mockLoading || !mockInput.trim()}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
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
