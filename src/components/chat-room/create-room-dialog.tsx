"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { createChatRoom } from "@/app/actions/chat-room";

const TOPICS = [
  "Free Conversation",
  "Travel & Places",
  "Food & Cooking",
  "Movies & TV",
  "Music",
  "Sports",
  "Technology",
  "Books & Literature",
  "Current Events",
  "Daily Life",
];

const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];
const MAX_MEMBERS_OPTIONS = [2, 5, 10, 15, 20];
const DURATION_OPTIONS = [
  { label: "15 min", value: 15 },
  { label: "30 min", value: 30 },
  { label: "45 min", value: 45 },
  { label: "1 hour", value: 60 },
];

type Props = {
  onClose: () => void;
};

export function CreateRoomDialog({ onClose }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [topic, setTopic] = useState("Free Conversation");
  const [cefrLevel, setCefrLevel] = useState("B1");
  const [maxMembers, setMaxMembers] = useState(10);
  const [duration, setDuration] = useState(30);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || name.trim().length < 3) {
      setError("Room name must be at least 3 characters.");
      return;
    }
    setError(null);

    startTransition(async () => {
      const result = await createChatRoom({
        name,
        topic,
        cefr_level: cefrLevel,
        max_members: maxMembers,
        duration_minutes: duration,
      });

      if ("error" in result) {
        setError(result.error);
        return;
      }

      router.push(`/chat-room/${result.roomId}`);
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
      aria-label="Create a new chat room"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-[#0d0d1e] p-6 shadow-2xl shadow-black/60">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-white">Create a Room</h2>
            <p className="mt-0.5 text-sm text-slate-400">
              Set up your language practice room
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-400 transition hover:bg-white/10 hover:text-white"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Room name */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-300">
              Room Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={60}
              placeholder="e.g. Beginner Coffee Chat"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20"
              required
            />
          </div>

          {/* Topic */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-300">
              Topic
            </label>
            <div className="flex flex-wrap gap-2">
              {TOPICS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTopic(t)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                    topic === t
                      ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/30"
                      : "border border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* CEFR level */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-300">
              CEFR Level
            </label>
            <div className="flex gap-2">
              {CEFR_LEVELS.map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setCefrLevel(lvl)}
                  className={`flex-1 rounded-xl py-2 text-xs font-bold transition ${
                    cefrLevel === lvl
                      ? "bg-violet-500 text-white shadow-md shadow-violet-500/30"
                      : "border border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Max members + Duration — two columns */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-300">
                Max Members
              </label>
              <div className="flex flex-wrap gap-1.5">
                {MAX_MEMBERS_OPTIONS.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setMaxMembers(n)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                      maxMembers === n
                        ? "bg-cyan-500 text-white shadow-md shadow-cyan-500/30"
                        : "border border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-300">
                Duration
              </label>
              <div className="flex flex-wrap gap-1.5">
                {DURATION_OPTIONS.map(({ label, value }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setDuration(value)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                      duration === value
                        ? "bg-amber-500 text-white shadow-md shadow-amber-500/30"
                        : "border border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {error && (
            <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/30 transition hover:from-emerald-400 hover:to-teal-500 disabled:opacity-50"
            >
              {isPending ? "Creating…" : "Create Room"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
