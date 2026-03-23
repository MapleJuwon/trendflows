import { useState, useEffect } from "react";
import { Plus, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { getCollections, getStats, type DataCollection } from "@/lib/store";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { useI18n } from "@/lib/i18n";
import AddEntrySheet from "./AddEntrySheet";
import CreateCollectionSheet from "./CreateCollectionSheet";

interface DashboardProps {
  onOpenCollection: (id: string) => void;
  refreshKey: number;
}

export default function Dashboard({ onOpenCollection, refreshKey }: DashboardProps) {
  const { t, lang } = useI18n();
  const [collections, setCollections] = useState<DataCollection[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [quickAddId, setQuickAddId] = useState<string | null>(null);

  useEffect(() => {
    setCollections(getCollections().filter(c => !c.archived));
  }, [refreshKey]);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return t("dashboard.justNow");
    if (diff < 3600000) return t("dashboard.minsAgo", { n: Math.floor(diff / 60000) });
    if (diff < 86400000) return t("dashboard.hoursAgo", { n: Math.floor(diff / 3600000) });
    return d.toLocaleDateString(lang === "de" ? "de-DE" : "en-US", { day: "numeric", month: "short" });
  };

  return (
    <div className="px-5 pt-3 pb-24">
      <div className="flex items-center justify-between mb-6 animate-fade-up">
        <div>
          <h1 className="text-2xl text-display text-foreground leading-tight">{t("dashboard.title")}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t("dashboard.subtitle")}</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="w-10 h-10 rounded-full bg-primary flex items-center justify-center card-shadow active:scale-95 transition-transform"
        >
          <Plus className="w-5 h-5 text-primary-foreground" />
        </button>
      </div>

      {collections.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 animate-fade-up" style={{ animationDelay: "100ms" }}>
          <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center mb-4">
            <Plus className="w-7 h-7 text-primary" />
          </div>
          <p className="text-foreground font-semibold mb-1">{t("dashboard.empty")}</p>
          <p className="text-sm text-muted-foreground text-center max-w-[240px]">{t("dashboard.emptyDesc")}</p>
          <button
            onClick={() => setShowCreate(true)}
            className="mt-5 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold active:scale-95 transition-transform card-shadow"
          >
            {t("dashboard.createCollection")}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {collections.map((col, i) => {
            const stats = getStats(col.entries);
            const chartData = col.entries.slice(-14).map(e => ({ v: e.value }));
            const trend = stats?.trend ?? 0;

            return (
              <div
                key={col.id}
                className="bg-card rounded-2xl p-4 card-shadow active:scale-[0.98] transition-all duration-200 cursor-pointer animate-fade-up"
                style={{ animationDelay: `${(i + 1) * 80}ms` }}
                onClick={() => onOpenCollection(col.id)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: col.color }} />
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">{col.title}</h3>
                      <p className="text-xs text-muted-foreground">{formatDate(col.updatedAt)}</p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setQuickAddId(col.id); }}
                    className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center active:scale-95 transition-transform"
                  >
                    <Plus className="w-4 h-4 text-accent-foreground" />
                  </button>
                </div>

                <div className="flex items-end justify-between">
                  <div>
                    {stats ? (
                      <>
                        <span className="text-2xl font-bold text-foreground tabular-nums">{stats.latest.value}</span>
                        <span className="text-sm text-muted-foreground ml-1">{col.unit}</span>
                        <div className="flex items-center gap-1 mt-0.5">
                          {trend > 0 ? (
                            <TrendingUp className="w-3.5 h-3.5 text-secondary" />
                          ) : trend < 0 ? (
                            <TrendingDown className="w-3.5 h-3.5 text-destructive" />
                          ) : (
                            <Minus className="w-3.5 h-3.5 text-muted-foreground" />
                          )}
                          <span className={`text-xs font-medium ${
                            trend > 0 ? "text-secondary" : trend < 0 ? "text-destructive" : "text-muted-foreground"
                          }`}>
                            {trend > 0 ? "+" : ""}{trend} {col.unit}
                          </span>
                        </div>
                      </>
                    ) : (
                      <span className="text-sm text-muted-foreground">{t("dashboard.noEntries")}</span>
                    )}
                  </div>

                  {chartData.length > 1 && (
                    <div className="w-24 h-10">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <Line type="monotone" dataKey="v" stroke={col.color} strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <CreateCollectionSheet open={showCreate} onOpenChange={setShowCreate} />
      {quickAddId && (
        <AddEntrySheet collectionId={quickAddId} open={!!quickAddId} onOpenChange={(open) => !open && setQuickAddId(null)} />
      )}
    </div>
  );
}
