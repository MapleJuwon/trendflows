import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";
import { Lock, Eye, EyeOff } from "lucide-react";

export default function ResetPassword() {
  const { updatePassword } = useAuth();
  const { t } = useI18n();
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async () => {
    if (!password || loading) return;
    setLoading(true);
    const { error } = await updatePassword(password);
    if (error) toast.error(error.message);
    else { toast.success(t("auth.passwordUpdated")); setDone(true); }
    setLoading(false);
  };

  if (done) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-5">
        <p className="text-foreground font-semibold mb-4">{t("auth.passwordUpdated")}</p>
        <a href="/" className="text-primary font-medium text-sm">{t("auth.backToLogin")}</a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-5">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl text-display text-foreground mb-6">{t("auth.setNewPassword")}</h1>
        <div className="relative mb-4">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder={t("auth.newPassword")}
            className="w-full h-12 pl-11 pr-11 rounded-xl bg-muted text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" autoFocus />
          <button onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2">
            {showPw ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
          </button>
        </div>
        <button onClick={handleSubmit} disabled={!password || loading}
          className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold text-sm active:scale-[0.98] transition-transform disabled:opacity-40 card-shadow">
          {loading ? t("common.loading") : t("auth.setNewPassword")}
        </button>
      </div>
    </div>
  );
}
