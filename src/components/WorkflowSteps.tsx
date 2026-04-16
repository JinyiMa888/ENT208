import { useLocation, Link } from "react-router-dom";
import { Briefcase, FileSearch, PenTool, MessageSquare, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const steps = [
  { path: "/jobs", label: "岗位推荐", icon: Briefcase, step: 1 },
  { path: "/match", label: "简历匹配", icon: FileSearch, step: 2 },
  { path: "/rewrite", label: "简历改写", icon: PenTool, step: 3 },
  { path: "/interview", label: "面试辅导", icon: MessageSquare, step: 4 },
];

const WorkflowSteps = () => {
  const location = useLocation();
  const currentIdx = steps.findIndex(s => location.pathname.startsWith(s.path));

  return (
    <div className="mb-6 flex items-center justify-center gap-1 overflow-x-auto rounded-xl border bg-card p-3">
      {steps.map((s, i) => {
        const isActive = i === currentIdx;
        const isDone = i < currentIdx;
        return (
          <div key={s.path} className="flex items-center">
            <Link
              to={s.path}
              className={cn(
                "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                isActive && "bg-primary text-primary-foreground",
                isDone && "text-primary",
                !isActive && !isDone && "text-muted-foreground hover:text-foreground"
              )}
            >
              <div
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold",
                  isActive && "bg-primary-foreground text-primary",
                  isDone && "bg-primary/10 text-primary",
                  !isActive && !isDone && "bg-muted text-muted-foreground"
                )}
              >
                {s.step}
              </div>
              <span className="hidden sm:inline">{s.label}</span>
            </Link>
            {i < steps.length - 1 && (
              <ChevronRight className="mx-1 h-4 w-4 flex-shrink-0 text-muted-foreground/50" />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default WorkflowSteps;
