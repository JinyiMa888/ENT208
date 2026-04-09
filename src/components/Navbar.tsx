import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FileText, History } from "lucide-react";

const Navbar = () => {
  return (
    <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <FileText className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold text-primary">ResumeBoost</span>
        </Link>

        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/workspace">
              <FileText className="mr-2 h-4 w-4" />
              优化工作台
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/history">
              <History className="mr-2 h-4 w-4" />
              历史记录
            </Link>
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
