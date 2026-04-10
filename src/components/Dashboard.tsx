import { useState, useEffect, useMemo, useCallback } from "react";
import { Plus, TrendingUp, TrendingDown, Minus, Trash2, Flame, GripVertical } from "lucide-react";
import { getStats, deleteCollection, updateCollectionOrder, type DataCollection } from "@/lib/store";
import { useCollections } from "@/hooks/useCollections";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";
import AddEntrySheet from "./AddEntrySheet";
import CreateCollectionSheet from "./CreateCollectionSheet";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface DashboardProps {
  onOpenCollection: (id: string) => void;
  refreshKey: number;
}

/* ─── Sortable Card ─── */
function SortableCollectionCard({
  col,
  index,
  onOpen,
  onDelete,
  onQuickAdd,
  formatDate,
  t,
}: {
  col: DataCollection;
  index: number;
  onOpen: (id: string) => void;
  onDelete: (e: React.MouseEvent, col: DataCollection) => void;
  onQuickAdd: (id: string) => void;
  formatDate: (iso: string) => string;
  t: (key: string, vars?: Record<string, unknown>) => string;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: col.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.85 : 1,
  };

  const stats = getStats(col.entries);
  const chartData = col.entries.slice(-14).map(e => ({ v: e.value }));
  const trend = stats?.trend ?? 0;

  return (
    <div ref={setNodeRef} style={style} className="relative">
      <div
        className={`bg-card rounded-2xl p-4 card-shadow transition-all duration-200 cursor-pointer ${isDragging ? 'shadow-xl scale-[1.02]' : 'active:scale-[0.98]'}`}
        onClick={() => !isDragging && onOpen(col.id)}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2.5">
            {/* Drag handle */}
            <button
              {...attributes}
              {...listeners}
              className="touch-none w-6 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
              onClick={e => e.stopPropagation()}
            >
              <GripVertical className="w-4 h-4" />
            </button>
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: col.color }} />
            <div>
              <h3 className="text-sm font-semibold text-foreground">{col.title}</h3>
              <p className="text-xs text-muted-foreground">{formatDate(col.updatedAt)}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={(e) => onDelete(e, col)}
              className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center active:scale-95 transition-transform"
            >
              <Trash2 className="w-4 h-4 text-destructive" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onQuickAdd(col.id); }}
              className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center active:scale-95 transition-transform"
            >
              <Plus className="w-4 h-4 text-accent-foreground" />
            </button>
          </div>
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

        {col.goalValue && stats ? (() => {
          const percent = Math.min(100, Math.round((stats.latest.value / col.goalValue) * 100));
          return (
            <div className="mt-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-medium text-muted-foreground">
                  {t("dashboard.goalProgress", { percent })}
                </span>
                <span className="text-[10px] text-muted-foreground tabular-nums">
                  {stats.latest.value} / {col.goalValue} {col.unit}
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${percent}%`, backgroundColor: col.color }}
                />
              </div>
            </div>
          );
        })() : null}
      </div>
    </div>
  );
}

/* ─── Dashboard ─── */
export default function Dashboard({ onOpenCollection, refreshKey }: DashboardProps) {
  const { t, lang } = useI18n();
  const { collections: allCollections, refresh } = useCollections();
  const [showCreate, setShowCreate] = useState(false);
  const [quickAddId, setQuickAddId] = useState<string | null>(null);
  const [localOrder, setLocalOrder] = useState<DataCollection[]>([]);
  const [editGoalCol, setEditGoalCol] = useState<DataCollection | null>(null);
  const [goalInput, setGoalInput] = useState("");

  const collections = useMemo(() => allCollections.filter(c => !c.archived), [allCollections]);

  // Sync local order with fetched data
  useEffect(() => {
    setLocalOrder(collections);
  }, [collections]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  );

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = localOrder.findIndex(c => c.id === active.id);
    const newIndex = localOrder.findIndex(c => c.id === over.id);
    const newOrder = arrayMove(localOrder, oldIndex, newIndex);

    setLocalOrder(newOrder);
    await updateCollectionOrder(newOrder.map(c => c.id));
    refresh();
  }, [localOrder, refresh]);

  const handleDelete = async (e: React.MouseEvent, col: DataCollection) => {
    e.stopPropagation();
    if (!window.confirm(t("dashboard.deleteConfirm", { name: col.title }))) return;
    await deleteCollection(col.id);
    window.dispatchEvent(new Event("trendflow-refresh"));
    toast.success(t("dashboard.deleted"));
  };

  useEffect(() => { if (refreshKey > 0) refresh(); }, [refreshKey]);

  const streak = useMemo(() => {
    const allDates = new Set<string>();
    allCollections.forEach(c => c.entries.forEach(e => allDates.add(e.date)));
    if (allDates.size === 0) return 0;
    let count = 0;
    const today = new Date();
    for (let i = 0; i < 9999; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      if (allDates.has(key)) count++;
      else break;
    }
    return count;
  }, [allCollections]);

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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl text-display text-foreground leading-tight">{t("dashboard.title")}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t("dashboard.subtitle")}</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="w-10 h-10 rounded-full bg-primary flex items-center justify-center card-shadow active:scale-95 transition-transform"
        >
          <Plus className="w-5 h-5 text-primary-foreground" />
        </button>
      </div>

      {/* Streak Widget */}
      {localOrder.length > 0 && (
        <div className="mb-4 p-4 rounded-2xl bg-card card-shadow flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${streak > 0 ? 'bg-orange-500/15' : 'bg-muted'}`}>
            <Flame className={`w-5 h-5 ${streak > 0 ? 'text-orange-500' : 'text-muted-foreground'}`} />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              {streak > 0 ? t("dashboard.streak", { n: streak }) : t("dashboard.streakNone")}
            </p>
            <p className="text-xs text-muted-foreground">
              {streak > 0
                ? (streak >= 7 ? "🏆" : streak >= 3 ? "💪" : "🌱")
                : ""}
            </p>
          </div>
        </div>
      )}

      {localOrder.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
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
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={localOrder.map(c => c.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {localOrder.map((col, i) => (
                <SortableCollectionCard
                  key={col.id}
                  col={col}
                  index={i}
                  onOpen={onOpenCollection}
                  onDelete={handleDelete}
                  onQuickAdd={(id) => setQuickAddId(id)}
                  onEditGoal={(col) => { setEditGoalCol(col); setGoalInput(col.goalValue?.toString() || ""); }}
                  formatDate={formatDate}
                  t={t}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <CreateCollectionSheet open={showCreate} onOpenChange={setShowCreate} />
      {quickAddId && (
        <AddEntrySheet collectionId={quickAddId} open={!!quickAddId} onOpenChange={(open) => !open && setQuickAddId(null)} />
      )}

      {/* Edit Goal Sheet */}
      <Sheet open={!!editGoalCol} onOpenChange={(o) => !o && setEditGoalCol(null)}>
        <SheetContent side="bottom" className="rounded-t-3xl px-5 pb-10">
          <SheetHeader className="mb-5">
            <SheetTitle className="text-display text-lg">
              {t("dashboard.editGoal")} – {editGoalCol?.title}
            </SheetTitle>
          </SheetHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                {t("dashboard.goalValue")} ({editGoalCol?.unit})
              </label>
              <input
                type="number"
                value={goalInput}
                onChange={e => setGoalInput(e.target.value)}
                placeholder={t("collection.goalPlaceholder")}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:text-sm"
              />
            </div>
            <button
              onClick={async () => {
                if (!editGoalCol) return;
                const val = parseFloat(goalInput);
                if (isNaN(val) || val <= 0) { toast.error(t("common.error")); return; }
                await updateCollection(editGoalCol.id, { goalValue: val });
                toast.success(t("dashboard.goalUpdated"));
                setEditGoalCol(null);
                refresh();
              }}
              className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold text-sm active:scale-[0.98] transition-transform card-shadow"
            >
              {t("common.save")}
            </button>
            {editGoalCol?.goalValue && (
              <button
                onClick={async () => {
                  if (!editGoalCol) return;
                  await updateCollection(editGoalCol.id, { removeGoal: true });
                  toast.success(t("dashboard.goalRemoved"));
                  setEditGoalCol(null);
                  refresh();
                }}
                className="w-full h-10 rounded-xl border border-destructive text-destructive font-medium text-sm active:scale-[0.98] transition-transform"
              >
                {t("dashboard.removeGoal")}
              </button>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
