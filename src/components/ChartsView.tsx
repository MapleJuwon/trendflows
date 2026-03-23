import { useState, useEffect, useMemo } from "react";
import { getStats, deleteCollection, type DataCollection } from "@/lib/store";
import { useCollections } from "@/hooks/useCollections";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceDot } from "recharts";
import { Plus, CalendarIcon, Trash2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { format } from "date-fns";
import { de, enUS } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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

  const { collections: allCollections, refresh } = useCollections();
  const [activeId, setActiveId] = useState<string | null>(selectedId ?? null);
  const [rangeIdx, setRangeIdx] = useState(1);
  const [showAddEntry, setShowAddEntry] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<DataCollection | null>(null);

  const handleDeleteCollection = async () => {
    if (!deleteTarget) return;
    await deleteCollection(deleteTarget.id);
    toast.success(t("collection.deleted"));
    setDeleteTarget(null);
    if (activeId === deleteTarget.id) setActiveId(null);
    window.dispatchEvent(new Event("trendflow-refresh"));
  };

  useEffect(() => { refresh(); }, [refreshKey]);

  const collections = allCollections.filter(c => !c.archived && c.entries.length > 0);

  useEffect(() => {
    if (!activeId && collections.length > 0) setActiveId(collections[0].id);
  }, [collections]);

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

  const dateLocale = lang === "de" ? de : enUS;
  const chartData = useMemo(() => {
    return filteredEntries
      .map(e => ({
        timestamp: new Date(e.date).getTime(),
        rawDate: e.date,
        value: e.value,
      }))
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [filteredEntries]);

  const selectedEntry = selectedDate
    ? filteredEntries.find(e => e.date === selectedDate.toISOString().split("T")[0])
    : null;
  const selectedChartPoint = selectedDate
    ? chartData.find(d => d.rawDate === selectedDate.toISOString().split("T")[0])
    : null;

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
        <div className="flex items-center gap-2">
          {activeId && (
            <Popover>
              <PopoverTrigger asChild>
                <button className={cn(
                  "h-9 px-3 rounded-lg flex items-center gap-1.5 text-xs font-medium transition-all active:scale-95",
                  selectedDate ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}>
                  <CalendarIcon className="w-3.5 h-3.5" />
                  {selectedDate ? format(selectedDate, "d. MMM", { locale: dateLocale }) : t("charts.pickDate")}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(d) => setSelectedDate(d)}
                  locale={dateLocale}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          )}
           {activeId && (
             <button onClick={() => { const c = collections.find(x => x.id === activeId); if (c) setDeleteTarget(c); }}
               className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center active:scale-95 transition-transform hover:bg-destructive/10">
               <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
             </button>
           )}
           {activeId && (
            <button onClick={() => setShowAddEntry(true)} className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center active:scale-95 transition-transform">
              <Plus className="w-4 h-4 text-primary-foreground" />
            </button>
          )}
        </div>
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
                    <XAxis
                      dataKey="timestamp"
                      type="number"
                      scale="time"
                      domain={["dataMin", "dataMax"]}
                      tickFormatter={(ts: number) => {
                        const range = RANGES[rangeIdx];
                        if (range.days <= 7) return format(new Date(ts), "d. MMM", { locale: dateLocale });
                        if (range.days <= 90) return format(new Date(ts), "d. MMM", { locale: dateLocale });
                        return format(new Date(ts), "MMM yy", { locale: dateLocale });
                      }}
                      tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} domain={["auto", "auto"]} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
                      labelFormatter={(ts: number) => format(new Date(ts), "d. MMMM yyyy", { locale: dateLocale })}
                      formatter={(val: number) => [`${val} ${col.unit}`, col.title]}
                    />
                    {col.goalValue && (
                      <ReferenceLine y={col.goalValue} stroke="hsl(var(--muted-foreground))" strokeDasharray="6 4"
                        label={{ value: `${t("charts.goal")}: ${col.goalValue}`, fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    )}
                    <Area type="monotone" dataKey="value" stroke={col.color} strokeWidth={2.5} fill={`url(#grad-${col.id})`}
                      dot={{ r: 3, fill: col.color, strokeWidth: 0 }} activeDot={{ r: 5, fill: col.color, strokeWidth: 2, stroke: "hsl(var(--card))" }} />
                    {selectedChartPoint && selectedEntry && (
                      <ReferenceDot x={selectedChartPoint.timestamp} y={selectedEntry.value}
                        r={7} fill={col.color} stroke="hsl(var(--card))" strokeWidth={3} />
                    )}
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-center text-muted-foreground text-sm py-10">{t("charts.noRange")}</p>
            )}
          </div>

          {selectedEntry && col && (
            <div className="bg-card rounded-2xl p-4 card-shadow mb-5 animate-fade-up flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">{t("charts.selectedDay")}</p>
                <p className="text-sm font-semibold text-foreground">
                  {format(selectedDate!, "d. MMMM yyyy", { locale: dateLocale })}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-foreground tabular-nums">{selectedEntry.value}</p>
                <p className="text-xs text-muted-foreground">{col.unit}</p>
              </div>
            </div>
          )}

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

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("common.delete")}</DialogTitle>
            <DialogDescription>
              {deleteTarget ? t("collection.deleteConfirm", { name: deleteTarget.title }) : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>{t("common.cancel")}</Button>
            <Button variant="destructive" onClick={handleDeleteCollection}>{t("common.delete")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
