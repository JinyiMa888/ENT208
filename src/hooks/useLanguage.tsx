import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type Lang = "zh" | "en";

type Dict = Record<string, { zh: string; en: string }>;

// 集中管理双语文案 — 后续可按需扩充
const dict: Dict = {
  // Navbar
  "nav.jobs": { zh: "岗位推荐", en: "Jobs" },
  "nav.match": { zh: "简历匹配", en: "Match" },
  "nav.rewrite": { zh: "简历改写", en: "Rewrite" },
  "nav.interview": { zh: "面试辅导", en: "Interview" },
  "nav.dashboard": { zh: "数据看板", en: "Dashboard" },
  "nav.signin": { zh: "登录", en: "Sign In" },
  "nav.signinSignup": { zh: "登录 / 注册", en: "Sign In / Up" },
  "nav.signout": { zh: "退出登录", en: "Sign Out" },
  "nav.loggedIn": { zh: "已登录", en: "Signed In" },
  "nav.dashboardItem": { zh: "数据看板", en: "Dashboard" },
  "nav.lang": { zh: "EN", en: "中" },
  "nav.langTooltip": { zh: "切换到英文", en: "Switch to Chinese" },
};

interface LangContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  toggle: () => void;
  t: (key: keyof typeof dict | string) => string;
}

const LangContext = createContext<LangContextType>({
  lang: "zh",
  setLang: () => {},
  toggle: () => {},
  t: (k) => k,
});

const STORAGE_KEY = "matchresume.lang";

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLangState] = useState<Lang>(() => {
    if (typeof window === "undefined") return "zh";
    const saved = localStorage.getItem(STORAGE_KEY) as Lang | null;
    return saved === "en" || saved === "zh" ? saved : "zh";
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, lang);
    document.documentElement.lang = lang === "zh" ? "zh-CN" : "en";
  }, [lang]);

  const setLang = (l: Lang) => setLangState(l);
  const toggle = () => setLangState((p) => (p === "zh" ? "en" : "zh"));
  const t = (key: string) => {
    const entry = dict[key];
    if (!entry) return key;
    return entry[lang];
  };

  return (
    <LangContext.Provider value={{ lang, setLang, toggle, t }}>
      {children}
    </LangContext.Provider>
  );
};

export const useLanguage = () => useContext(LangContext);
