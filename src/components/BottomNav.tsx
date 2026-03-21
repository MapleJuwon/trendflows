import { LayoutDashboard, BarChart3, List, User, Settings } from "lucide-react";
import { useI18n } from "@/lib/i18n";

type Tab = "dashboard" | "charts" | "entries" | "account" | "settings";

interface BottomNavProps {
  active: Tab;
  onNavigate: (tab: Tab) => void;
}

export default function BottomNav({ active, onNavigate }: BottomNavProps) {
  const { t } = useI18n();

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "dashboard", label: t("nav.overview"), icon: LayoutDashboard },
    { id: "charts", label: t("nav.charts"), icon: BarChart3 },
    { id: "entries", label: t("nav.entries"), icon: List },
    { id: "account", label: t("nav.account"), icon: User },
    { id: "settings", label: t("nav.settings"), icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border safe-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onNavigate(tab.id)}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors duration-200 active:scale-[0.96] ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Icon className="w-5 h-5" strokeWidth={isActive ? 2.2 : 1.8} />
              <span className={`text-[10px] leading-tight ${isActive ? "font-semibold" : "font-medium"}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export type { Tab };
