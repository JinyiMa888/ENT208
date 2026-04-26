import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings, Sparkles, Cpu, Globe, Lock, CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

interface Props {
  triggerClassName?: string;
}

const AI_FUNCTIONS = [
  { key: "analyze-resume", zh: "简历解析", en: "Resume Parsing" },
  { key: "match-resume-job", zh: "简历-岗位匹配", en: "Resume–Job Match" },
  { key: "recommend-jobs", zh: "岗位推荐", en: "Job Recommendation" },
  { key: "rewrite-resume", zh: "简历改写", en: "Resume Rewrite" },
  { key: "interview-coach", zh: "面试辅导", en: "Interview Coach" },
];

const AISettingsDialog = ({ triggerClassName }: Props) => {
  const { lang } = useLanguage();
  const [open, setOpen] = useState(false);
  const isEn = lang === "en";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className={triggerClassName} aria-label="AI Settings">
          <Settings className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {isEn ? "AI Settings" : "AI 设置"}
          </DialogTitle>
          <DialogDescription>
            {isEn
              ? "View the AI provider and model powering this app."
              : "查看本应用使用的 AI 服务商和模型。"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Provider card */}
          <div className="rounded-lg border bg-card p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {isEn ? "AI Provider" : "AI 服务商"}
                </p>
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-primary" />
                  <span className="font-semibold">Lovable AI Gateway</span>
                </div>
              </div>
              <Badge variant="secondary" className="gap-1">
                <CheckCircle2 className="h-3 w-3 text-green-600" />
                {isEn ? "Active" : "已启用"}
              </Badge>
            </div>

            <div className="border-t pt-3 space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {isEn ? "Current Model" : "当前模型"}
              </p>
              <div className="flex items-center gap-2">
                <Cpu className="h-4 w-4 text-primary" />
                <code className="text-sm font-mono bg-muted px-2 py-0.5 rounded">
                  google/gemini-3-flash-preview
                </code>
              </div>
            </div>

            <div className="border-t pt-3 space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {isEn ? "Endpoint" : "API 接入点"}
              </p>
              <code className="block text-xs font-mono bg-muted px-2 py-1.5 rounded break-all">
                https://ai.gateway.lovable.dev/v1/chat/completions
              </code>
            </div>
          </div>

          {/* Functions using AI */}
          <div className="rounded-lg border bg-card p-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
              {isEn ? "AI-Powered Features" : "AI 调用模块"}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {AI_FUNCTIONS.map((fn) => (
                <div key={fn.key} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0" />
                  <span>{isEn ? fn.en : fn.zh}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Security note */}
          <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
            <Lock className="h-4 w-4 mt-0.5 shrink-0" />
            <p>
              {isEn
                ? "All AI requests are routed server-side via secured Edge Functions. Your API keys are never exposed to the browser."
                : "所有 AI 请求均通过后端 Edge Function 安全代理，API 密钥不会暴露在浏览器中。"}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AISettingsDialog;
