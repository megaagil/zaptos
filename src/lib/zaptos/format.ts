import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { StatusOS } from "./types";

export function todayKey(now = new Date()) {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function keyToDate(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y || 1970, (m || 1) - 1, d || 1);
}

export function addDaysKey(key: string, days: number) {
  const dt = keyToDate(key);
  dt.setDate(dt.getDate() + days);
  return todayKey(dt);
}

export function stamp(day: string, time: string) {
  return `${day}T${time}:00`;
}

export function nowStamp(now = new Date()) {
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  return stamp(todayKey(now), `${hh}:${mm}`);
}

export function formatMoney(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatValor(value: number) {
  if (!value) return "A orçar";
  return formatMoney(value);
}

export function formatDayLong(key: string) {
  const raw = format(keyToDate(key), "EEEE, d 'de' MMMM", { locale: ptBR });
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

export function formatDayShort(key: string) {
  return format(keyToDate(key), "EEE d MMM", { locale: ptBR }).replace(".", "");
}

export function formatWeekday(key: string) {
  return format(keyToDate(key), "EEE", { locale: ptBR }).replace(".", "");
}

export function formatDayNum(key: string) {
  return format(keyToDate(key), "d", { locale: ptBR });
}

export function hourOf(iso: string) {
  return (iso.split("T")[1] || "").slice(0, 5);
}

export function relativeDay(key: string, today = todayKey()) {
  if (!key) return "";
  if (key === today) return "Hoje";
  if (key === addDaysKey(today, 1)) return "Amanhã";
  if (key === addDaysKey(today, -1)) return "Ontem";
  return formatDayShort(key);
}

export function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export function maskCep(value: string) {
  const d = value.replace(/\D/g, "").slice(0, 8);
  if (d.length <= 5) return d;
  return `${d.slice(0, 5)}-${d.slice(5)}`;
}

export function maskPhone(value: string) {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function firstName(nome: string) {
  return nome.trim().split(/\s+/)[0] || nome;
}

export function horaFim(hora: string, duracaoMin: number) {
  const [h, m] = hora.split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m) || !(duracaoMin > 0)) return "";
  const total = h * 60 + m + duracaoMin;
  const hh = Math.floor(total / 60) % 24;
  const mm = total % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

export function isLate(day: string, hora: string, status: StatusOS, now = new Date()) {
  if (!day || !hora) return false;
  if (status !== "aberta" && status !== "agendada") return false;
  const key = todayKey(now);
  if (day > key) return false;
  if (day < key) return true;
  const cur = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  return hora < cur;
}

export function brDate(key: string) {
  if (!key) return "";
  const [y, m, d] = key.split("-");
  return `${d}/${m}/${y}`;
}
