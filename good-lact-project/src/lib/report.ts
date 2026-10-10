import { answered } from './diary';
import { todayKey } from './storage';
import type { Consumption, DailyLog, SymptomEntry } from '../types';

export interface ReportDay {
  date: string;
  totalPills: number;
  consumptions: Consumption[];
  symptoms: SymptomEntry[];
}

export interface Report {
  days: ReportDay[];
  totalPills: number;
  daysWithData: number;
  symptomCounts: Record<0 | 1 | 2 | 3, number>;
}

export const REPORT_DAYS = 30;

/** Riepilogo degli ultimi 30 giorni dai soli dati registrati dall'utente. */
export function buildReport(today: Consumption[], history: DailyLog[], entries: SymptomEntry[], now: Date = new Date()): Report {
  const byDay = new Map<string, Consumption[]>();
  byDay.set(todayKey(now), today);
  for (const h of history) byDay.set(h.date, h.consumptions);

  const real = answered(entries);
  const days: ReportDay[] = [];
  for (let i = 0; i < REPORT_DAYS; i += 1) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = todayKey(d);
    const consumptions = byDay.get(key) ?? [];
    const symptoms = real.filter((e) => todayKey(new Date(e.at)) === key);
    if (consumptions.length === 0 && symptoms.length === 0) continue;
    days.push({ date: key, totalPills: consumptions.reduce((a, c) => a + c.pills, 0), consumptions, symptoms });
  }

  const symptomCounts = { 0: 0, 1: 0, 2: 0, 3: 0 };
  for (const day of days) for (const s of day.symptoms) symptomCounts[s.severity] += 1;
  return {
    days,
    totalPills: days.reduce((a, d) => a + d.totalPills, 0),
    daysWithData: days.length,
    symptomCounts,
  };
}
