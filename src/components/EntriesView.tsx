import { useState, useEffect } from "react";
import { getCollections, deleteEntry, type DataCollection } from "@/lib/store";
import { Trash2, Search, Plus } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import AddEntrySheet from "./AddEntrySheet";

interface Props {
  refreshKey: number;
}

export default function EntriesView({ refreshKey }: Props) {
  const { t, lang } = useI18n();
  const [collections, setCollections] = useState<DataCollection[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showAddEntry, setShowAddEntry] = useState(false);

  useEffect(() => {
    const cols = getCollections().filter(c => !c.archived);
    setCollections(cols);
    if (!activeId && cols.length) setActiveId(cols[0].id);
  }, [refreshKey]);

  const col = collections.find(c => c.id === activeId);
  const entries = col?.entries.slice().reverse() ?? [];
  const filtered = search
    ? entries.filter(e => e.date.includes(search) || e.note?.toLowerCase().includes(search.toLowerCase()) || String(e.value).includes(search))
    : entries;

  const handleDelete = (entryId: string) => {
    if (!col) return;
    deleteEntry(col.id, entryId);
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
      <div className="flex items-center justify-between mb-4 animate-fade-up">
        <h1 className="text-2xl text-display text-foreground">{t("entries.title")}</h1>
        <div className="flex gap-2">
          <button onClick={() => setShowSearch(!showSearch)} className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center active:scale-95 transition-transform">
            <Search className="w-4 h-4 text-muted-foreground" />
          </button>
          {activeId && (
            <button onClick={() => setShowAddEntry(true)} className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center active:scale-95 transition-transform">
              <Plus className="w-4 h-4 text-primary-foreground" />
            </button>
          )}
        </div>
      </div>

      {showSearch && (
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t("entries.search")}
          className="w-full h-10 px-4 rounded-xl bg-muted text-foreground text-sm mb-4 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring animate-fade-up" autoFocus />
      )}

      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 animate-fade-up" style={{ animationDelay: "80ms" }}>
        {collections.map(c => (
          <button key={c.id} onClick={() => setActiveId(c.id)}
            className={`flex-shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all active:scale-95 ${activeId === c.id ? "text-primary-foreground card-shadow" : "bg-muted text-muted-foreground"}`}
            style={activeId === c.id ? { backgroundColor: c.color } : {}}>
            {c.title}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.length === 0 && <p className="text-center text-muted-foreground text-sm py-10">{t("entries.notFound")}</p>}
        {filtered.map((entry, i) => (
          <div key={entry.id} className="bg-card rounded-xl p-3.5 card-shadow flex items-center justify-between animate-fade-up" style={{ animationDelay: `${(i + 2) * 60}ms` }}>
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
    </div>
  );
}
