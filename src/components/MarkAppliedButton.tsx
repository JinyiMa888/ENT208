import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Send, CheckCircle2, Loader2 } from "lucide-react";

interface Props {
  jobListingId?: string | null;
  jobTitle: string;
  company: string;
  matchScore?: number;
  size?: "sm" | "default";
  variant?: "default" | "outline" | "secondary";
}

const MarkAppliedButton = ({ jobListingId, jobTitle, company, matchScore, size = "sm", variant = "outline" }: Props) => {
  const { user } = useAuth();
  const [applied, setApplied] = useState(false);
  const [loading, setLoading] = useState(false);

  // 检查是否已投递
  useEffect(() => {
    if (!user || !jobTitle || !company) return;
    let q = supabase
      .from("job_applications")
      .select("id")
      .eq("user_id", user.id)
      .eq("job_title", jobTitle)
      .eq("company", company)
      .limit(1);
    if (jobListingId) q = q.eq("job_listing_id", jobListingId);
    q.then(({ data }) => setApplied((data?.length ?? 0) > 0));
  }, [user, jobListingId, jobTitle, company]);

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      toast.error("请先登录后再标记投递");
      return;
    }
    if (applied) return;
    setLoading(true);
    const { error } = await supabase.from("job_applications").insert({
      user_id: user.id,
      job_listing_id: jobListingId || null,
      job_title: jobTitle,
      company,
      match_score: matchScore ?? null,
      status: "applied",
      applied_at: new Date().toISOString(),
    });
    setLoading(false);
    if (error) {
      toast.error("标记失败：" + error.message);
      return;
    }
    setApplied(true);
    toast.success("已记录投递！数据看板会同步更新");
  };

  return (
    <Button
      size={size}
      variant={applied ? "secondary" : variant}
      onClick={handleClick}
      disabled={applied || loading}
    >
      {loading ? (
        <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
      ) : applied ? (
        <CheckCircle2 className="mr-1 h-3.5 w-3.5 text-emerald-500" />
      ) : (
        <Send className="mr-1 h-3.5 w-3.5" />
      )}
      {applied ? "已投递" : "我已投递"}
    </Button>
  );
};

export default MarkAppliedButton;
