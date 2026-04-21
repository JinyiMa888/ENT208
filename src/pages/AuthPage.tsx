import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/useLanguage";
import { Rocket, Loader2 } from "lucide-react";
import LanguageToggle from "@/components/LanguageToggle";

const AuthPage = () => {
  const { user, loading, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { t } = useLanguage();
  const from = (location.state as { from?: string })?.from || "/dashboard";

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate(from, { replace: true });
  }, [user, loading, navigate, from]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      if (mode === "signup") {
        const { error } = await signUp(email, password, fullName);
        if (error) {
          toast({ title: t("auth.signupFailed"), description: error.message, variant: "destructive" });
        } else {
          toast({ title: t("auth.signupSuccess"), description: t("auth.signinIn") });
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          toast({ title: t("auth.signinFailed"), description: t("auth.invalidCreds"), variant: "destructive" });
        } else {
          toast({ title: t("auth.welcomeToast") });
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-muted/30 to-accent/20 px-4 py-12">
      <div className="absolute right-4 top-4">
        <LanguageToggle />
      </div>
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <Link to="/" className="mx-auto mb-4 inline-flex items-center gap-2">
            <Rocket className="h-7 w-7 text-primary" />
            <span className="text-2xl font-bold text-primary">MatchResume</span>
          </Link>
          <CardTitle className="text-2xl">{mode === "signin" ? t("auth.welcomeBack") : t("auth.createAccount")}</CardTitle>
          <CardDescription>
            {mode === "signin" ? t("auth.signinDesc") : t("auth.signupDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={mode} onValueChange={(v) => setMode(v as "signin" | "signup")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">{t("auth.signinTab")}</TabsTrigger>
              <TabsTrigger value="signup">{t("auth.signupTab")}</TabsTrigger>
            </TabsList>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {mode === "signup" && (
                <div className="space-y-2">
                  <Label htmlFor="fullName">{t("auth.fullName")}</Label>
                  <Input
                    id="fullName"
                    placeholder={t("auth.fullNamePlaceholder")}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">{t("auth.email")}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{t("auth.password")}</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder={t("auth.passwordPlaceholder")}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {mode === "signin" ? t("auth.signin") : t("auth.signupBtn")}
              </Button>
            </form>
          </Tabs>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            {t("auth.terms")}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthPage;
