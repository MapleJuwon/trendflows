import { supabase } from "@/integrations/supabase/client";

export interface DataEntry {
  id: string;
  date: string;
  value: number;
  note?: string;
}

export interface DataCollection {
  id: string;
  title: string;
  unit: string;
  color: string;
  goalValue?: number;
  entries: DataEntry[];
  createdAt: string;
  updatedAt: string;
  archived?: boolean;
  sortOrder: number;
}

export const COLORS = [
  'hsl(207, 90%, 68%)',
  'hsl(123, 38%, 63%)',
  'hsl(38, 92%, 65%)',
  'hsl(340, 65%, 65%)',
  'hsl(262, 52%, 65%)',
  'hsl(180, 50%, 55%)',
  'hsl(15, 80%, 62%)',
  'hsl(200, 70%, 55%)',
];

export async function fetchCollections(): Promise<DataCollection[]> {
  const { data: cols, error: colErr } = await supabase
    .from("collections")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (colErr || !cols) return [];

  const { data: entries, error: entErr } = await supabase
    .from("entries")
    .select("*")
    .order("date", { ascending: true });

  const entriesByCol: Record<string, DataEntry[]> = {};
  if (entries && !entErr) {
    for (const e of entries) {
      const cid = e.collection_id;
      if (!entriesByCol[cid]) entriesByCol[cid] = [];
      entriesByCol[cid].push({
        id: e.id,
        date: e.date,
        value: Number(e.value),
        note: e.note ?? undefined,
      });
    }
  }

  return cols.map((c) => ({
    id: c.id,
    title: c.title,
    unit: c.unit,
    color: c.color,
    goalValue: c.goal_value ? Number(c.goal_value) : undefined,
    entries: entriesByCol[c.id] ?? [],
    createdAt: c.created_at,
    updatedAt: c.updated_at,
    archived: c.archived,
    sortOrder: c.sort_order ?? 0,
  }));
}

export async function createCollection(title: string, unit: string, color?: string, goalValue?: number): Promise<DataCollection | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const allCols = await fetchCollections();
  const finalColor = color || COLORS[allCols.length % COLORS.length];

  const insertData = {
    user_id: user.id,
    title,
    unit,
    color: finalColor,
    ...(goalValue !== undefined && !isNaN(goalValue) ? { goal_value: goalValue } : {}),
  };

  const { data, error } = await supabase
    .from("collections")
    .insert(insertData)
    .select()
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    title: data.title,
    unit: data.unit,
    color: data.color,
    goalValue: data.goal_value ? Number(data.goal_value) : undefined,
    entries: [],
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    archived: data.archived,
    sortOrder: data.sort_order ?? 0,
  };
}

export async function addEntry(collectionId: string, date: string, value: number, note?: string): Promise<DataEntry | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("entries")
    .insert({ collection_id: collectionId, user_id: user.id, date, value, note: note || null })
    .select()
    .single();

  if (error || !data) return null;

  // Update collection's updated_at
  await supabase.from("collections").update({ updated_at: new Date().toISOString() }).eq("id", collectionId);

  return { id: data.id, date: data.date, value: Number(data.value), note: data.note ?? undefined };
}

export async function updateEntry(collectionId: string, entryId: string, updates: Partial<DataEntry>) {
  const upd: Record<string, unknown> = {};
  if (updates.date !== undefined) upd.date = updates.date;
  if (updates.value !== undefined) upd.value = updates.value;
  if (updates.note !== undefined) upd.note = updates.note || null;

  await supabase.from("entries").update(upd).eq("id", entryId);
  await supabase.from("collections").update({ updated_at: new Date().toISOString() }).eq("id", collectionId);
}

export async function deleteEntry(collectionId: string, entryId: string) {
  await supabase.from("entries").delete().eq("id", entryId);
  await supabase.from("collections").update({ updated_at: new Date().toISOString() }).eq("id", collectionId);
}

export async function deleteCollection(collectionId: string) {
  await supabase.from("collections").delete().eq("id", collectionId);
}

export async function updateCollection(collectionId: string, data: Partial<DataCollection>) {
  const upd: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (data.title !== undefined) upd.title = data.title;
  if (data.unit !== undefined) upd.unit = data.unit;
  if (data.color !== undefined) upd.color = data.color;
  if (data.goalValue !== undefined) upd.goal_value = data.goalValue;
  if (data.archived !== undefined) upd.archived = data.archived;

  await supabase.from("collections").update(upd).eq("id", collectionId);
}

export async function updateCollectionOrder(orderedIds: string[]) {
  const promises = orderedIds.map((id, index) =>
    supabase.from("collections").update({ sort_order: index }).eq("id", id)
  );
  await Promise.all(promises);
}

export async function deleteAllData() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("collections").delete().eq("user_id", user.id);
}

export function getStats(entries: DataEntry[]) {
  if (!entries.length) return null;
  const values = entries.map(e => e.value);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  return {
    avg: Math.round(avg * 100) / 100,
    min: Math.min(...values),
    max: Math.max(...values),
    count: values.length,
    latest: entries[entries.length - 1],
    trend: values.length >= 2 ? values[values.length - 1] - values[values.length - 2] : 0,
  };
}


