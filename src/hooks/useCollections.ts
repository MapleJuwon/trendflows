import { useState, useEffect, useCallback } from "react";
import { fetchCollections, type DataCollection } from "@/lib/store";

export function useCollections() {
  const [collections, setCollections] = useState<DataCollection[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const cols = await fetchCollections();
    setCollections(cols);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    const handler = () => refresh();
    window.addEventListener("trendflow-refresh", handler);
    return () => window.removeEventListener("trendflow-refresh", handler);
  }, [refresh]);

  return { collections, loading, refresh };
}
