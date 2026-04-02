import { useState } from "react";
import { addEntry } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import { useCollections } from "@/hooks/useCollections";
import { notifyGoalReached } from "@/hooks/useNotifications";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

interface Props {
  collectionId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddEntrySheet({ collectionId, open, onOpenChange }: Props) {
  const { t } = useI18n();
  const today = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(today);
  const [value, setValue] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const num = parseFloat(value);
    if (isNaN(num)) return;
    setSaving(true);
    await addEntry(collectionId, date, num, note.trim() || undefined);
    setValue("");
    setNote("");
    setDate(today);
    setSaving(false);
    onOpenChange(false);
    window.dispatchEvent(new Event("trendflow-refresh"));
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl px-5 pb-10">
        <SheetHeader className="mb-5">
          <SheetTitle className="text-display text-lg">{t("entry.new")}</SheetTitle>
        </SheetHeader>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t("entry.date")}</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
              className="w-full h-12 px-4 rounded-xl bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t("entry.value")}</label>
            <input type="number" inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} placeholder="0"
              className="w-full h-14 px-4 rounded-xl bg-muted text-foreground text-2xl font-bold tabular-nums placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-ring" autoFocus />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t("entry.note")}</label>
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder={t("entry.notePlaceholder")}
              className="w-full h-12 px-4 rounded-xl bg-muted text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <button onClick={handleSave} disabled={!value || isNaN(parseFloat(value)) || saving}
            className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold text-sm active:scale-[0.98] transition-transform disabled:opacity-40 card-shadow">
            {saving ? "..." : t("entry.save")}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
