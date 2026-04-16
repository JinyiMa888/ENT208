import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Navbar from "@/components/Navbar";
import WorkflowSteps from "@/components/WorkflowSteps";
import ResumeUploader from "@/components/ResumeUploader";
import { supabase } from "@/integrations/supabase/client";
import { useResumeStore } from "@/hooks/useResumeText";
import { toast } from "sonner";
import { Building2, MapPin, Banknote, Search, CheckCircle, AlertTriangle, XCircle, Loader2, GraduationCap, Users, Clock, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface JobListing {
  id: string;
  company: string;
  job_title: string;
  industry: string;
  location: string;
  salary_min: number | null;
  salary_max: number | null;
  description: string;
  requirements: string;
  skills: string[];
  experience_years: number;
  education: string;
  company_size: string | null;
  job_type: string;
  matchScore?: number;
  matchReasons?: { matched: string[]; partial: string[]; missing: string[] };
}

const JobsPage = () => {
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<JobListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [industryFilter, setIndustryFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [jobTitleFilter, setJobTitleFilter] = useState("all");
  const [selectedJob, setSelectedJob] = useState<JobListing | null>(null);
  const { resumeText } = useResumeStore();
  const navigate = useNavigate();

  useEffect(() => { fetchJobs(); }, []);

  useEffect(() => {
    let result = jobs;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(j => j.job_title.toLowerCase().includes(term) || j.company.toLowerCase().includes(term));
    }
    if (industryFilter !== "all") result = result.filter(j => j.industry.includes(industryFilter));
    if (locationFilter !== "all") result = result.filter(j => j.location.includes(locationFilter));
    if (jobTitleFilter !== "all") result = result.filter(j => j.job_title.includes(jobTitleFilter));
    setFilteredJobs(result);
  }, [jobs, searchTerm, industryFilter, locationFilter, jobTitleFilter]);

  const fetchJobs = async () => {
    const { data, error } = await supabase.from("job_listings").select("*");
    if (error) { toast.error("加载岗位失败"); return; }
    const parsed = (data || []).map(j => ({
      ...j,
      skills: Array.isArray(j.skills) ? j.skills as string[] : JSON.parse(j.skills as string || "[]"),
    }));
    setJobs(parsed);
    setFilteredJobs(parsed);
    setLoading(false);
  };

  const analyzeMatches = async () => {
    if (!resumeText) { toast.error("请先上传简历"); return; }
    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke("recommend-jobs", { body: { resumeText } });
      if (error) throw error;
      const profile = data?.profile;
      const criteria = data?.matchCriteria;
      if (!criteria) throw new Error("分析失败");

      const scored = jobs.map(job => {
        const jobSkills = job.skills.map(s => s.toLowerCase());
        const mustHave = criteria.mustHaveSkills?.map((s: string) => s.toLowerCase()) || [];
        const niceToHave = criteria.niceToHaveSkills?.map((s: string) => s.toLowerCase()) || [];
        const matched = jobSkills.filter((s: string) => mustHave.some((m: string) => s.includes(m) || m.includes(s)));
        const partial = jobSkills.filter((s: string) => niceToHave.some((n: string) => s.includes(n) || n.includes(s)));
        const missing = mustHave.filter((m: string) => !jobSkills.some((s: string) => s.includes(m) || m.includes(s)));
        const skillScore = (matched.length / Math.max(mustHave.length, 1)) * 60;
        const bonusScore = (partial.length / Math.max(niceToHave.length, 1)) * 20;
        const expMatch = profile?.experienceYears >= job.experience_years ? 20 : 10;
        return {
          ...job,
          matchScore: Math.min(100, Math.round(skillScore + bonusScore + expMatch)),
          matchReasons: { matched, partial, missing },
        };
      });
      scored.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
      setJobs(scored);
      toast.success("匹配分析完成！");
    } catch (err: any) {
      toast.error(err.message || "分析失败");
    } finally {
      setAnalyzing(false);
    }
  };

  const industries = [...new Set(jobs.map(j => j.industry))];
  const locations = [...new Set(jobs.map(j => j.location))];

  // Extract job title keywords for filter
  const jobTitleKeywords = (() => {
    const keywords = new Set<string>();
    jobs.forEach(j => {
      const title = j.job_title;
      const patterns = ["专员", "经理", "主管", "总监", "工程师", "设计师", "分析师", "助理", "顾问", "架构师", "运营", "编辑", "秘书", "会计", "律师", "医生", "教师", "研究员"];
      patterns.forEach(p => { if (title.includes(p)) keywords.add(p); });
    });
    return [...keywords].sort();
  })();

  const jobTypeLabel = (t: string) => {
    const map: Record<string, string> = { "full-time": "全职", "part-time": "兼职", "contract": "合同", "intern": "实习" };
    return map[t] || t;
  };

  const educationLabel = (e: string) => {
    const map: Record<string, string> = { bachelor: "本科", master: "硕士", phd: "博士", associate: "大专", high_school: "高中" };
    return map[e] || e;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-8">
        <WorkflowSteps />
        <h1 className="text-3xl font-bold">岗位智能推荐</h1>
        <p className="mt-2 text-muted-foreground">上传简历，AI 自动匹配最适合你的岗位</p>

        <div className="mt-6 grid gap-6 lg:grid-cols-[300px_1fr]">
          <div className="space-y-4">
            <ResumeUploader />
            <Button className="w-full" onClick={analyzeMatches} disabled={analyzing || !resumeText}>
              {analyzing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />分析中...</> : "AI 智能匹配"}
            </Button>
            <Card>
              <CardHeader><CardTitle className="text-base">筛选条件</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="搜索岗位/公司" className="pl-9" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
                <Select value={industryFilter} onValueChange={setIndustryFilter}>
                  <SelectTrigger><SelectValue placeholder="行业" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部行业</SelectItem>
                    {industries.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={locationFilter} onValueChange={setLocationFilter}>
                  <SelectTrigger><SelectValue placeholder="地点" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部地点</SelectItem>
                    {locations.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={jobTitleFilter} onValueChange={setJobTitleFilter}>
                  <SelectTrigger><SelectValue placeholder="岗位类型" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部岗位</SelectItem>
                    {jobTitleKeywords.map(k => <SelectItem key={k} value={k}>{k}</SelectItem>)}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : filteredJobs.length === 0 ? (
              <Card className="py-20 text-center text-muted-foreground">暂无匹配的岗位</Card>
            ) : (
              filteredJobs.map(job => (
                <Card key={job.id} className="transition-shadow hover:shadow-md cursor-pointer" onClick={() => setSelectedJob(job)}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold">{job.job_title}</h3>
                          {job.matchScore !== undefined && (
                            <Badge variant={job.matchScore >= 80 ? "default" : job.matchScore >= 60 ? "secondary" : "outline"}>
                              匹配 {job.matchScore}%
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-xs">{jobTypeLabel(job.job_type)}</Badge>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1"><Building2 className="h-3.5 w-3.5" />{job.company}</span>
                          <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{job.location}</span>
                          <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{job.experience_years}年+</span>
                          <span className="flex items-center gap-1"><GraduationCap className="h-3.5 w-3.5" />{educationLabel(job.education)}</span>
                          {job.company_size && <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{job.company_size}</span>}
                          {job.salary_min && job.salary_max && (
                            <span className="flex items-center gap-1"><Banknote className="h-3.5 w-3.5" />{job.salary_min / 1000}-{job.salary_max / 1000}K</span>
                          )}
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{job.description}</p>
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {job.skills.slice(0, 6).map(s => <Badge key={s} variant="outline" className="text-xs">{s}</Badge>)}
                          {job.skills.length > 6 && <Badge variant="outline" className="text-xs">+{job.skills.length - 6}</Badge>}
                        </div>

                        {job.matchReasons && (
                          <div className="mt-3 space-y-1.5">
                            {job.matchReasons.matched.length > 0 && (
                              <div className="flex items-start gap-2 text-xs">
                                <CheckCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-green-500" />
                                <span>匹配：{job.matchReasons.matched.join("、")}</span>
                              </div>
                            )}
                            {job.matchReasons.partial.length > 0 && (
                              <div className="flex items-start gap-2 text-xs">
                                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-yellow-500" />
                                <span>相关：{job.matchReasons.partial.join("、")}</span>
                              </div>
                            )}
                            {job.matchReasons.missing.length > 0 && (
                              <div className="flex items-start gap-2 text-xs">
                                <XCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-red-500" />
                                <span>缺失：{job.matchReasons.missing.join("、")}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      {job.matchScore !== undefined && (
                        <div className="flex-shrink-0 text-center">
                          <div className="relative flex h-16 w-16 items-center justify-center">
                            <svg className="-rotate-90" viewBox="0 0 36 36" width="64" height="64">
                              <circle cx="18" cy="18" r="15" fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
                              <circle cx="18" cy="18" r="15" fill="none" stroke="hsl(var(--primary))" strokeWidth="3" strokeDasharray={`${job.matchScore * 0.942} 94.2`} strokeLinecap="round" />
                            </svg>
                            <span className="absolute text-sm font-bold">{job.matchScore}%</span>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="mt-4 flex gap-2" onClick={e => e.stopPropagation()}>
                      <Button size="sm" onClick={() => navigate(`/match?jobId=${job.id}`)}>
                        匹配分析 <ArrowRight className="ml-1 h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => navigate(`/rewrite?jobId=${job.id}`)}>针对性改写</Button>
                      <Button size="sm" variant="outline" onClick={() => navigate(`/interview?jobTitle=${encodeURIComponent(job.job_title)}&company=${encodeURIComponent(job.company)}`)}>面试辅导</Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Job Detail Dialog */}
      <Dialog open={!!selectedJob} onOpenChange={() => setSelectedJob(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedJob && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl">{selectedJob.job_title}</DialogTitle>
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><Building2 className="h-4 w-4" />{selectedJob.company}</span>
                  <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{selectedJob.location}</span>
                  <Badge variant="outline">{jobTypeLabel(selectedJob.job_type)}</Badge>
                  <Badge variant="outline">{selectedJob.industry}</Badge>
                </div>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-lg bg-muted p-3 text-center">
                    <p className="text-xs text-muted-foreground">经验要求</p>
                    <p className="mt-1 text-sm font-semibold">{selectedJob.experience_years}年+</p>
                  </div>
                  <div className="rounded-lg bg-muted p-3 text-center">
                    <p className="text-xs text-muted-foreground">学历要求</p>
                    <p className="mt-1 text-sm font-semibold">{educationLabel(selectedJob.education)}</p>
                  </div>
                  <div className="rounded-lg bg-muted p-3 text-center">
                    <p className="text-xs text-muted-foreground">薪资范围</p>
                    <p className="mt-1 text-sm font-semibold">
                      {selectedJob.salary_min && selectedJob.salary_max
                        ? `${selectedJob.salary_min / 1000}-${selectedJob.salary_max / 1000}K`
                        : "面议"}
                    </p>
                  </div>
                  <div className="rounded-lg bg-muted p-3 text-center">
                    <p className="text-xs text-muted-foreground">公司规模</p>
                    <p className="mt-1 text-sm font-semibold">{selectedJob.company_size || "未知"}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">岗位描述</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedJob.description}</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">任职要求</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedJob.requirements}</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">技能标签</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedJob.skills.map(s => <Badge key={s} variant="secondary">{s}</Badge>)}
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button onClick={() => { setSelectedJob(null); navigate(`/match?jobId=${selectedJob.id}`); }}>
                    匹配分析 <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                  <Button variant="outline" onClick={() => { setSelectedJob(null); navigate(`/rewrite?jobId=${selectedJob.id}`); }}>针对性改写</Button>
                  <Button variant="outline" onClick={() => { setSelectedJob(null); navigate(`/interview?jobTitle=${encodeURIComponent(selectedJob.job_title)}&company=${encodeURIComponent(selectedJob.company)}`); }}>面试辅导</Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default JobsPage;
