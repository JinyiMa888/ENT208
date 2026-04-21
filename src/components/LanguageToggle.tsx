import { Button } from "@/components/ui/button";
import { Languages } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const LanguageToggle = ({ className }: { className?: string }) => {
  const { lang, toggle, t } = useLanguage();
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          onClick={toggle}
          className={className}
          aria-label={t("nav.langTooltip")}
        >
          <Languages className="mr-1 h-4 w-4" />
          <span className="text-xs font-semibold">{lang === "zh" ? "EN" : "中"}</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>{t("nav.langTooltip")}</TooltipContent>
    </Tooltip>
  );
};

export default LanguageToggle;
