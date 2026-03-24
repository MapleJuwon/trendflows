import { useState } from "react";
import { Sun, Moon, Globe, Bell, Shield, Download, HelpCircle, ChevronRight, Check, Trash2, MessageCircle } from "lucide-react";
import { useI18n, type Lang } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { fetchCollections, deleteAllData } from "@/lib/store";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

type SettingsSheet = null | "appearance" | "language" | "notifications" | "privacy" | "export" | "help";

export default function SettingsView() {
  const { t, lang, setLang } = useI18n();
  const { user, signOut } = useAuth();
  const [openSheet, setOpenSheet] = useState<SettingsSheet>(null);
  const [theme, setTheme] = useState<"light" | "dark" | "system">(() => {
    return (localStorage.getItem("trendflow_theme") as "light" | "dark" | "system") || "light";
  });

  const applyTheme = (mode: "light" | "dark" | "system") => {
    setTheme(mode);
    localStorage.setItem("trendflow_theme", mode);
    const root = document.documentElement;
    if (mode === "dark") {
      root.classList.add("dark");
    } else if (mode === "light") {
      root.classList.remove("dark");
    } else {
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    }
  };

  const handleExport = async () => {
    const collections = await fetchCollections();
    if (!collections.length) { toast.error(t("export.noData")); return; }
    let csv = "Collection,Date,Value,Unit,Note\n";
    collections.forEach(col => {
      col.entries.forEach(e => {
        csv += `"${col.title}","${e.date}",${e.value},"${col.unit}","${e.note || ""}"\n`;
      });
    });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `trendflow_export_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t("export.success"));
    setOpenSheet(null);
  };

  const handleDeleteAllData = async () => {
    if (!window.confirm(t("privacy.deleteConfirm"))) return;
    await deleteAllData();
    window.dispatchEvent(new Event("trendflow-refresh"));
    toast.success(t("privacy.dataDeleted"));
    setOpenSheet(null);
  };

  const items = [
    { icon: Sun, label: t("settings.appearance"), desc: t("settings.appearanceDesc"), sheet: "appearance" as const },
    { icon: Globe, label: t("settings.language"), desc: LANG_LABELS[lang], sheet: "language" as const },
    { icon: Bell, label: t("settings.notifications"), desc: t("settings.notificationsDesc"), sheet: "notifications" as const },
    { icon: Shield, label: t("settings.privacy"), desc: t("settings.privacyDesc"), sheet: "privacy" as const },
    { icon: Download, label: t("settings.export"), desc: t("settings.exportDesc"), sheet: "export" as const },
    { icon: HelpCircle, label: t("settings.help"), desc: t("settings.helpDesc"), sheet: "help" as const },
  ];

  return (
    <div className="px-5 pt-3 pb-24">
      <h1 className="text-2xl text-display text-foreground mb-6 animate-fade-up">{t("settings.title")}</h1>

      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={item.label}
            onClick={() => setOpenSheet(item.sheet)}
            className="bg-card rounded-xl p-4 card-shadow flex items-center gap-3.5 active:scale-[0.98] transition-transform cursor-pointer animate-fade-up"
            style={{ animationDelay: `${(i + 1) * 60}ms` }}>
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
              <item.icon className="w-5 h-5 text-accent-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">{item.label}</p>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </div>
        ))}
      </div>

      {user && (
        <button onClick={() => signOut()}
          className="w-full mt-6 h-12 rounded-xl border border-destructive text-destructive font-semibold text-sm active:scale-[0.98] transition-transform animate-fade-up"
          style={{ animationDelay: "500ms" }}>
          {t("settings.logout")}
        </button>
      )}

      <p className="text-center text-xs text-muted-foreground mt-6 animate-fade-in">{t("settings.version")}</p>

      {/* Appearance Sheet */}
      <Sheet open={openSheet === "appearance"} onOpenChange={(o) => !o && setOpenSheet(null)}>
        <SheetContent side="bottom" className="rounded-t-3xl px-5 pb-10">
          <SheetHeader className="mb-5"><SheetTitle className="text-display text-lg">{t("settings.appearance")}</SheetTitle></SheetHeader>
          <div className="space-y-2">
            {(["light", "dark", "system"] as const).map(mode => (
              <button key={mode} onClick={() => applyTheme(mode)}
                className={`w-full p-4 rounded-xl flex items-center justify-between transition-all active:scale-[0.98] ${theme === mode ? "bg-accent" : "bg-muted"}`}>
                <div className="flex items-center gap-3">
                  {mode === "light" ? <Sun className="w-5 h-5 text-foreground" /> : mode === "dark" ? <Moon className="w-5 h-5 text-foreground" /> : <Sun className="w-5 h-5 text-foreground" />}
                  <span className="text-sm font-medium text-foreground">{t(`appearance.${mode}`)}</span>
                </div>
                {theme === mode && <Check className="w-4 h-4 text-primary" />}
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      {/* Language Sheet */}
      <Sheet open={openSheet === "language"} onOpenChange={(o) => !o && setOpenSheet(null)}>
        <SheetContent side="bottom" className="rounded-t-3xl px-5 pb-10">
          <SheetHeader className="mb-5"><SheetTitle className="text-display text-lg">{t("settings.language")}</SheetTitle></SheetHeader>
          <div className="space-y-2">
            {(["de", "en"] as Lang[]).map(l => (
              <button key={l} onClick={() => { setLang(l); setOpenSheet(null); }}
                className={`w-full p-4 rounded-xl flex items-center justify-between transition-all active:scale-[0.98] ${lang === l ? "bg-accent" : "bg-muted"}`}>
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-foreground" />
                  <span className="text-sm font-medium text-foreground">{t(`language.${l}`)}</span>
                </div>
                {lang === l && <Check className="w-4 h-4 text-primary" />}
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      {/* Notifications Sheet */}
      <Sheet open={openSheet === "notifications"} onOpenChange={(o) => !o && setOpenSheet(null)}>
        <SheetContent side="bottom" className="rounded-t-3xl px-5 pb-10">
          <SheetHeader className="mb-5"><SheetTitle className="text-display text-lg">{t("notifications.title")}</SheetTitle></SheetHeader>
          <div className="space-y-3">
            <NotificationToggle label={t("notifications.daily")} desc={t("notifications.dailyDesc")} storageKey="trendflow_notif_daily" />
            <NotificationToggle label={t("notifications.weekly")} desc={t("notifications.weeklyDesc")} storageKey="trendflow_notif_weekly" />
            <p className="text-xs text-muted-foreground pt-2">{t("notifications.notSupported")}</p>
          </div>
        </SheetContent>
      </Sheet>

      {/* Privacy Sheet */}
      <Sheet open={openSheet === "privacy"} onOpenChange={(o) => !o && setOpenSheet(null)}>
        <SheetContent side="bottom" className="rounded-t-3xl px-5 pb-10">
          <SheetHeader className="mb-5"><SheetTitle className="text-display text-lg">{t("privacy.title")}</SheetTitle></SheetHeader>
          <div className="space-y-3">
            <button onClick={handleDeleteAllData}
              className="w-full p-4 rounded-xl bg-muted flex items-center gap-3 active:scale-[0.98] transition-transform">
              <Trash2 className="w-5 h-5 text-destructive" />
              <div className="text-left">
                <p className="text-sm font-semibold text-foreground">{t("privacy.deleteData")}</p>
                <p className="text-xs text-muted-foreground">{t("privacy.deleteDataDesc")}</p>
              </div>
            </button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Export Sheet */}
      <Sheet open={openSheet === "export"} onOpenChange={(o) => !o && setOpenSheet(null)}>
        <SheetContent side="bottom" className="rounded-t-3xl px-5 pb-10">
          <SheetHeader className="mb-5"><SheetTitle className="text-display text-lg">{t("export.title")}</SheetTitle></SheetHeader>
          <button onClick={handleExport}
            className="w-full p-4 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform card-shadow">
            <Download className="w-4 h-4" />
            {t("export.csv")}
          </button>
          <p className="text-xs text-muted-foreground mt-3 text-center">{t("export.csvDesc")}</p>
        </SheetContent>
      </Sheet>

      {/* Help Sheet */}
      <Sheet open={openSheet === "help"} onOpenChange={(o) => !o && setOpenSheet(null)}>
        <SheetContent side="bottom" className="rounded-t-3xl px-5 pb-10 max-h-[80vh] overflow-y-auto">
          <SheetHeader className="mb-5"><SheetTitle className="text-display text-lg">{t("help.title")}</SheetTitle></SheetHeader>
          <div className="space-y-4">
            <p className="text-sm font-semibold text-foreground">{t("help.faq")}</p>
            {[
              { q: t("help.faq1q"), a: t("help.faq1a") },
              { q: t("help.faq2q"), a: t("help.faq2a") },
              { q: t("help.faq3q"), a: t("help.faq3a") },
            ].map(faq => (
              <div key={faq.q} className="bg-muted rounded-xl p-3.5">
                <p className="text-sm font-medium text-foreground mb-1">{faq.q}</p>
                <p className="text-xs text-muted-foreground">{faq.a}</p>
              </div>
            ))}
            <div className="bg-muted rounded-xl p-3.5 mt-4">
              <div className="flex items-center gap-2 mb-1">
                <MessageCircle className="w-4 h-4 text-primary" />
                <p className="text-sm font-semibold text-foreground">{t("help.contact")}</p>
              </div>
              <p className="text-xs text-muted-foreground">{t("help.contactDesc")}</p>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function NotificationToggle({ label, desc, storageKey }: { label: string; desc: string; storageKey: string }) {
  const [enabled, setEnabled] = useState(() => localStorage.getItem(storageKey) === "true");

  const toggle = () => {
    const next = !enabled;
    setEnabled(next);
    localStorage.setItem(storageKey, String(next));
  };

  return (
    <button onClick={toggle} className="w-full p-4 rounded-xl bg-muted flex items-center justify-between active:scale-[0.98] transition-transform">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <div className={`w-11 h-6 rounded-full transition-colors ${enabled ? "bg-primary" : "bg-border"} flex items-center px-0.5`}>
        <div className={`w-5 h-5 rounded-full bg-card transition-transform ${enabled ? "translate-x-5" : "translate-x-0"}`} />
      </div>
    </button>
  );
}
