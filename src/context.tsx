import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Language, Theme } from "./lib/types";
import { t as translate, translations, type TranslationKey } from "./lib/i18n";

type AppContextType = {
  lang: Language;
  setLang: (l: Language) => void;
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggleLang: () => void;
  toggleTheme: () => void;
  t: (key: TranslationKey) => string;
  dir: "rtl" | "ltr";
  toast: (type: "success" | "error" | "info", message: string) => void;
};

const AppContext = createContext<AppContextType | null>(null);

type ToastItem = { id: number; type: "success" | "error" | "info"; message: string };

export function AppProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(() => {
    const saved = localStorage.getItem("tagog-lang");
    return saved === "ar" || saved === "fr" ? saved : "fr";
  });
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem("tagog-theme");
    return saved === "dark" || saved === "light" ? saved : "dark";
  });
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dir = translations[lang]._dir as "rtl" | "ltr";

  useEffect(() => {
    document.documentElement.dir = dir;
    document.documentElement.lang = lang;
    localStorage.setItem("tagog-lang", lang);
  }, [lang, dir]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("tagog-theme", theme);
  }, [theme]);

  const setLang = (l: Language) => setLangState(l);
  const setTheme = (th: Theme) => setThemeState(th);
  const toggleLang = () => setLangState((p) => (p === "fr" ? "ar" : "fr"));
  const toggleTheme = () => setThemeState((p) => (p === "dark" ? "light" : "dark"));

  const toast = (type: "success" | "error" | "info", message: string) => {
    const id = Date.now() + Math.random();
    setToasts((p) => [...p, { id, type, message }]);
    setTimeout(() => setToasts((p) => p.filter((x) => x.id !== id)), 3000);
  };

  const t = (key: TranslationKey) => translate(lang, key);

  return (
    <AppContext.Provider value={{ lang, setLang, theme, setTheme, toggleLang, toggleTheme, t, dir, toast }}>
      {children}
      <div className="toast-container">
        {toasts.map((tt) => (
          <div key={tt.id} className={`toast ${tt.type}`}>
            {tt.message}
          </div>
        ))}
      </div>
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
