import { useState, useEffect, useMemo } from "react";
import { getStats, type DataCollection } from "@/lib/store";
import { useCollections } from "@/hooks/useCollections";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceDot, Line, ComposedChart } from "recharts";
import { Plus, CalendarIcon, TrendingUp, GitCompareArrows } from "lucide-react";
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

// Linear regression: returns { slope, intercept } for y = slope*x + intercept
function linearRegression(points: { x: number; y: number }[]) {
  const n = points.length;
  if (n < 2) return null;
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  for (const p of points) {
    sumX += p.x;
    sumY += p.y;
    sumXY += p.x * p.y;
    sumXX += p.x * p.x;
  }
  const denom = n * sumXX - sumX * sumX;
  if (denom === 0) return null;
  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}

const DAY_MS = 86400000;

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
  const [showTrend, setShowTrend] = useState(false);
  const [compareId, setCompareId] = useState<string | null>(null);

  useEffect(() => { if (refreshKey > 0) refresh(); }, [refreshKey]);

  const collections = allCollections.filter(c => !c.archived && c.entries.length > 0);

  useEffect(() => {
    if (!activeId && collections.length > 0) setActiveId(collections[0].id);
  }, [collections]);

  useEffect(() => { if (selectedId) setActiveId(selectedId); }, [selectedId]);

  const col = collections.find(c => c.id === activeId);
  const compareCol = compareId ? collections.find(c => c.id === compareId) : null;

  const filterEntries = (collection: DataCollection | undefined) => {
    if (!collection) return [];
    const range = RANGES[rangeIdx];
    if (range.days === 0) return collection.entries;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - range.days);
    const cutoffStr = cutoff.toISOString().split("T")[0];
    return collection.entries.filter(e => e.date >= cutoffStr);
  };

  const filteredEntries = useMemo(() => filterEntries(col), [col, rangeIdx]);
  const compareEntries = useMemo(() => filterEntries(compareCol), [compareCol, rangeIdx]);

  const dateLocale = lang === "de" ? de : enUS;

  const chartData = useMemo(() => {
    const mainData = filteredEntries.map(e => ({
      timestamp: new Date(e.date).getTime(),
      rawDate: e.date,
      value: e.value,
    })).sort((a, b) => a.timestamp - b.timestamp);

    // Merge compare data
    if (compareCol && compareEntries.length > 0) {
      const compareMap = new Map<number, number>();
      for (const e of compareEntries) {
        compareMap.set(new Date(e.date).getTime(), e.value);
      }
      // Add compare values to existing points and add new points
      const allTimestamps = new Set(mainData.map(d => d.timestamp));
      for (const e of compareEntries) {
        const ts = new Date(e.date).getTime();
        if (!allTimestamps.has(ts)) {
          mainData.push({ timestamp: ts, rawDate: e.date, value: undefined as any });
          allTimestamps.add(ts);
        }
      }
      mainData.sort((a, b) => a.timestamp - b.timestamp);
      return mainData.map(d => ({
        ...d,
        compareValue: compareMap.get(d.timestamp) ?? undefined,
      }));
    }

    return mainData.map(d => ({ ...d, compareValue: undefined as number | undefined }));
  }, [filteredEntries, compareEntries, compareCol]);

  // Trend & forecast calculation
  const trendData = useMemo(() => {
    if (!showTrend || chartData.length < 2) return { trendLine: [], forecastLine: [], reg: null };
    
    const validPoints = chartData.filter(d => d.value !== undefined);
    if (validPoints.length < 2) return { trendLine: [], forecastLine: [], reg: null };

    const minTs = validPoints[0].timestamp;
    const points = validPoints.map(d => ({ x: (d.timestamp - minTs) / DAY_MS, y: d.value }));
    const reg = linearRegression(points);
    if (!reg) return { trendLine: [], forecastLine: [], reg: null };

    // Trend line over existing data range
    const trendLine = validPoints.map(d => ({
      timestamp: d.timestamp,
      trend: reg.slope * ((d.timestamp - minTs) / DAY_MS) + reg.intercept,
    }));

    // Forecast: extend 30% of the data range into the future, min 7 days
    const lastTs = validPoints[validPoints.length - 1].timestamp;
    const dataSpanDays = (lastTs - minTs) / DAY_MS;
    const forecastDays = Math.max(7, Math.round(dataSpanDays * 0.3));
    const forecastLine: { timestamp: number; forecast: number }[] = [];
    // Start from last data point
    forecastLine.push({ timestamp: lastTs, forecast: reg.slope * ((lastTs - minTs) / DAY_MS) + reg.intercept });
    for (let i = 1; i <= forecastDays; i++) {
      const ts = lastTs + i * DAY_MS;
      forecastLine.push({
        timestamp: ts,
        forecast: reg.slope * ((ts - minTs) / DAY_MS) + reg.intercept,
      });
    }

    return { trendLine, forecastLine, reg, forecastDays, slopePerDay: reg.slope };
  }, [showTrend, chartData]);

  // Merge trend & forecast into chart data for ComposedChart
  const mergedChartData = useMemo(() => {
    if (!showTrend) return chartData;

    const map = new Map<number, any>();
    for (const d of chartData) {
      map.set(d.timestamp, { ...d });
    }
    for (const d of trendData.trendLine) {
      if (map.has(d.timestamp)) {
        map.get(d.timestamp).trend = d.trend;
      } else {
        map.set(d.timestamp, { timestamp: d.timestamp, trend: d.trend });
      }
    }
    for (const d of trendData.forecastLine) {
      if (map.has(d.timestamp)) {
        map.get(d.timestamp).forecast = d.forecast;
      } else {
        map.set(d.timestamp, { timestamp: d.timestamp, forecast: d.forecast });
      }
    }

    return Array.from(map.values()).sort((a, b) => a.timestamp - b.timestamp);
  }, [chartData, trendData, showTrend]);

  const selectedEntry = selectedDate
    ? filteredEntries.find(e => e.date === selectedDate.toISOString().split("T")[0])
    : null;
  const selectedChartPoint = selectedDate
    ? chartData.find(d => d.rawDate === selectedDate.toISOString().split("T")[0])
    : null;

  const stats = col ? getStats(filteredEntries) : null;

  const comparableCollections = collections.filter(c => c.id !== activeId);

  if (!collections.length) {
    return (
      <div className="px-5 pt-3 pb-24 flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground text-sm">{t("charts.noData")}</p>
      </div>
    );
  }

  const slopeLabel = trendData.reg
    ? Math.abs(trendData.reg.slope) < 0.01
      ? t("charts.stable")
      : trendData.reg.slope > 0
        ? t("charts.rising")
        : t("charts.falling")
    : "";

  return (
    <div className="px-5 pt-3 pb-24">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl text-display text-foreground">{t("charts.title")}</h1>
        <div className="flex items-center gap-2">
          {/* Trend toggle */}
          {activeId && (
            <button
              onClick={() => setShowTrend(v => !v)}
              className={cn(
                "h-9 px-3 rounded-lg flex items-center gap-1.5 text-xs font-medium transition-all active:scale-95",
                showTrend ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              {t("charts.trend")}
            </button>
          )}
          {/* Compare toggle */}
          {activeId && comparableCollections.length > 0 && (
            <Popover>
              <PopoverTrigger asChild>
                <button className={cn(
                  "h-9 px-3 rounded-lg flex items-center gap-1.5 text-xs font-medium transition-all active:scale-95",
                  compareId ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}>
                  <GitCompareArrows className="w-3.5 h-3.5" />
                  {compareCol ? compareCol.title : t("charts.compare")}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-2" align="end">
                <p className="text-xs font-medium text-muted-foreground mb-2 px-2">{t("charts.compareWith")}</p>
                {compareId && (
                  <button
                    onClick={() => setCompareId(null)}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs text-destructive hover:bg-muted transition-colors"
                  >
                    ✕ {t("common.cancel")}
                  </button>
                )}
                {comparableCollections.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setCompareId(c.id === compareId ? null : c.id)}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center gap-2",
                      c.id === compareId ? "bg-muted text-foreground" : "hover:bg-muted text-muted-foreground"
                    )}
                  >
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} />
                    {c.title}
                  </button>
                ))}
              </PopoverContent>
            </Popover>
          )}
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
            <button onClick={() => setShowAddEntry(true)} className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center active:scale-95 transition-transform">
              <Plus className="w-4 h-4 text-primary-foreground" />
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
        {collections.map(c => (
          <button key={c.id} onClick={() => { setActiveId(c.id); setCompareId(prev => prev === c.id ? null : prev); }}
            className={`flex-shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all active:scale-95 ${activeId === c.id ? "text-primary-foreground card-shadow" : "bg-muted text-muted-foreground"}`}
            style={activeId === c.id ? { backgroundColor: c.color } : {}}>
            {c.title}
          </button>
        ))}
      </div>

      {col && (
        <>
          <div className="flex gap-1 bg-muted rounded-xl p-1 mb-5">
            {RANGES.map((r, i) => (
              <button key={r.label} onClick={() => setRangeIdx(i)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${rangeIdx === i ? "bg-card text-foreground card-shadow" : "text-muted-foreground"}`}>
                {r.label}
              </button>
            ))}
          </div>

          <div className="bg-card rounded-2xl p-4 card-shadow mb-5">
            {mergedChartData.length > 0 ? (
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={mergedChartData} margin={{ top: 5, right: 5, bottom: 5, left: -15 }}>
                    <defs>
                      <linearGradient id={`grad-${col.id}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={col.color} stopOpacity={0.15} />
                        <stop offset="100%" stopColor={col.color} stopOpacity={0} />
                      </linearGradient>
                      {compareCol && (
                        <linearGradient id={`grad-${compareCol.id}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={compareCol.color} stopOpacity={0.1} />
                          <stop offset="100%" stopColor={compareCol.color} stopOpacity={0} />
                        </linearGradient>
                      )}
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
                    <YAxis
                      yAxisId="left"
                      tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                      axisLine={false} tickLine={false} domain={["auto", "auto"]}
                    />
                    {compareCol && (
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        tick={{ fontSize: 10, fill: compareCol.color }}
                        axisLine={false} tickLine={false} domain={["auto", "auto"]}
                      />
                    )}
                    <Tooltip
                      contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
                      labelFormatter={(ts: number) => format(new Date(ts), "d. MMMM yyyy", { locale: dateLocale })}
                      formatter={(val: number, name: string) => {
                        if (name === "compareValue") return [`${val} ${compareCol?.unit}`, compareCol?.title];
                        if (name === "trend") return [`${val.toFixed(1)}`, t("charts.trendLine")];
                        if (name === "forecast") return [`${val.toFixed(1)}`, t("charts.forecast")];
                        return [`${val} ${col.unit}`, col.title];
                      }}
                    />
                    {col.goalValue && (
                      <ReferenceLine yAxisId="left" y={col.goalValue} stroke="hsl(var(--muted-foreground))" strokeDasharray="6 4"
                        label={{ value: `${t("charts.goal")}: ${col.goalValue}`, fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    )}

                    {/* Main data area */}
                    <Area yAxisId="left" type="monotone" dataKey="value" stroke={col.color} strokeWidth={2.5} fill={`url(#grad-${col.id})`}
                      dot={{ r: 3, fill: col.color, strokeWidth: 0 }} activeDot={{ r: 5, fill: col.color, strokeWidth: 2, stroke: "hsl(var(--card))" }}
                      connectNulls={false}
                    />

                    {/* Compare area */}
                    {compareCol && (
                      <Area yAxisId="right" type="monotone" dataKey="compareValue" stroke={compareCol.color} strokeWidth={2} fill={`url(#grad-${compareCol.id})`}
                        dot={{ r: 2, fill: compareCol.color, strokeWidth: 0 }} activeDot={{ r: 4, fill: compareCol.color, strokeWidth: 2, stroke: "hsl(var(--card))" }}
                        strokeDasharray="5 3"
                        connectNulls={false}
                      />
                    )}

                    {/* Trend line */}
                    {showTrend && trendData.trendLine.length > 0 && (
                      <Line yAxisId="left" type="linear" dataKey="trend" stroke="hsl(var(--muted-foreground))" strokeWidth={1.5}
                        strokeDasharray="6 3" dot={false} connectNulls />
                    )}

                    {/* Forecast line */}
                    {showTrend && trendData.forecastLine.length > 0 && (
                      <Line yAxisId="left" type="linear" dataKey="forecast" stroke={col.color} strokeWidth={2}
                        strokeDasharray="4 4" dot={false} strokeOpacity={0.5} connectNulls />
                    )}

                    {selectedChartPoint && selectedEntry && (
                      <ReferenceDot x={selectedChartPoint.timestamp} y={selectedEntry.value} yAxisId="left"
                        r={7} fill={col.color} stroke="hsl(var(--card))" strokeWidth={3} />
                    )}
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-center text-muted-foreground text-sm py-10">{t("charts.noRange")}</p>
            )}

            {/* Legend for compare mode */}
            {compareCol && (
              <div className="flex items-center gap-4 mt-3 px-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 rounded" style={{ backgroundColor: col.color }} />
                  <span className="text-[10px] text-muted-foreground">{col.title} ({col.unit})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 rounded border-dashed" style={{ backgroundColor: compareCol.color }} />
                  <span className="text-[10px] text-muted-foreground">{compareCol.title} ({compareCol.unit})</span>
                </div>
              </div>
            )}
          </div>

          {/* Trend info card */}
          {showTrend && trendData.reg && (
            <div className="bg-card rounded-2xl p-4 card-shadow mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">{t("charts.trendLine")}</p>
                <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <TrendingUp className={cn("w-4 h-4", trendData.reg.slope > 0 ? "text-green-500" : trendData.reg.slope < 0 ? "text-red-500" : "text-muted-foreground")} />
                  {slopeLabel}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground mb-0.5">{t("charts.slope")}</p>
                <p className="text-lg font-bold text-foreground tabular-nums">
                  {trendData.reg.slope > 0 ? "+" : ""}{trendData.reg.slope.toFixed(2)}
                  <span className="text-xs font-normal text-muted-foreground ml-1">{col.unit}/d</span>
                </p>
              </div>
            </div>
          )}

          {selectedEntry && col && (
            <div className="bg-card rounded-2xl p-4 card-shadow mb-5 flex items-center justify-between">
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
            <div className="grid grid-cols-2 gap-3">
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
