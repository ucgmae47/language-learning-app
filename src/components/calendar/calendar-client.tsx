"use client";

import { useState, useCallback } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import type { Language } from "@/lib/supabase/types";

type CalendarEvent = {
  date: string;
  name: string;
  country: string;
  emoji: string;
  description: string;
  type: "holiday" | "festival" | "cultural";
};

type CalendarData = {
  events: CalendarEvent[];
  month_note: string;
};

type Props = {
  language: Language;
  initialYear: number;
  initialMonth: number;
  initialData: CalendarData | null;
};

const TYPE_COLORS: Record<string, string> = {
  holiday: "bg-red-500/20 text-red-300 border-red-500/30",
  festival: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  cultural: "bg-blue-500/20 text-blue-300 border-blue-500/30",
};

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function CalendarClient({ language, initialYear, initialMonth, initialData }: Props) {
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [data, setData] = useState<CalendarData | null>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async (y: number, m: number) => {
    setIsLoading(true);
    setError(null);
    setSelectedEvent(null);
    try {
      const res = await fetch(`/api/calendar/events?language=${language}&year=${y}&month=${m}`);
      if (!res.ok) throw new Error("Failed to load events");
      const result = (await res.json()) as CalendarData;
      setData(result);
    } catch {
      setError("Couldn't load events. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [language]);

  function navigate(delta: number) {
    let newMonth = month + delta;
    let newYear = year;
    if (newMonth > 12) { newMonth = 1; newYear++; }
    if (newMonth < 1) { newMonth = 12; newYear--; }
    setMonth(newMonth);
    setYear(newYear);
    void fetchEvents(newYear, newMonth);
  }

  // Build calendar grid
  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();

  const eventsByDate = (data?.events ?? []).reduce<Record<string, CalendarEvent[]>>((acc, ev) => {
    const day = ev.date.split("-")[2];
    if (day) {
      const d = String(parseInt(day, 10));
      if (!acc[d]) acc[d] = [];
      acc[d].push(ev);
    }
    return acc;
  }, {});

  const cells: (number | null)[] = [
    ...Array.from({ length: firstDay }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  // Pad to complete rows
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="flex flex-col gap-6">
      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate(-1)}
          disabled={isLoading}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-400 transition hover:bg-white/10 hover:text-white disabled:opacity-40"
          aria-label="Previous month"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
        </button>

        <div className="text-center">
          <p className="text-xl font-extrabold text-white">
            {MONTH_NAMES[month - 1]} {year}
          </p>
          {isLoading && <Loader2 className="mx-auto mt-1 h-4 w-4 animate-spin text-slate-500" aria-hidden="true" />}
        </div>

        <button
          type="button"
          onClick={() => navigate(1)}
          disabled={isLoading}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-400 transition hover:bg-white/10 hover:text-white disabled:opacity-40"
          aria-label="Next month"
        >
          <ChevronRight className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Calendar grid */}
      <div className="rounded-2xl border border-white/8 bg-white/3 overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-white/8">
          {DAY_NAMES.map((d) => (
            <div key={d} className="py-2 text-center text-xs font-bold text-slate-500">
              {d}
            </div>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7">
          {cells.map((day, idx) => {
            const dayEvents = day ? (eventsByDate[String(day)] ?? []) : [];
            const isToday =
              day === new Date().getDate() &&
              month === new Date().getMonth() + 1 &&
              year === new Date().getFullYear();

            return (
              <div
                key={idx}
                className={`min-h-[52px] border-b border-r border-white/5 p-1.5 ${
                  !day ? "opacity-0 pointer-events-none" : ""
                }`}
              >
                {day && (
                  <>
                    <p
                      className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full ${
                        isToday
                          ? "bg-violet-500 text-white"
                          : "text-slate-400"
                      }`}
                    >
                      {day}
                    </p>
                    {dayEvents.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-0.5">
                        {dayEvents.slice(0, 3).map((ev, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setSelectedEvent(ev === selectedEvent ? null : ev)}
                            title={ev.name}
                            className="text-sm leading-none transition hover:scale-110"
                            aria-label={ev.name}
                          >
                            {ev.emoji}
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected event detail */}
      {selectedEvent && (
        <div className="rounded-2xl border border-white/8 bg-white/4 p-4">
          <div className="flex items-start gap-3">
            <span className="text-3xl" aria-hidden="true">{selectedEvent.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-white">{selectedEvent.name}</p>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-xs text-slate-400">{selectedEvent.country}</span>
                <span
                  className={`rounded-lg border px-2 py-0.5 text-xs font-semibold capitalize ${TYPE_COLORS[selectedEvent.type] ?? TYPE_COLORS["cultural"]}`}
                >
                  {selectedEvent.type}
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-300 leading-relaxed">{selectedEvent.description}</p>
            </div>
          </div>
        </div>
      )}

      {/* Month note */}
      {data?.month_note && (
        <div className="rounded-2xl border border-violet-500/20 bg-violet-500/10 px-4 py-3">
          <p className="text-xs font-bold text-violet-400 mb-1">📅 Cultural Note</p>
          <p className="text-sm text-violet-200/90 leading-relaxed">{data.month_note}</p>
        </div>
      )}

      {/* Events list */}
      {data && data.events.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-bold text-slate-400">All Events This Month</p>
          {data.events
            .sort((a, b) => a.date.localeCompare(b.date))
            .map((ev, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setSelectedEvent(ev === selectedEvent ? null : ev)}
                className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-left transition ${
                  selectedEvent === ev
                    ? "border-violet-500/40 bg-violet-500/10"
                    : "border-white/8 bg-white/3 hover:bg-white/5"
                }`}
              >
                <span className="text-xl shrink-0 mt-0.5" aria-hidden="true">{ev.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-white truncate">{ev.name}</p>
                    <span className="text-xs text-slate-500 shrink-0">
                      {new Date(ev.date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{ev.country}</p>
                </div>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
