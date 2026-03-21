import { Moon, Sun, Globe, Bell, Shield, Download, HelpCircle, LogOut, ChevronRight } from "lucide-react";

export default function SettingsView() {
  const items = [
    { icon: Sun, label: "Erscheinungsbild", desc: "Hell / Dunkel / System" },
    { icon: Globe, label: "Sprache", desc: "Deutsch" },
    { icon: Bell, label: "Benachrichtigungen", desc: "Erinnerungen verwalten" },
    { icon: Shield, label: "Datenschutz & Sicherheit", desc: "Deine Daten schützen" },
    { icon: Download, label: "Datenexport", desc: "CSV, PDF exportieren" },
    { icon: HelpCircle, label: "Hilfe & Support", desc: "FAQ und Kontakt" },
  ];

  return (
    <div className="px-5 pt-3 pb-24">
      <h1 className="text-2xl text-display text-foreground mb-6 animate-fade-up">Einstellungen</h1>

      <div className="space-y-2">
        {items.map((item, i) => (
          <div
            key={item.label}
            className="bg-card rounded-xl p-4 card-shadow flex items-center gap-3.5 active:scale-[0.98] transition-transform cursor-pointer animate-fade-up"
            style={{ animationDelay: `${(i + 1) * 60}ms` }}
          >
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

      <button className="w-full mt-6 h-12 rounded-xl border border-destructive text-destructive font-semibold text-sm active:scale-[0.98] transition-transform animate-fade-up" style={{ animationDelay: "500ms" }}>
        Abmelden
      </button>

      <p className="text-center text-xs text-muted-foreground mt-6 animate-fade-in">TrendFlow v1.0 · Made with ♡</p>
    </div>
  );
}
