import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/hooks/useLanguage";
import { Loader2, History, FileText } from "lucide-react";

interface AnalysisRecord {
  id: string;
  job_title: string;
  company: string | null;
  match_score: number;
  created_at: string;
}

const HistoryPage = () => {
  const [records, setRecords] = useState<AnalysisRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { t, lang } = useLanguage();

  useEffect(() => {
    const fetchRecords = async () => {
      const { data, error } = await supabase
        .from("resume_analyses")
        .select("id, job_title, company, match_score, created_at")
        .order("created_at", { ascending: false });
      if (!error && data) setRecords(data);
      setLoading(false);
    };
    fetchRecords();
  }, []);

  const getScoreBadge = (score: number) => {
    if (score >= 80) return <Badge className="bg-green-100 text-green-700">{t("history.scoreExcellent")} {score}%</Badge>;
    if (score >= 60) return <Badge className="bg-yellow-100 text-yellow-700">{t("history.scoreGood")} {score}%</Badge>;
    return <Badge className="bg-red-100 text-red-700">{t("history.scoreNeedsWork")} {score}%</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-8">
        <h1 className="text-3xl font-bold">{t("history.title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("history.subtitle")}</p>

        <div className="mt-8 space-y-4">
          {records.length === 0 ? (
            <Card className="flex min-h-[300px] items-center justify-center">
              <div className="text-center text-muted-foreground">
                <History className="mx-auto h-16 w-16 opacity-30" />
                <p className="mt-4 text-lg">{t("history.empty")}</p>
                <p className="mt-1 text-sm">{t("history.emptyHint")}</p>
              </div>
            </Card>
          ) : (
            records.map((r) => (
              <Card key={r.id}>
                <CardContent className="flex items-center justify-between p-6">
                  <div className="flex items-center gap-4">
                    <FileText className="h-10 w-10 text-primary" />
                    <div>
                      <h3 className="font-semibold">{r.job_title}</h3>
                      {r.company && <p className="text-sm text-muted-foreground">{r.company}</p>}
                      <p className="text-xs text-muted-foreground">
                        {new Date(r.created_at).toLocaleDateString(lang === "zh" ? "zh-CN" : "en-US", {
                          year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit"
                        })}
                      </p>
                    </div>
                  </div>
                  {getScoreBadge(r.match_score)}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default HistoryPage;
