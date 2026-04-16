import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Briefcase, FileSearch, PenTool, MessageSquare, BarChart3, Menu, Rocket } from "lucide-react";
import { useState } from "react";

const navItems = [
  { to: "/jobs", label: "岗位推荐", icon: Briefcase },
  { to: "/match", label: "简历匹配", icon: FileSearch },
  { to: "/rewrite", label: "简历改写", icon: PenTool },
  { to: "/interview", label: "面试辅导", icon: MessageSquare },
  { to: "/dashboard", label: "数据看板", icon: BarChart3 },
];

const Navbar = () => {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <Rocket className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold text-primary">MatchResume</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <Button
              key={item.to}
              variant={location.pathname === item.to ? "default" : "ghost"}
              size="sm"
              asChild
            >
              <Link to={item.to}>
                <item.icon className="mr-1.5 h-4 w-4" />
                {item.label}
              </Link>
            </Button>
          ))}
        </div>

        {/* Mobile nav */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-64">
            <div className="mt-8 flex flex-col gap-2">
              {navItems.map((item) => (
                <Button
                  key={item.to}
                  variant={location.pathname === item.to ? "default" : "ghost"}
                  className="justify-start"
                  asChild
                  onClick={() => setOpen(false)}
                >
                  <Link to={item.to}>
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.label}
                  </Link>
                </Button>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
};

export default Navbar;
