import { useState } from "react";
import { createCollection, COLORS } from "@/lib/store";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SUGGESTIONS = [
  { title: "Gewicht", unit: "kg" },
  { title: "Schlaf", unit: "Stunden" },
  { title: "Stimmung", unit: "/10" },
  { title: "Wasser", unit: "Liter" },
  { title: "Ausgaben", unit: "€" },
  { title: "Schritte", unit: "Schritte" },
];

export default function CreateCollectionSheet({ open, onOpenChange }: Props) {
  const [title, setTitle] = useState("");
  const [unit, setUnit] = useState("");
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);

  const handleCreate = () => {
    if (!title.trim() || !unit.trim()) return;
    createCollection(title.trim(), unit.trim(), selectedColor);
    setTitle("");
    setUnit("");
    onOpenChange(false);
    window.dispatchEvent(new Event("trendflow-refresh"));
  };

  const applySuggestion = (s: { title: string; unit: string }) => {
    setTitle(s.title);
    setUnit(s.unit);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl px-5 pb-10">
        <SheetHeader className="mb-5">
          <SheetTitle className="text-display text-lg">Neue Sammlung</SheetTitle>
        </SheetHeader>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 mb-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s.title}
                onClick={() => applySuggestion(s)}
                className="px-3 py-1.5 rounded-xl bg-accent text-accent-foreground text-xs font-medium active:scale-95 transition-transform"
              >
                {s.title}
              </button>
            ))}
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Titel</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="z.B. Gewicht"
              className="w-full h-12 px-4 rounded-xl bg-muted text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Einheit</label>
            <input
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="z.B. kg, Stunden, €"
              className="w-full h-12 px-4 rounded-xl bg-muted text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Farbe</label>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setSelectedColor(c)}
                  className={`w-8 h-8 rounded-full active:scale-90 transition-transform ${
                    selectedColor === c ? "ring-2 ring-offset-2 ring-ring" : ""
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <button
            onClick={handleCreate}
            disabled={!title.trim() || !unit.trim()}
            className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold text-sm active:scale-[0.98] transition-transform disabled:opacity-40 card-shadow"
          >
            Erstellen
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
