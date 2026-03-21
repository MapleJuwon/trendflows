export interface DataEntry {
  id: string;
  date: string; // ISO date string YYYY-MM-DD
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
}

const STORAGE_KEY = 'trendflow_data';

const COLORS = [
  'hsl(207, 90%, 68%)',   // blue
  'hsl(123, 38%, 63%)',   // green
  'hsl(38, 92%, 65%)',    // amber
  'hsl(340, 65%, 65%)',   // rose
  'hsl(262, 52%, 65%)',   // purple
  'hsl(180, 50%, 55%)',   // teal
  'hsl(15, 80%, 62%)',    // orange
  'hsl(200, 70%, 55%)',   // sky
];

export function getCollections(): DataCollection[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function saveCollections(collections: DataCollection[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(collections));
}

export function createCollection(title: string, unit: string, color?: string): DataCollection {
  const collections = getCollections();
  const col: DataCollection = {
    id: crypto.randomUUID(),
    title,
    unit,
    color: color || COLORS[collections.length % COLORS.length],
    entries: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  saveCollections([...collections, col]);
  return col;
}

export function addEntry(collectionId: string, date: string, value: number, note?: string): DataEntry {
  const collections = getCollections();
  const entry: DataEntry = { id: crypto.randomUUID(), date, value, note };
  const updated = collections.map(c => 
    c.id === collectionId 
      ? { ...c, entries: [...c.entries, entry].sort((a, b) => a.date.localeCompare(b.date)), updatedAt: new Date().toISOString() }
      : c
  );
  saveCollections(updated);
  return entry;
}

export function updateEntry(collectionId: string, entryId: string, data: Partial<DataEntry>) {
  const collections = getCollections();
  const updated = collections.map(c => 
    c.id === collectionId 
      ? { ...c, entries: c.entries.map(e => e.id === entryId ? { ...e, ...data } : e).sort((a, b) => a.date.localeCompare(b.date)), updatedAt: new Date().toISOString() }
      : c
  );
  saveCollections(updated);
}

export function deleteEntry(collectionId: string, entryId: string) {
  const collections = getCollections();
  const updated = collections.map(c => 
    c.id === collectionId 
      ? { ...c, entries: c.entries.filter(e => e.id !== entryId), updatedAt: new Date().toISOString() }
      : c
  );
  saveCollections(updated);
}

export function deleteCollection(collectionId: string) {
  saveCollections(getCollections().filter(c => c.id !== collectionId));
}

export function updateCollection(collectionId: string, data: Partial<DataCollection>) {
  const collections = getCollections();
  saveCollections(collections.map(c => c.id === collectionId ? { ...c, ...data, updatedAt: new Date().toISOString() } : c));
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

export { COLORS };
