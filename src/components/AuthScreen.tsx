import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { ArrowLeft, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

type AuthMode = "login" | "register" | "forgot";

interface Props {
  onClose: () => void;
}

export default function AuthScreen({ onClose }: Props) {
  const { signIn, signUp, resetPassword } = useAuth();
  const { t } = useI18n();
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleSubmit = async () => {
    if (loading) return;
    setLoading(true);

    if (mode === "forgot") {
      const { error } = await resetPassword(email);
      if (error) { toast.error(error.message); }
      else { setResetSent(true); toast.success(t("auth.resetSent")); }
      setLoading(false);
      return;
    }

    if (mode === "register" && password !== confirmPw) {
      toast.error(t("auth.passwordMismatch"));
      setLoading(false);
      return;
    }

    const fn = mode === "login" ? signIn : signUp;
    const { error } = await fn(email, password);
    if (error) {
      toast.error(error.message);
    } else {
      if (mode === "register") {
        toast.success(t("auth.resetSent"));
      }
      onClose();
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col">
      <div className="px-5 pt-4 pb-2 flex items-center">
        <button onClick={onClose} className="w-10 h-10 rounded-xl flex items-center justify-center active:scale-95 transition-transform">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
      </div>

      <div className="flex-1 px-5 pt-6">
        <h1 className="text-2xl text-display text-foreground mb-2 animate-fade-up">
          {mode === "login" ? t("auth.login") : mode === "register" ? t("auth.register") : t("auth.resetPassword")}
        </h1>
        {mode === "forgot" && !resetSent && (
          <p className="text-sm text-muted-foreground mb-6 animate-fade-up" style={{ animationDelay: "60ms" }}>{t("auth.resetDesc")}</p>
        )}

        {resetSent ? (
          <div className="py-10 text-center animate-fade-up">
            <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center mx-auto mb-4">
              <Mail className="w-7 h-7 text-primary" />
            </div>
            <p className="text-foreground font-semibold mb-1">{t("auth.resetSent")}</p>
            <button onClick={() => { setMode("login"); setResetSent(false); }} className="text-primary text-sm font-medium mt-4 active:scale-95 transition-transform">
              {t("auth.backToLogin")}
            </button>
          </div>
        ) : (
          <div className="space-y-3 animate-fade-up" style={{ animationDelay: "120ms" }}>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder={t("auth.email")}
                className="w-full h-12 pl-11 pr-4 rounded-xl bg-muted text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                autoFocus
              />
            </div>

            {mode !== "forgot" && (
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={t("auth.password")}
                  className="w-full h-12 pl-11 pr-11 rounded-xl bg-muted text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <button onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2">
                  {showPw ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
                </button>
              </div>
            )}

            {mode === "register" && (
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type={showPw ? "text" : "password"}
                  value={confirmPw}
                  onChange={e => setConfirmPw(e.target.value)}
                  placeholder={t("auth.confirmPassword")}
                  className="w-full h-12 pl-11 pr-4 rounded-xl bg-muted text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            )}

            {mode === "login" && (
              <button onClick={() => setMode("forgot")} className="text-primary text-xs font-medium active:scale-95 transition-transform">
                {t("auth.forgotPassword")}
              </button>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading || !email || (mode !== "forgot" && !password)}
              className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold text-sm active:scale-[0.98] transition-transform disabled:opacity-40 card-shadow mt-2"
            >
              {loading ? t("common.loading") : mode === "login" ? t("auth.login") : mode === "register" ? t("auth.register") : t("auth.sendReset")}
            </button>

            <div className="text-center pt-2">
              {mode === "login" ? (
                <p className="text-sm text-muted-foreground">
                  {t("auth.noAccount")}{" "}
                  <button onClick={() => setMode("register")} className="text-primary font-medium active:scale-95 transition-transform">{t("auth.register")}</button>
                </p>
              ) : mode === "register" ? (
                <p className="text-sm text-muted-foreground">
                  {t("auth.hasAccount")}{" "}
                  <button onClick={() => setMode("login")} className="text-primary font-medium active:scale-95 transition-transform">{t("auth.login")}</button>
                </p>
              ) : (
                <button onClick={() => setMode("login")} className="text-primary text-sm font-medium active:scale-95 transition-transform">
                  {t("auth.backToLogin")}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
