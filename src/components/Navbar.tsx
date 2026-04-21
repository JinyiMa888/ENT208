import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Briefcase,
  FileSearch,
  PenTool,
  MessageSquare,
  BarChart3,
  Menu,
  Rocket,
  LogOut,
  User as UserIcon,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import LanguageToggle from "@/components/LanguageToggle";

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { t } = useLanguage();

  const navItems = [
    { to: "/jobs", label: t("nav.jobs"), icon: Briefcase },
    { to: "/match", label: t("nav.match"), icon: FileSearch },
    { to: "/rewrite", label: t("nav.rewrite"), icon: PenTool },
    { to: "/interview", label: t("nav.interview"), icon: MessageSquare },
    { to: "/dashboard", label: t("nav.dashboard"), icon: BarChart3 },
  ];

  const initials = (user?.email?.[0] || "U").toUpperCase();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

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

          {/* Language toggle */}
          <LanguageToggle className="ml-1" />

          {/* Auth */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="ml-2 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{t("nav.loggedIn")}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/dashboard">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    {t("nav.dashboardItem")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  {t("nav.signout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button size="sm" className="ml-2" asChild>
              <Link to="/auth">
                <UserIcon className="mr-1.5 h-4 w-4" />
                {t("nav.signin")}
              </Link>
            </Button>
          )}
        </div>

        {/* Mobile nav */}
        <div className="flex items-center gap-1 md:hidden">
          <LanguageToggle />
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
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
                <div className="mt-4 border-t pt-4">
                  {user ? (
                    <>
                      <p className="px-3 pb-2 text-xs text-muted-foreground truncate">{user.email}</p>
                      <Button variant="ghost" className="w-full justify-start" onClick={() => { setOpen(false); handleSignOut(); }}>
                        <LogOut className="mr-2 h-4 w-4" />
                        {t("nav.signout")}
                      </Button>
                    </>
                  ) : (
                    <Button className="w-full" asChild onClick={() => setOpen(false)}>
                      <Link to="/auth">
                        <UserIcon className="mr-2 h-4 w-4" />
                        {t("nav.signinSignup")}
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
