import { useState, useRef } from "react";
import { Sun, Moon, Globe, Bell, Shield, Download, Upload, HelpCircle, ChevronRight, Check, Trash2, MessageCircle, FileText, Image, FileSpreadsheet, Loader2, Clock } from "lucide-react";
import { requestNotificationPermission, canNotify, getReminderHours, setReminderHours } from "@/hooks/useNotifications";
import { useI18n, type Lang, LANG_LABELS } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { fetchCollections, deleteAllData, createCollection, addEntry, COLORS } from "@/lib/store";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";

type SettingsSheet = null | "appearance" | "language" | "notifications" | "privacy" | "export" | "import" | "help";

export default function SettingsView() {
  const { t, lang, setLang } = useI18n();
  const { user, signOut } = useAuth();
  const [openSheet, setOpenSheet] = useState<SettingsSheet>(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [theme, setTheme] = useState<"light" | "dark" | "system">(() => {
    return (localStorage.getItem("trendflow_theme") as "light" | "dark" | "system") || "light";
  });

  const applyTheme = (mode: "light" | "dark" | "system") => {
    setTheme(mode);
    localStorage.setItem("trendflow_theme", mode);
    const root = document.documentElement;
    if (mode === "dark") root.classList.add("dark");
    else if (mode === "light") root.classList.remove("dark");
    else {
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) root.classList.add("dark");
      else root.classList.remove("dark");
    }
  };

  const handleExportCSV = async () => {
    const collections = await fetchCollections();
    if (!collections.length) { toast.error(t("export.noData")); return; }
    let csv = "Collection,Date,Value,Unit,Note\n";
    collections.forEach(col => {
      col.entries.forEach(e => {
        csv += `"${col.title}","${e.date}",${e.value},"${col.unit}","${e.note || ""}"\n`;
      });
    });
    downloadFile(csv, `trendflow_export_${dateStr()}.csv`, "text/csv;charset=utf-8;");
    toast.success(t("export.success"));
    setOpenSheet(null);
  };

  const handleExportPDF = async () => {
    const collections = await fetchCollections();
    if (!collections.length) { toast.error(t("export.noData")); return; }
    
    const { default: jsPDF } = await import("jspdf");
    const doc = new jsPDF();
    let y = 20;
    
    doc.setFontSize(20);
    doc.text("TrendFlow Export", 14, y);
    y += 10;
    doc.setFontSize(10);
    doc.text(new Date().toLocaleDateString(), 14, y);
    y += 15;

    for (const col of collections) {
      if (y > 260) { doc.addPage(); y = 20; }
      doc.setFontSize(14);
      doc.text(`${col.title} (${col.unit})`, 14, y);
      y += 8;
      doc.setFontSize(9);
      doc.text(`${t("charts.count")}: ${col.entries.length}`, 14, y);
      y += 6;

      if (col.entries.length > 0) {
        const vals = col.entries.map(e => e.value);
        const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
        doc.text(`${t("charts.average")}: ${avg.toFixed(2)} | ${t("charts.minimum")}: ${Math.min(...vals)} | ${t("charts.maximum")}: ${Math.max(...vals)}`, 14, y);
        y += 8;

        // Table header
        doc.setFontSize(8);
        doc.setFont(undefined!, "bold");
        doc.text(t("entry.date"), 14, y);
        doc.text(t("entry.value"), 60, y);
        doc.text(t("entry.note"), 90, y);
        doc.setFont(undefined!, "normal");
        y += 5;

        for (const entry of col.entries.slice(-30)) {
          if (y > 280) { doc.addPage(); y = 20; }
          doc.text(entry.date, 14, y);
          doc.text(String(entry.value), 60, y);
          doc.text(entry.note || "-", 90, y);
          y += 4.5;
        }
        if (col.entries.length > 30) {
          doc.text(`... +${col.entries.length - 30} ${t("charts.count").toLowerCase()}`, 14, y);
          y += 5;
        }
      }
      y += 10;
    }

    doc.save(`trendflow_export_${dateStr()}.pdf`);
    toast.success(t("export.success"));
    setOpenSheet(null);
  };

  const handleExportPNG = async () => {
    const chartEl = document.querySelector(".recharts-wrapper") as HTMLElement | null;
    if (!chartEl) {
      toast.error(t("export.noData"));
      return;
    }
    const { default: html2canvas } = await import("html2canvas");
    const canvas = await html2canvas(chartEl, { backgroundColor: null, scale: 2 });
    const link = document.createElement("a");
    link.download = `trendflow_chart_${dateStr()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    toast.success(t("export.success"));
    setOpenSheet(null);
  };

  const handleImport = async (file: File) => {
    setImporting(true);
    try {
      const text = await file.text();
      const collections = await fetchCollections();

      const { data, error } = await supabase.functions.invoke("parse-import", {
        body: {
          fileContent: text.slice(0, 50000),
          existingCollections: collections.map(c => ({ id: c.id, title: c.title, unit: c.unit })),
        },
      });

      if (error) throw error;
      if (!data?.success) {
        toast.error(data?.error || t("import.unreadable"));
        return;
      }

      let imported = 0;
      for (const col of data.collections || []) {
        let colId = col.matchExistingId;
        if (!colId) {
          const existing = collections.find(c => c.title.toLowerCase() === col.title.toLowerCase());
          if (existing) {
            colId = existing.id;
          } else {
            const created = await createCollection(col.title, col.unit, COLORS[collections.length % COLORS.length]);
            if (!created) continue;
            colId = created.id;
          }
        }
        for (const entry of col.entries || []) {
          await addEntry(colId, entry.date, entry.value, entry.note);
          imported++;
        }
      }

      window.dispatchEvent(new Event("trendflow-refresh"));
      toast.success(t("import.success", { n: imported }));
      setOpenSheet(null);
    } catch (err: any) {
      console.error("Import error:", err);
      toast.error(t("import.error"));
    } finally {
      setImporting(false);
    }
  };

  const handleDeleteAllData = async () => {
    if (!window.confirm(t("privacy.deleteConfirm"))) return;
    await deleteAllData();
    window.dispatchEvent(new Event("trendflow-refresh"));
    toast.success(t("privacy.dataDeleted"));
    setOpenSheet(null);
  };

  const dateStr = () => new Date().toISOString().split("T")[0];
  const downloadFile = (content: string, name: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = name; a.click();
    URL.revokeObjectURL(url);
  };

  const items = [
    { icon: Sun, label: t("settings.appearance"), desc: t("settings.appearanceDesc"), sheet: "appearance" as const },
    { icon: Globe, label: t("settings.language"), desc: LANG_LABELS[lang], sheet: "language" as const },
    { icon: Bell, label: t("settings.notifications"), desc: t("settings.notificationsDesc"), sheet: "notifications" as const },
    { icon: Shield, label: t("settings.privacy"), desc: t("settings.privacyDesc"), sheet: "privacy" as const },
    { icon: Download, label: t("settings.export"), desc: t("settings.exportDesc"), sheet: "export" as const },
    { icon: Upload, label: t("settings.import"), desc: t("settings.importDesc"), sheet: "import" as const },
    { icon: HelpCircle, label: t("settings.help"), desc: t("settings.helpDesc"), sheet: "help" as const },
  ];

  return (
    <div className="px-5 pt-3 pb-24">
      <h1 className="text-2xl text-display text-foreground mb-6">{t("settings.title")}</h1>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={item.label} onClick={() => setOpenSheet(item.sheet)}
            className="bg-card rounded-xl p-4 card-shadow flex items-center gap-3.5 active:scale-[0.98] transition-transform cursor-pointer"
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
          className="w-full mt-6 h-12 rounded-xl border border-destructive text-destructive font-semibold text-sm active:scale-[0.98] transition-transform"
         >
          {t("settings.logout")}
        </button>
      )}

      <p className="text-center text-xs text-muted-foreground mt-6 animate-fade-in">{t("settings.version")}</p>

      {/* Appearance */}
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

      {/* Language */}
      <Sheet open={openSheet === "language"} onOpenChange={(o) => !o && setOpenSheet(null)}>
        <SheetContent side="bottom" className="rounded-t-3xl px-5 pb-10">
          <SheetHeader className="mb-5"><SheetTitle className="text-display text-lg">{t("settings.language")}</SheetTitle></SheetHeader>
          <div className="space-y-2">
            {(Object.keys(LANG_LABELS) as Lang[]).map(l => (
              <button key={l} onClick={() => { setLang(l); setOpenSheet(null); }}
                className={`w-full p-4 rounded-xl flex items-center justify-between transition-all active:scale-[0.98] ${lang === l ? "bg-accent" : "bg-muted"}`}>
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-foreground" />
                  <span className="text-sm font-medium text-foreground">{LANG_LABELS[l]}</span>
                </div>
                {lang === l && <Check className="w-4 h-4 text-primary" />}
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      {/* Notifications */}
      <Sheet open={openSheet === "notifications"} onOpenChange={(o) => !o && setOpenSheet(null)}>
        <SheetContent side="bottom" className="rounded-t-3xl px-5 pb-10">
          <SheetHeader className="mb-5"><SheetTitle className="text-display text-lg">{t("notifications.title")}</SheetTitle></SheetHeader>
          <div className="space-y-3">
            <NotificationToggle label={t("notifications.daily")} desc={t("notifications.dailyDesc")} storageKey="trendflow_notif_daily" />
            <NotificationToggle label={t("notifications.goal")} desc={t("notifications.goalDesc")} storageKey="trendflow_notif_goal" />
            <ReminderTimePicker />
            {!("Notification" in window) && (
              <p className="text-xs text-muted-foreground pt-2">{t("notifications.notSupported")}</p>
            )}
            {"Notification" in window && Notification.permission === "denied" && (
              <p className="text-xs text-destructive pt-2">{t("notifications.blocked")}</p>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Privacy */}
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

      {/* Export */}
      <Sheet open={openSheet === "export"} onOpenChange={(o) => !o && setOpenSheet(null)}>
        <SheetContent side="bottom" className="rounded-t-3xl px-5 pb-10">
          <SheetHeader className="mb-5"><SheetTitle className="text-display text-lg">{t("export.title")}</SheetTitle></SheetHeader>
          <div className="space-y-3">
            <button onClick={handleExportCSV}
              className="w-full p-4 rounded-xl bg-muted flex items-center gap-3 active:scale-[0.98] transition-transform">
              <FileSpreadsheet className="w-5 h-5 text-primary" />
              <div className="text-left">
                <p className="text-sm font-semibold text-foreground">{t("export.csv")}</p>
                <p className="text-xs text-muted-foreground">{t("export.csvDesc")}</p>
              </div>
            </button>
            <button onClick={handleExportPDF}
              className="w-full p-4 rounded-xl bg-muted flex items-center gap-3 active:scale-[0.98] transition-transform">
              <FileText className="w-5 h-5 text-primary" />
              <div className="text-left">
                <p className="text-sm font-semibold text-foreground">{t("export.pdf")}</p>
                <p className="text-xs text-muted-foreground">{t("export.pdfDesc")}</p>
              </div>
            </button>
            <button onClick={handleExportPNG}
              className="w-full p-4 rounded-xl bg-muted flex items-center gap-3 active:scale-[0.98] transition-transform">
              <Image className="w-5 h-5 text-primary" />
              <div className="text-left">
                <p className="text-sm font-semibold text-foreground">{t("export.png")}</p>
                <p className="text-xs text-muted-foreground">{t("export.pngDesc")}</p>
              </div>
            </button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Import */}
      <Sheet open={openSheet === "import"} onOpenChange={(o) => !o && setOpenSheet(null)}>
        <SheetContent side="bottom" className="rounded-t-3xl px-5 pb-10">
          <SheetHeader className="mb-5"><SheetTitle className="text-display text-lg">{t("import.title")}</SheetTitle></SheetHeader>
          <input type="file" ref={fileInputRef} accept=".csv,.txt,.tsv" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImport(f); e.target.value = ""; }} />
          <button onClick={() => fileInputRef.current?.click()} disabled={importing}
            className="w-full p-4 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform card-shadow disabled:opacity-50">
            {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {importing ? t("import.processing") : t("import.csv")}
          </button>
          <p className="text-xs text-muted-foreground mt-3 text-center">{t("import.csvDesc")}</p>
        </SheetContent>
      </Sheet>

      {/* Help */}
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
  const toggle = async () => {
    if (!enabled) {
      const granted = await requestNotificationPermission();
      if (!granted) return;
    }
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

function ReminderTimePicker() {
  const { t } = useI18n();
  const [hours, setHours] = useState<number[]>(() => getReminderHours());
  const [adding, setAdding] = useState(false);
  const [newHour, setNewHour] = useState(8);

  const removeHour = (h: number) => {
    const next = hours.filter(x => x !== h);
    if (next.length === 0) return; // keep at least one
    setHours(next);
    setReminderHours(next);
  };

  const addHour = () => {
    if (hours.includes(newHour)) { setAdding(false); return; }
    const next = [...hours, newHour].sort((a, b) => a - b);
    setHours(next);
    setReminderHours(next);
    setAdding(false);
  };

  return (
    <div className="w-full p-4 rounded-xl bg-muted space-y-3">
      <div className="flex items-center gap-3">
        <Clock className="w-4 h-4 text-muted-foreground" />
        <div>
          <p className="text-sm font-medium text-foreground">{t("notifications.reminderTime")}</p>
          <p className="text-xs text-muted-foreground">{t("notifications.reminderTimeDesc")}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {hours.map(h => (
          <span key={h} className="inline-flex items-center gap-1.5 bg-card border border-border rounded-lg px-3 py-1.5 text-sm font-medium text-foreground">
            {String(h).padStart(2, "0")}:00
            {hours.length > 1 && (
              <button onClick={() => removeHour(h)} className="text-muted-foreground hover:text-destructive transition-colors ml-0.5">
                ✕
              </button>
            )}
          </span>
        ))}
        {!adding && (
          <button onClick={() => setAdding(true)}
            className="inline-flex items-center gap-1 bg-primary/10 text-primary rounded-lg px-3 py-1.5 text-sm font-medium hover:bg-primary/20 transition-colors">
            + {t("notifications.addTime") || "Hinzufügen"}
          </button>
        )}
      </div>
      {adding && (
        <div className="flex items-center gap-2">
          <select value={newHour} onChange={e => setNewHour(parseInt(e.target.value, 10))}
            className="bg-card text-foreground text-sm rounded-lg px-2 py-1.5 border border-border focus:outline-none focus:ring-2 focus:ring-ring">
            {Array.from({ length: 24 }, (_, i) => (
              <option key={i} value={i} disabled={hours.includes(i)}>{String(i).padStart(2, "0")}:00</option>
            ))}
          </select>
          <button onClick={addHour} className="bg-primary text-primary-foreground text-sm font-medium rounded-lg px-3 py-1.5">
            <Check className="w-4 h-4" />
          </button>
          <button onClick={() => setAdding(false)} className="text-muted-foreground text-sm px-2 py-1.5">✕</button>
        </div>
      )}
    </div>
  );
}
