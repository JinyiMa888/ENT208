import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import { Briefcase, FileSearch, PenTool, MessageSquare, ArrowRight, CheckCircle, Sparkles } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

const Index = () => {
  const { t } = useLanguage();

  const features = [
    { icon: Briefcase, titleKey: "index.feat1Title", descKey: "index.feat1Desc", link: "/jobs" },
    { icon: FileSearch, titleKey: "index.feat2Title", descKey: "index.feat2Desc", link: "/match" },
    { icon: PenTool, titleKey: "index.feat3Title", descKey: "index.feat3Desc", link: "/rewrite" },
    { icon: MessageSquare, titleKey: "index.feat4Title", descKey: "index.feat4Desc", link: "/interview" },
  ];

  const why = [
    "index.why1", "index.why2", "index.why3", "index.why4", "index.why5", "index.why6"
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden py-24 md:py-32">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-primary/20 blur-[120px]" />
        </div>
        <div className="container relative text-center">
          <div className="mx-auto mb-8 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-5 py-2 text-sm font-medium text-primary">
            <Sparkles className="h-4 w-4" />
            {t("index.heroBadge")}
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            {t("index.heroTitle1")}
          </h1>
          <h1 className="mt-2 bg-gradient-to-r from-primary via-emerald-600 to-teal-500 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl md:text-6xl">
            {t("index.heroTitle2")}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground leading-relaxed">
            {t("index.heroDesc")}
          </p>
          <div className="mt-10">
            <Button size="lg" className="h-14 rounded-full px-10 text-base font-semibold shadow-lg shadow-primary/25" asChild>
              <Link to="/jobs">
                {t("index.cta")} <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <h2 className="text-center text-3xl font-bold">{t("index.flowTitle")}</h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-muted-foreground">{t("index.flowDesc")}</p>

          <div className="mx-auto mt-14 max-w-3xl space-y-6">
            <div className="grid grid-cols-2 gap-8">
              {[1, 2].map((n) => (
                <div key={n} className="flex flex-col items-center text-center rounded-2xl bg-card p-6 shadow-sm border">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">{n}</div>
                  <h3 className="mt-4 text-lg font-semibold">{t(`index.step${n}`)}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{t(`index.step${n}Desc`)}</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-8">
              {[3, 4].map((n) => (
                <div key={n} className="flex flex-col items-center text-center rounded-2xl bg-card p-6 shadow-sm border">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">{n}</div>
                  <h3 className="mt-4 text-lg font-semibold">{t(`index.step${n}`)}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{t(`index.step${n}Desc`)}</p>
                </div>
              ))}
            </div>
            <div className="flex justify-center">
              <div className="flex flex-col items-center text-center rounded-2xl bg-card p-6 shadow-sm border w-full max-w-xs">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">5</div>
                <h3 className="mt-4 text-lg font-semibold">{t("index.step5")}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{t("index.step5Desc")}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="container">
          <h2 className="text-center text-3xl font-bold">{t("index.featuresTitle")}</h2>
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {features.map((f, i) => (
              <Card key={i} className="group transition-all hover:shadow-lg hover:-translate-y-1">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent">
                      <f.icon className="h-6 w-6 text-accent-foreground" />
                    </div>
                    <CardTitle className="text-xl">{t(f.titleKey)}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{t(f.descKey)}</p>
                  <Button variant="link" className="mt-4 p-0" asChild>
                    <Link to={f.link}>
                      {t("index.useNow")} <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Highlights */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <h2 className="text-center text-3xl font-bold">{t("index.whyTitle")}</h2>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {why.map((key, i) => (
              <div key={i} className="flex items-start gap-3 rounded-xl border bg-card p-5 transition-shadow hover:shadow-md">
                <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                <span className="text-sm">{t(key)}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container">
          <div className="mx-auto max-w-2xl rounded-3xl bg-primary px-8 py-14 text-center shadow-xl shadow-primary/20">
            <h2 className="text-3xl font-bold text-primary-foreground">{t("index.ctaTitle")}</h2>
            <p className="mx-auto mt-4 max-w-lg text-primary-foreground/80">{t("index.ctaDesc")}</p>
            <Button size="lg" variant="secondary" className="mt-8 rounded-full px-8" asChild>
              <Link to="/jobs">{t("index.cta")}</Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t py-8">
        <div className="container text-center text-sm text-muted-foreground">
          {t("index.footer")}
        </div>
      </footer>
    </div>
  );
};

export default Index;
