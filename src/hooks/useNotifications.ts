import { useEffect, useCallback, useRef } from "react";
import { useCollections } from "./useCollections";
import { useI18n } from "@/lib/i18n";

const LAST_REMINDERS_KEY = "trendflow_last_reminders"; // JSON: { "2026-04-10": [8, 20] }
const REMINDER_HOURS_KEY = "trendflow_reminder_hours"; // JSON array e.g. [8, 20]

export function getReminderHours(): number[] {
  try {
    const raw = localStorage.getItem(REMINDER_HOURS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed.sort((a: number, b: number) => a - b);
    }
  } catch {}
  return [20]; // default
}

export function setReminderHours(hours: number[]) {
  localStorage.setItem(REMINDER_HOURS_KEY, JSON.stringify([...new Set(hours)].sort((a, b) => a - b)));
}

export function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) return Promise.resolve(false);
  if (Notification.permission === "granted") return Promise.resolve(true);
  if (Notification.permission === "denied") return Promise.resolve(false);
  return Notification.requestPermission().then((p) => p === "granted");
}

export function canNotify(): boolean {
  return "Notification" in window && Notification.permission === "granted";
}

export function sendNotification(title: string, body: string, icon?: string) {
  if (!canNotify()) return;
  try {
    new Notification(title, {
      body,
      icon: icon || "/TrendFlow.png",
      badge: "/TrendFlow.png",
      tag: "trendflow-" + Date.now(),
    });
  } catch {
    // Fallback: some mobile browsers don't support Notification constructor
  }
}

/** Notify when a goal is reached */
export function notifyGoalReached(collectionTitle: string, value: number, goalValue: number, unit: string, lang: string) {
  if (!canNotify()) return;
  if (localStorage.getItem("trendflow_notif_goal") !== "true") return;
  
  const percent = Math.round((value / goalValue) * 100);
  if (percent < 100) return;

  const titles: Record<string, string> = {
    de: "🎯 Ziel erreicht!",
    en: "🎯 Goal reached!",
    zh: "🎯 目标达成！",
    es: "🎯 ¡Meta alcanzada!",
    pt: "🎯 Meta alcançada!",
    fr: "🎯 Objectif atteint !",
    ar: "🎯 تم تحقيق الهدف!",
    ja: "🎯 目標達成！",
    ko: "🎯 목표 달성!",
  };
  
  const bodies: Record<string, string> = {
    de: `${collectionTitle}: ${value} ${unit} von ${goalValue} ${unit} erreicht!`,
    en: `${collectionTitle}: ${value} ${unit} of ${goalValue} ${unit} reached!`,
    zh: `${collectionTitle}：已达成 ${value} ${unit}，目标 ${goalValue} ${unit}！`,
    es: `${collectionTitle}: ¡${value} ${unit} de ${goalValue} ${unit} alcanzado!`,
    pt: `${collectionTitle}: ${value} ${unit} de ${goalValue} ${unit} alcançado!`,
    fr: `${collectionTitle}: ${value} ${unit} sur ${goalValue} ${unit} atteint !`,
    ar: `${collectionTitle}: تم تحقيق ${value} ${unit} من ${goalValue} ${unit}!`,
    ja: `${collectionTitle}: ${value} ${unit} / ${goalValue} ${unit} 達成！`,
    ko: `${collectionTitle}: ${value} ${unit} / ${goalValue} ${unit} 달성!`,
  };

  sendNotification(titles[lang] || titles.en, bodies[lang] || bodies.en);
}

function getSentHoursToday(): number[] {
  try {
    const raw = localStorage.getItem(LAST_REMINDERS_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    const today = new Date().toISOString().split("T")[0];
    return Array.isArray(data[today]) ? data[today] : [];
  } catch { return []; }
}

function markHourSent(hour: number) {
  const today = new Date().toISOString().split("T")[0];
  // Only keep today's data
  const sent = getSentHoursToday();
  sent.push(hour);
  localStorage.setItem(LAST_REMINDERS_KEY, JSON.stringify({ [today]: sent }));
}

/** Hook: checks daily reminder schedule (supports multiple times) */
export function useDailyReminder() {
  const { collections } = useCollections();
  const { lang } = useI18n();
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const checkReminder = useCallback(() => {
    if (!canNotify()) return;
    if (localStorage.getItem("trendflow_notif_daily") !== "true") return;

    const now = new Date();
    const currentHour = now.getHours();
    const hours = getReminderHours();
    const sentToday = getSentHoursToday();

    // Find hours that are due (currentHour >= hour) and not yet sent
    const dueHours = hours.filter(h => currentHour >= h && !sentToday.includes(h));
    if (dueHours.length === 0) return;

    // Check if user already logged today
    const todayStr = now.toISOString().split("T")[0];
    const hasLoggedToday = collections.some((c) =>
      c.entries.some((e) => e.date === todayStr)
    );
    if (hasLoggedToday) return;

    const titles: Record<string, string> = {
      de: "📊 Daten eintragen",
      en: "📊 Log your data",
      zh: "📊 记录数据",
      es: "📊 Registra tus datos",
      pt: "📊 Registre seus dados",
      fr: "📊 Enregistrez vos données",
      ar: "📊 سجّل بياناتك",
      ja: "📊 データを記録",
      ko: "📊 데이터를 기록하세요",
    };

    const bodies: Record<string, string> = {
      de: "Du hast heute noch keine Daten eingetragen. Jetzt nachholen!",
      en: "You haven't logged any data today. Catch up now!",
      zh: "你今天还没有记录数据。现在就记录吧！",
      es: "No has registrado datos hoy. ¡Hazlo ahora!",
      pt: "Você não registrou dados hoje. Faça agora!",
      fr: "Vous n'avez pas enregistré de données aujourd'hui. Faites-le maintenant !",
      ar: "لم تسجّل أي بيانات اليوم. سجّلها الآن!",
      ja: "今日はまだデータを記録していません。今すぐ記録しましょう！",
      ko: "오늘 아직 데이터를 기록하지 않았어요. 지금 기록하세요!",
    };

    // Send one notification and mark all due hours as sent
    sendNotification(titles[lang] || titles.en, bodies[lang] || bodies.en);
    dueHours.forEach(h => markHourSent(h));
  }, [collections, lang]);

  useEffect(() => {
    checkReminder();
    intervalRef.current = setInterval(checkReminder, 60_000);
    return () => clearInterval(intervalRef.current);
  }, [checkReminder]);
}
