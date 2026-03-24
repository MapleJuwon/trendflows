import { useState, useEffect, useCallback } from "react";
import BottomNav, { type Tab } from "@/components/BottomNav";
import Dashboard from "@/components/Dashboard";
import ChartsView from "@/components/ChartsView";
import EntriesView from "@/components/EntriesView";
import AccountView from "@/components/AccountView";
import SettingsView from "@/components/SettingsView";
import AuthScreen from "@/components/AuthScreen";
import { useAuth } from "@/lib/auth";

export default function Index() {
  const { user, loading } = useAuth();
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return <AuthScreen onClose={() => {}} />;
  }

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
