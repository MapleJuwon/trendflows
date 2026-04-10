import { useState, useEffect } from "react";
import { deleteEntry, updateCollection, type DataCollection } from "@/lib/store";
import { useCollections } from "@/hooks/useCollections";
import { Trash2, Search, Plus, Target } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";
import AddEntrySheet from "./AddEntrySheet";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

interface Props {
  refreshKey: number;
}

export default function EntriesView({ refreshKey }: Props) {
  const { t, lang } = useI18n();
  const { collections: allCollections, refresh } = useCollections();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showAddEntry, setShowAddEntry] = useState(false);
  const [editGoalCol, setEditGoalCol] = useState<DataCollection | null>(null);
  const [goalInput, setGoalInput] = useState("");

  useEffect(() => { if (refreshKey > 0) refresh(); }, [refreshKey]);

  const collections = allCollections.filter(c => !c.archived);

  useEffect(() => {
    if (!activeId && collections.length) setActiveId(collections[0].id);
  }, [collections]);

  const col = collections.find(c => c.id === activeId);
  const entries = col?.entries.slice().reverse() ?? [];
  const filtered = search
    ? entries.filter(e => e.date.includes(search) || e.note?.toLowerCase().includes(search.toLowerCase()) || String(e.value).includes(search))
    : entries;

  const handleDelete = async (entryId: string) => {
    if (!col) return;
    await deleteEntry(col.id, entryId);
    window.dispatchEvent(new Event("trendflow-refresh"));
  };

  const locale = lang === "de" ? "de-DE" : "en-US";
  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString(locale, { weekday: "short", day: "numeric", month: "short", year: "numeric" });

  if (!collections.length) {
    return (
      <div className="px-5 pt-3 pb-24 flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground text-sm">{t("entries.empty")}</p>
      </div>
    );
  }

  return (
    <div className="px-5 pt-3 pb-24">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl text-display text-foreground">{t("entries.title")}</h1>
        <div className="flex gap-2">
          <button onClick={() => setShowSearch(!showSearch)} className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center active:scale-95 transition-transform">
            <Search className="w-4 h-4 text-muted-foreground" />
          </button>
          {col && (
            <button
              onClick={() => { setEditGoalCol(col); setGoalInput(col.goalValue?.toString() || ""); }}
              className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center active:scale-95 transition-transform"
            >
              <Target className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
          {activeId && (
            <button onClick={() => setShowAddEntry(true)} className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center active:scale-95 transition-transform">
              <Plus className="w-4 h-4 text-primary-foreground" />
            </button>
          )}
        </div>
      </div>

      {showSearch && (
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t("entries.search")}
          className="w-full h-10 px-4 rounded-xl bg-muted text-foreground text-sm mb-4 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" autoFocus />
      )}

      <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
        {collections.map(c => (
          <button key={c.id} onClick={() => setActiveId(c.id)}
            className={`flex-shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all active:scale-95 ${activeId === c.id ? "text-primary-foreground card-shadow" : "bg-muted text-muted-foreground"}`}
            style={activeId === c.id ? { backgroundColor: c.color } : {}}>
            {c.title}
          </button>
        ))}
      </div>

      {/* Goal info bar */}
      {col && (
        <button
          onClick={() => { setEditGoalCol(col); setGoalInput(col.goalValue?.toString() || ""); }}
          className="w-full mb-4 p-3 rounded-xl bg-card card-shadow flex items-center justify-between active:scale-[0.98] transition-transform"
        >
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-foreground font-medium">
              {col.goalValue
                ? `${t("dashboard.editGoal")}: ${col.goalValue} ${col.unit}`
                : t("dashboard.setGoal")}
            </span>
          </div>
          <span className="text-xs text-muted-foreground">✎</span>
        </button>
      )}

      <div className="space-y-2">
        {filtered.length === 0 && <p className="text-center text-muted-foreground text-sm py-10">{t("entries.notFound")}</p>}
        {filtered.map((entry, i) => (
          <div key={entry.id} className="bg-card rounded-xl p-3.5 card-shadow flex items-center justify-between" style={{ animationDelay: `${(i + 2) * 60}ms` }}>
            <div>
              <p className="text-xs text-muted-foreground">{formatDate(entry.date)}</p>
              <p className="text-lg font-bold text-foreground tabular-nums">
                {entry.value} <span className="text-xs font-normal text-muted-foreground">{col?.unit}</span>
              </p>
              {entry.note && <p className="text-xs text-muted-foreground mt-0.5">{entry.note}</p>}
            </div>
            <button onClick={() => handleDelete(entry.id)} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive active:scale-90 transition-all">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {activeId && (
        <AddEntrySheet collectionId={activeId} open={showAddEntry} onOpenChange={setShowAddEntry} />
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
