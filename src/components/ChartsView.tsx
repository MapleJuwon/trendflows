import { useState, useEffect, useMemo } from "react";
import { getCollections, getStats, type DataCollection } from "@/lib/store";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceDot } from "recharts";
import { Plus, CalendarIcon } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { format } from "date-fns";
import { de, enUS } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import AddEntrySheet from "./AddEntrySheet";

interface Props {
  selectedId?: string | null;
  refreshKey: number;
}

export default function ChartsView({ selectedId, refreshKey }: Props) {
  const { t, lang } = useI18n();
  const RANGES = [
    { label: "7T", days: 7 },
    { label: "30T", days: 30 },
    { label: "3M", days: 90 },
    { label: "1J", days: 365 },
    { label: t("charts.all"), days: 0 },
  ];

  const [collections, setCollections] = useState<DataCollection[]>([]);
  const [activeId, setActiveId] = useState<string | null>(selectedId ?? null);
  const [rangeIdx, setRangeIdx] = useState(1);
  const [showAddEntry, setShowAddEntry] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  useEffect(() => {
    const cols = getCollections().filter(c => !c.archived && c.entries.length > 0);
    setCollections(cols);
    if (!activeId && cols.length > 0) setActiveId(cols[0].id);
  }, [refreshKey]);

  useEffect(() => { if (selectedId) setActiveId(selectedId); }, [selectedId]);

  const col = collections.find(c => c.id === activeId);

  const filteredEntries = useMemo(() => {
    if (!col) return [];
    const range = RANGES[rangeIdx];
    if (range.days === 0) return col.entries;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - range.days);
    const cutoffStr = cutoff.toISOString().split("T")[0];
    return col.entries.filter(e => e.date >= cutoffStr);
  }, [col, rangeIdx]);

  const locale = lang === "de" ? "de-DE" : "en-US";
  const chartData = filteredEntries.map(e => ({
    date: new Date(e.date).toLocaleDateString(locale, { day: "numeric", month: "short" }),
    value: e.value,
  }));

  const stats = col ? getStats(filteredEntries) : null;

  if (!collections.length) {
    return (
      <div className="px-5 pt-3 pb-24 flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground text-sm">{t("charts.noData")}</p>
      </div>
    );
  }

  return (
    <div className="px-5 pt-3 pb-24">
      <div className="flex items-center justify-between mb-4 animate-fade-up">
        <h1 className="text-2xl text-display text-foreground">{t("charts.title")}</h1>
        {activeId && (
          <button onClick={() => setShowAddEntry(true)} className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center active:scale-95 transition-transform">
            <Plus className="w-4 h-4 text-primary-foreground" />
          </button>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 animate-fade-up" style={{ animationDelay: "80ms" }}>
        {collections.map(c => (
          <button key={c.id} onClick={() => setActiveId(c.id)}
            className={`flex-shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all active:scale-95 ${activeId === c.id ? "text-primary-foreground card-shadow" : "bg-muted text-muted-foreground"}`}
            style={activeId === c.id ? { backgroundColor: c.color } : {}}>
            {c.title}
          </button>
        ))}
      </div>

      {col && (
        <>
          <div className="flex gap-1 bg-muted rounded-xl p-1 mb-5 animate-fade-up" style={{ animationDelay: "160ms" }}>
            {RANGES.map((r, i) => (
              <button key={r.label} onClick={() => setRangeIdx(i)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${rangeIdx === i ? "bg-card text-foreground card-shadow" : "text-muted-foreground"}`}>
                {r.label}
              </button>
            ))}
          </div>

          <div className="bg-card rounded-2xl p-4 card-shadow mb-5 animate-fade-up" style={{ animationDelay: "240ms" }}>
            {chartData.length > 0 ? (
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: -15 }}>
                    <defs>
                      <linearGradient id={`grad-${col.id}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={col.color} stopOpacity={0.15} />
                        <stop offset="100%" stopColor={col.color} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} domain={["auto", "auto"]} />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
                      formatter={(val: number) => [`${val} ${col.unit}`, col.title]} />
                    {col.goalValue && (
                      <ReferenceLine y={col.goalValue} stroke="hsl(var(--muted-foreground))" strokeDasharray="6 4"
                        label={{ value: `${t("charts.goal")}: ${col.goalValue}`, fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    )}
                    <Area type="monotone" dataKey="value" stroke={col.color} strokeWidth={2.5} fill={`url(#grad-${col.id})`}
                      dot={{ r: 3, fill: col.color, strokeWidth: 0 }} activeDot={{ r: 5, fill: col.color, strokeWidth: 2, stroke: "hsl(var(--card))" }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-center text-muted-foreground text-sm py-10">{t("charts.noRange")}</p>
            )}
          </div>

          {stats && (
            <div className="grid grid-cols-2 gap-3 animate-fade-up" style={{ animationDelay: "320ms" }}>
              {[
                { label: t("charts.average"), value: stats.avg },
                { label: t("charts.minimum"), value: stats.min },
                { label: t("charts.maximum"), value: stats.max },
                { label: t("charts.count"), value: stats.count },
              ].map(s => (
                <div key={s.label} className="bg-card rounded-xl p-3.5 card-shadow">
                  <p className="text-xs text-muted-foreground mb-0.5">{s.label}</p>
                  <p className="text-lg font-bold text-foreground tabular-nums">
                    {s.value} <span className="text-xs font-normal text-muted-foreground">{s.label !== t("charts.count") ? col.unit : ""}</span>
                  </p>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {activeId && (
        <AddEntrySheet collectionId={activeId} open={showAddEntry} onOpenChange={setShowAddEntry} />
      )}
    </div>
  );
}
