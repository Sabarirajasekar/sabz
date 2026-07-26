import { useEffect, useRef } from "react";
import type { Task } from "@/types";

interface Props {
  tasks: Task[];
  onOverdue: (task: Task) => void;
}

export function useOverdueChecker({ tasks, onOverdue }: Props) {
  const alarmedRef = useRef<Map<string, number>>(new Map());
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playBeep = () => {
    try {
      if (!audioCtxRef.current) {
        const Ctx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext;
        if (!Ctx) return;
        audioCtxRef.current = new Ctx();
      }
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      if (ctx.state === "suspended") ctx.resume();

      const playTone = (freq: number, start: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = freq;
        osc.type = "square";
        gain.gain.setValueAtTime(0, ctx.currentTime + start);
        gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + start + 0.02);
        gain.gain.exponentialRampToValueAtTime(
          0.001,
          ctx.currentTime + start + duration
        );
        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + duration);
      };

      // Triple-tone attention-grabbing alarm
      playTone(880, 0, 0.12);
      playTone(880, 0.2, 0.12);
      playTone(1100, 0.4, 0.18);
    } catch {
      /* audio not available */
    }
  };

  useEffect(() => {
    const check = () => {
      const now = new Date();
      const nowStr = `${String(now.getHours()).padStart(2, "0")}:${String(
        now.getMinutes()
      ).padStart(2, "0")}`;
      const nowMs = Date.now();

      for (const task of tasks) {
        if (task.done) {
          alarmedRef.current.delete(task.id);
          continue;
        }
        if (task.deadline <= nowStr) {
          const lastAlarm = alarmedRef.current.get(task.id);
          // Alarm on first detection, then repeat every 30 seconds
          if (!lastAlarm || nowMs - lastAlarm > 30000) {
            alarmedRef.current.set(task.id, nowMs);
            playBeep();
            onOverdue(task);
          }
        }
      }
    };

    check();
    const interval = setInterval(check, 10000);
    return () => clearInterval(interval);
  }, [tasks, onOverdue]);
}