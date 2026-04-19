import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { BarChart3, FileText, MessageSquare, TrendingUp, Briefcase, Loader2 } from "lucide-react";

interface AnalysisRow {
  id: string;
  job_title: string;
  company: string | null;
  match_score: number;
  created_at: string;
}

const DashboardPage = () => {
  const { user } = useAuth();
  const [analyses, setAnalyses] = useState<AnalysisRow[]>([]);
  const [applicationCount, setApplicationCount] = useState(0);
  const [interviewCount, setInterviewCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user) return;
    const [analysesRes, appsRes, interviewsRes] = await Promise.all([
      supabase
        .from("resume_analyses")
        .select("id, job_title, company, match_score, created_at")
        .order("created_at", { ascending: false })
        .limit(20),
      supabase.from("job_applications").select("id", { count: "exact", head: true }),
      supabase.from("interview_sessions").select("id", { count: "exact", head: true }),
    ]);
    setAnalyses(analysesRes.data || []);
    setApplicationCount(appsRes.count || 0);
    setInterviewCount(interviewsRes.count || 0);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 实时订阅
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`dashboard-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "resume_analyses", filter: `user_id=eq.${user.id}` },
        () => fetchData()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "job_applications", filter: `user_id=eq.${user.id}` },
        () => fetchData()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "interview_sessions", filter: `user_id=eq.${user.id}` },
        () => fetchData()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchData]);

  const avgScore = analyses.length > 0
    ? Math.round(analyses.reduce((sum, a) => sum + a.match_score, 0) / analyses.length)
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">数据看板</h1>
            <p className="mt-2 text-muted-foreground">追踪你的求职进度和优化成果（实时同步）</p>
          </div>
          <Badge variant="outline" className="gap-1">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            实时
          </Badge>
        </div>

        {/* Stats */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={FileText} label="简历分析次数" value={analyses.length} />
          <StatCard icon={TrendingUp} label="平均匹配度" value={`${avgScore}%`} />
          <StatCard icon={Briefcase} label="投递岗位" value={applicationCount} />
          <StatCard icon={MessageSquare} label="模拟面试" value={interviewCount} />
        </div>

        {/* History */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              分析历史记录
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                加载中...
              </div>
            ) : analyses.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                暂无分析记录，去"简历匹配"或"简历改写"页面开始使用吧！
              </p>
            ) : (
              <div className="space-y-3">
                {analyses.map((a) => (
                  <div key={a.id} className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50">
                    <div>
                      <p className="font-medium">{a.job_title}</p>
                      {a.company && <p className="text-sm text-muted-foreground">{a.company}</p>}
                      <p className="text-xs text-muted-foreground">
                        {new Date(a.created_at).toLocaleString("zh-CN")}
                      </p>
                    </div>
                    <Badge variant={a.match_score >= 80 ? "default" : a.match_score >= 60 ? "secondary" : "outline"}>
                      {a.match_score}%
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | number }) => (
  <Card>
    <CardContent className="flex items-center gap-4 p-6">
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </CardContent>
  </Card>
);

export default DashboardPage;
