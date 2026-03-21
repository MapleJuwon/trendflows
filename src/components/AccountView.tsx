import { User, Cloud, Activity, LogOut } from "lucide-react";

export default function AccountView() {
  return (
    <div className="px-5 pt-3 pb-24">
      <h1 className="text-2xl text-display text-foreground mb-6 animate-fade-up">Account</h1>

      <div className="bg-card rounded-2xl p-5 card-shadow mb-5 animate-fade-up" style={{ animationDelay: "80ms" }}>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-accent flex items-center justify-center">
            <User className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-foreground font-semibold">Gast-Nutzer</p>
            <p className="text-sm text-muted-foreground">Erstelle einen Account, um deine Daten zu sichern</p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {[
          { icon: Cloud, label: "Cloud-Synchronisation", desc: "Daten sicher in der Cloud speichern", color: "text-primary" },
          { icon: Activity, label: "Aktivität", desc: "Deine Nutzungsübersicht", color: "text-secondary" },
        ].map((item, i) => (
          <div
            key={item.label}
            className="bg-card rounded-xl p-4 card-shadow flex items-center gap-3.5 active:scale-[0.98] transition-transform cursor-pointer animate-fade-up"
            style={{ animationDelay: `${(i + 2) * 80}ms` }}
          >
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
              <item.icon className={`w-5 h-5 ${item.color}`} />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{item.label}</p>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <button className="w-full mt-6 bg-primary text-primary-foreground h-12 rounded-xl font-semibold text-sm active:scale-[0.98] transition-transform card-shadow animate-fade-up" style={{ animationDelay: "320ms" }}>
        Registrieren / Anmelden
      </button>
    </div>
  );
}
