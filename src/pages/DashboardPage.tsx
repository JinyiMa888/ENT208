import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { BarChart3, FileText, MessageSquare, TrendingUp, Briefcase } from "lucide-react";

const DashboardPage = () => {
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: analysesData } = await supabase
        .from("resume_analyses")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      setAnalyses(analysesData || []);
    } catch {
      // silently fail for unauthenticated users
    } finally {
      setLoading(false);
    }
  };

  const avgScore = analyses.length > 0
    ? Math.round(analyses.reduce((sum, a) => sum + a.match_score, 0) / analyses.length)
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-8">
        <h1 className="text-3xl font-bold">数据看板</h1>
        <p className="mt-2 text-muted-foreground">追踪你的求职进度和优化成果</p>

        {/* Stats */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{analyses.length}</p>
                <p className="text-sm text-muted-foreground">简历分析次数</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{avgScore}%</p>
                <p className="text-sm text-muted-foreground">平均匹配度</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent">
                <Briefcase className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">0</p>
                <p className="text-sm text-muted-foreground">投递岗位</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">0</p>
                <p className="text-sm text-muted-foreground">模拟面试</p>
              </div>
            </CardContent>
          </Card>
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
              <p className="text-center text-muted-foreground py-8">加载中...</p>
            ) : analyses.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">暂无分析记录，去"简历匹配"或"简历改写"页面开始使用吧！</p>
            ) : (
              <div className="space-y-3">
                {analyses.map(a => (
                  <div key={a.id} className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <p className="font-medium">{a.job_title}</p>
                      {a.company && <p className="text-sm text-muted-foreground">{a.company}</p>}
                      <p className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleDateString("zh-CN")}</p>
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

export default DashboardPage;
