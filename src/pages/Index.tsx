import { useState, useEffect, useCallback } from "react";
import BottomNav, { type Tab } from "@/components/BottomNav";
import Dashboard from "@/components/Dashboard";
import ChartsView from "@/components/ChartsView";
import EntriesView from "@/components/EntriesView";
import AccountView from "@/components/AccountView";
import SettingsView from "@/components/SettingsView";

export default function Index() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => setRefreshKey(k => k + 1), []);

  useEffect(() => {
    window.addEventListener("trendflow-refresh", refresh);
    return () => window.removeEventListener("trendflow-refresh", refresh);
  }, [refresh]);

  const openCollection = (id: string) => {
    setSelectedCollectionId(id);
    setTab("charts");
  };

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto relative">
      <div className="pt-safe-top">
        {tab === "dashboard" && <Dashboard onOpenCollection={openCollection} refreshKey={refreshKey} />}
        {tab === "charts" && <ChartsView selectedId={selectedCollectionId} refreshKey={refreshKey} />}
        {tab === "entries" && <EntriesView refreshKey={refreshKey} />}
        {tab === "account" && <AccountView />}
        {tab === "settings" && <SettingsView />}
      </div>
      <BottomNav active={tab} onNavigate={(t) => { setTab(t); if (t !== "charts") setSelectedCollectionId(null); }} />
    </div>
  );
}
