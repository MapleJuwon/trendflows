import { useState } from "react";
import { User, Cloud, Activity } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import AuthScreen from "./AuthScreen";

export default function AccountView() {
  const { user, signOut } = useAuth();
  const { t } = useI18n();
  const [showAuth, setShowAuth] = useState(false);

  if (showAuth) {
    return <AuthScreen onClose={() => setShowAuth(false)} />;
  }

  return (
    <div className="px-5 pt-3 pb-24">
      <h1 className="text-2xl text-display text-foreground mb-6 animate-fade-up">{t("account.title")}</h1>

      <div className="bg-card rounded-2xl p-5 card-shadow mb-5 animate-fade-up" style={{ animationDelay: "80ms" }}>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-accent flex items-center justify-center">
            <User className="w-6 h-6 text-primary" />
          </div>
          <div>
            {user ? (
              <>
                <p className="text-foreground font-semibold">{t("account.loggedInAs")}</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </>
            ) : (
              <>
                <p className="text-foreground font-semibold">{t("account.guest")}</p>
                <p className="text-sm text-muted-foreground">{t("account.guestDesc")}</p>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {[
          { icon: Cloud, label: t("account.cloudSync"), desc: t("account.cloudSyncDesc"), color: "text-primary" },
          { icon: Activity, label: t("account.activity"), desc: t("account.activityDesc"), color: "text-secondary" },
        ].map((item, i) => (
          <div key={item.label}
            className="bg-card rounded-xl p-4 card-shadow flex items-center gap-3.5 active:scale-[0.98] transition-transform cursor-pointer animate-fade-up"
            style={{ animationDelay: `${(i + 2) * 80}ms` }}>
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
              <item.icon className={`w-5 h-5 ${item.color}`} />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{item.label}</p>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {user ? (
        <button
          onClick={() => signOut()}
          className="w-full mt-6 h-12 rounded-xl border border-destructive text-destructive font-semibold text-sm active:scale-[0.98] transition-transform animate-fade-up"
          style={{ animationDelay: "320ms" }}
        >
          {t("settings.logout")}
        </button>
      ) : (
        <button
          onClick={() => setShowAuth(true)}
          className="w-full mt-6 bg-primary text-primary-foreground h-12 rounded-xl font-semibold text-sm active:scale-[0.98] transition-transform card-shadow animate-fade-up"
          style={{ animationDelay: "320ms" }}
        >
          {t("account.loginRegister")}
        </button>
      )}
    </div>
  );
}
