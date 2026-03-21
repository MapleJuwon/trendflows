import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export type Lang = "de" | "en";

const translations = {
  de: {
    // Bottom nav
    "nav.overview": "Übersicht",
    "nav.charts": "Diagramme",
    "nav.entries": "Einträge",
    "nav.account": "Account",
    "nav.settings": "Einstellungen",
    // Dashboard
    "dashboard.title": "TrendFlow",
    "dashboard.subtitle": "Deine Datensammlungen",
    "dashboard.empty": "Noch keine Sammlungen",
    "dashboard.emptyDesc": "Erstelle deine erste Datensammlung, um Werte zu tracken.",
    "dashboard.createCollection": "Sammlung erstellen",
    "dashboard.noEntries": "Noch keine Einträge",
    "dashboard.justNow": "gerade eben",
    "dashboard.minsAgo": "vor {n} Min.",
    "dashboard.hoursAgo": "vor {n} Std.",
    // Charts
    "charts.title": "Diagramme",
    "charts.noData": "Noch keine Daten vorhanden.",
    "charts.noRange": "Keine Daten im gewählten Zeitraum.",
    "charts.average": "Durchschnitt",
    "charts.minimum": "Minimum",
    "charts.maximum": "Maximum",
    "charts.count": "Einträge",
    "charts.goal": "Ziel",
    "charts.all": "Alle",
    "charts.pickDate": "Tag wählen",
    "charts.selectedDay": "Ausgewählter Tag",
    "charts.pickDate": "Tag wählen",
    "charts.selectedDay": "Ausgewählter Tag",
    // Entries
    "entries.title": "Einträge",
    "entries.empty": "Noch keine Einträge.",
    "entries.notFound": "Keine Einträge gefunden.",
    "entries.search": "Suchen...",
    // Add entry
    "entry.new": "Neuer Eintrag",
    "entry.date": "Datum",
    "entry.value": "Wert",
    "entry.note": "Notiz (optional)",
    "entry.notePlaceholder": "z.B. Nach dem Sport",
    "entry.save": "Speichern",
    // Create collection
    "collection.new": "Neue Sammlung",
    "collection.title": "Titel",
    "collection.titlePlaceholder": "z.B. Gewicht",
    "collection.unit": "Einheit",
    "collection.unitPlaceholder": "z.B. kg, Stunden, €",
    "collection.color": "Farbe",
    "collection.create": "Erstellen",
    // Account
    "account.title": "Account",
    "account.guest": "Gast-Nutzer",
    "account.guestDesc": "Erstelle einen Account, um deine Daten zu sichern",
    "account.cloudSync": "Cloud-Synchronisation",
    "account.cloudSyncDesc": "Daten sicher in der Cloud speichern",
    "account.activity": "Aktivität",
    "account.activityDesc": "Deine Nutzungsübersicht",
    "account.loginRegister": "Registrieren / Anmelden",
    "account.loggedInAs": "Angemeldet als",
    "account.email": "E-Mail",
    "account.memberSince": "Mitglied seit",
    // Auth
    "auth.login": "Anmelden",
    "auth.register": "Registrieren",
    "auth.email": "E-Mail",
    "auth.password": "Passwort",
    "auth.confirmPassword": "Passwort bestätigen",
    "auth.forgotPassword": "Passwort vergessen?",
    "auth.noAccount": "Noch kein Account?",
    "auth.hasAccount": "Bereits einen Account?",
    "auth.resetPassword": "Passwort zurücksetzen",
    "auth.resetDesc": "Wir senden dir einen Link zum Zurücksetzen.",
    "auth.sendReset": "Link senden",
    "auth.backToLogin": "Zurück zur Anmeldung",
    "auth.resetSent": "E-Mail gesendet! Prüfe dein Postfach.",
    "auth.passwordMismatch": "Passwörter stimmen nicht überein",
    "auth.newPassword": "Neues Passwort",
    "auth.setNewPassword": "Neues Passwort setzen",
    "auth.passwordUpdated": "Passwort erfolgreich geändert!",
    // Settings
    "settings.title": "Einstellungen",
    "settings.appearance": "Erscheinungsbild",
    "settings.appearanceDesc": "Hell / Dunkel / System",
    "settings.language": "Sprache",
    "settings.languageDesc": "Deutsch",
    "settings.notifications": "Benachrichtigungen",
    "settings.notificationsDesc": "Erinnerungen verwalten",
    "settings.privacy": "Datenschutz & Sicherheit",
    "settings.privacyDesc": "Deine Daten schützen",
    "settings.export": "Datenexport",
    "settings.exportDesc": "CSV exportieren",
    "settings.help": "Hilfe & Support",
    "settings.helpDesc": "FAQ und Kontakt",
    "settings.logout": "Abmelden",
    "settings.version": "TrendFlow v1.0 · Made with ♡",
    // Appearance sheet
    "appearance.light": "Hell",
    "appearance.dark": "Dunkel",
    "appearance.system": "System",
    // Language sheet
    "language.de": "Deutsch",
    "language.en": "English",
    // Notifications
    "notifications.title": "Benachrichtigungen",
    "notifications.daily": "Tägliche Erinnerung",
    "notifications.dailyDesc": "Erinnere mich ans Eintragen",
    "notifications.weekly": "Wöchentliche Zusammenfassung",
    "notifications.weeklyDesc": "Überblick über deine Woche",
    "notifications.notSupported": "Benachrichtigungen werden vom Browser nicht unterstützt.",
    // Privacy
    "privacy.title": "Datenschutz & Sicherheit",
    "privacy.deleteData": "Alle Daten löschen",
    "privacy.deleteDataDesc": "Alle lokalen Daten unwiderruflich entfernen",
    "privacy.deleteConfirm": "Wirklich alle Daten löschen? Das kann nicht rückgängig gemacht werden.",
    "privacy.dataDeleted": "Alle Daten wurden gelöscht.",
    // Export
    "export.title": "Datenexport",
    "export.csv": "Als CSV exportieren",
    "export.csvDesc": "Alle Sammlungen als CSV-Datei herunterladen",
    "export.noData": "Keine Daten zum Exportieren.",
    "export.success": "Export erfolgreich heruntergeladen!",
    // Help
    "help.title": "Hilfe & Support",
    "help.faq": "Häufige Fragen",
    "help.faq1q": "Wie erstelle ich eine neue Sammlung?",
    "help.faq1a": "Tippe auf das + Symbol auf dem Dashboard, um eine neue Datensammlung anzulegen.",
    "help.faq2q": "Wie füge ich einen Eintrag hinzu?",
    "help.faq2a": "Öffne eine Sammlung und tippe auf das + Symbol, oder nutze den Quick-Add Button auf dem Dashboard.",
    "help.faq3q": "Werden meine Daten gesichert?",
    "help.faq3a": "Deine Daten werden lokal gespeichert. Erstelle einen Account, um sie in der Cloud zu sichern.",
    "help.contact": "Kontakt",
    "help.contactDesc": "Schreibe uns eine E-Mail an support@trendflow.app",
    // Common
    "common.cancel": "Abbrechen",
    "common.save": "Speichern",
    "common.delete": "Löschen",
    "common.close": "Schließen",
    "common.back": "Zurück",
    "common.loading": "Laden...",
    "common.error": "Fehler",
    "common.success": "Erfolg",
  },
  en: {
    "nav.overview": "Overview",
    "nav.charts": "Charts",
    "nav.entries": "Entries",
    "nav.account": "Account",
    "nav.settings": "Settings",
    "dashboard.title": "TrendFlow",
    "dashboard.subtitle": "Your data collections",
    "dashboard.empty": "No collections yet",
    "dashboard.emptyDesc": "Create your first data collection to start tracking.",
    "dashboard.createCollection": "Create collection",
    "dashboard.noEntries": "No entries yet",
    "dashboard.justNow": "just now",
    "dashboard.minsAgo": "{n} min. ago",
    "dashboard.hoursAgo": "{n} hrs ago",
    "charts.title": "Charts",
    "charts.noData": "No data available yet.",
    "charts.noRange": "No data in selected range.",
    "charts.average": "Average",
    "charts.minimum": "Minimum",
    "charts.maximum": "Maximum",
    "charts.count": "Entries",
    "charts.goal": "Goal",
    "charts.all": "All",
    "charts.pickDate": "Pick day",
    "charts.selectedDay": "Selected day",
    "charts.pickDate": "Pick day",
    "charts.selectedDay": "Selected day",
    "entries.title": "Entries",
    "entries.empty": "No entries yet.",
    "entries.notFound": "No entries found.",
    "entries.search": "Search...",
    "entry.new": "New entry",
    "entry.date": "Date",
    "entry.value": "Value",
    "entry.note": "Note (optional)",
    "entry.notePlaceholder": "e.g. After workout",
    "entry.save": "Save",
    "collection.new": "New collection",
    "collection.title": "Title",
    "collection.titlePlaceholder": "e.g. Weight",
    "collection.unit": "Unit",
    "collection.unitPlaceholder": "e.g. kg, hours, €",
    "collection.color": "Color",
    "collection.create": "Create",
    "account.title": "Account",
    "account.guest": "Guest user",
    "account.guestDesc": "Create an account to secure your data",
    "account.cloudSync": "Cloud sync",
    "account.cloudSyncDesc": "Store data securely in the cloud",
    "account.activity": "Activity",
    "account.activityDesc": "Your usage overview",
    "account.loginRegister": "Sign up / Log in",
    "account.loggedInAs": "Logged in as",
    "account.email": "Email",
    "account.memberSince": "Member since",
    "auth.login": "Log in",
    "auth.register": "Sign up",
    "auth.email": "Email",
    "auth.password": "Password",
    "auth.confirmPassword": "Confirm password",
    "auth.forgotPassword": "Forgot password?",
    "auth.noAccount": "No account yet?",
    "auth.hasAccount": "Already have an account?",
    "auth.resetPassword": "Reset password",
    "auth.resetDesc": "We'll send you a reset link.",
    "auth.sendReset": "Send link",
    "auth.backToLogin": "Back to login",
    "auth.resetSent": "Email sent! Check your inbox.",
    "auth.passwordMismatch": "Passwords don't match",
    "auth.newPassword": "New password",
    "auth.setNewPassword": "Set new password",
    "auth.passwordUpdated": "Password updated successfully!",
    "settings.title": "Settings",
    "settings.appearance": "Appearance",
    "settings.appearanceDesc": "Light / Dark / System",
    "settings.language": "Language",
    "settings.languageDesc": "English",
    "settings.notifications": "Notifications",
    "settings.notificationsDesc": "Manage reminders",
    "settings.privacy": "Privacy & Security",
    "settings.privacyDesc": "Protect your data",
    "settings.export": "Data export",
    "settings.exportDesc": "Export CSV",
    "settings.help": "Help & Support",
    "settings.helpDesc": "FAQ and contact",
    "settings.logout": "Log out",
    "settings.version": "TrendFlow v1.0 · Made with ♡",
    "appearance.light": "Light",
    "appearance.dark": "Dark",
    "appearance.system": "System",
    "language.de": "Deutsch",
    "language.en": "English",
    "notifications.title": "Notifications",
    "notifications.daily": "Daily reminder",
    "notifications.dailyDesc": "Remind me to log data",
    "notifications.weekly": "Weekly summary",
    "notifications.weeklyDesc": "Overview of your week",
    "notifications.notSupported": "Notifications are not supported by this browser.",
    "privacy.title": "Privacy & Security",
    "privacy.deleteData": "Delete all data",
    "privacy.deleteDataDesc": "Permanently remove all local data",
    "privacy.deleteConfirm": "Really delete all data? This cannot be undone.",
    "privacy.dataDeleted": "All data has been deleted.",
    "export.title": "Data export",
    "export.csv": "Export as CSV",
    "export.csvDesc": "Download all collections as a CSV file",
    "export.noData": "No data to export.",
    "export.success": "Export downloaded successfully!",
    "help.title": "Help & Support",
    "help.faq": "Frequently asked questions",
    "help.faq1q": "How do I create a new collection?",
    "help.faq1a": "Tap the + icon on the dashboard to create a new data collection.",
    "help.faq2q": "How do I add an entry?",
    "help.faq2a": "Open a collection and tap the + icon, or use the quick-add button on the dashboard.",
    "help.faq3q": "Is my data backed up?",
    "help.faq3a": "Your data is stored locally. Create an account to back it up in the cloud.",
    "help.contact": "Contact",
    "help.contactDesc": "Send us an email at support@trendflow.app",
    "common.cancel": "Cancel",
    "common.save": "Save",
    "common.delete": "Delete",
    "common.close": "Close",
    "common.back": "Back",
    "common.loading": "Loading...",
    "common.error": "Error",
    "common.success": "Success",
  },
} as const;

type TranslationKey = keyof typeof translations.de;

interface I18nContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    return (localStorage.getItem("trendflow_lang") as Lang) || "de";
  });

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem("trendflow_lang", l);
  };

  const t = (key: TranslationKey, params?: Record<string, string | number>): string => {
    let text: string = translations[lang][key] || translations.de[key] || key;
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, String(v));
      });
    }
    return text;
  };

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
