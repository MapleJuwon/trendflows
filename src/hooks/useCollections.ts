import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchCollections, type DataCollection } from "@/lib/store";
import { useCallback, useEffect } from "react";

const COLLECTIONS_KEY = ["collections"] as const;

export function useCollections() {
  const queryClient = useQueryClient();

  const { data: collections = [], isLoading: loading } = useQuery({
    queryKey: COLLECTIONS_KEY,
    queryFn: fetchCollections,
    staleTime: 1000 * 60 * 2, // 2 minutes before refetch
    gcTime: 1000 * 60 * 10, // keep in cache 10 minutes
    refetchOnWindowFocus: true,
  });

  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: COLLECTIONS_KEY });
  }, [queryClient]);

  // Listen for global refresh events (from mutations)
  useEffect(() => {
    const handler = () => refresh();
    window.addEventListener("trendflow-refresh", handler);
    return () => window.removeEventListener("trendflow-refresh", handler);
  }, [refresh]);

  return { collections, loading, refresh };
}

/** Prefetch collections data (call on hover/focus to warm cache) */
export function usePrefetchCollections() {
  const queryClient = useQueryClient();
  return useCallback(() => {
    queryClient.prefetchQuery({
      queryKey: COLLECTIONS_KEY,
      queryFn: fetchCollections,
      staleTime: 1000 * 60 * 2,
    });
  }, [queryClient]);
}
