import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, ClipboardList, Check, X, Clock } from "lucide-react";
import type { HistoryDay, ActivityEntry } from "@/types";

interface Props {
  history: HistoryDay[];
  activityLog: ActivityEntry[];
}

export function HistoryView({ history, activityLog }: Props) {
  const [subView, setSubView] = useState<"days" | "log">("days");

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatLogTime = (ts: number) =>
    new Date(ts).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

  const actionLabel: Record<string, string> = {
    login: "logged in",
    logout: "logged out",
    added: "added task",
    completed: "completed task",
    uncompleted: "uncompleted task",
    deleted: "deleted task",
  };

  return (
    <div className="space-y-4">
      <Tabs
        value={subView}
        onValueChange={(v) => setSubView(v as "days" | "log")}
      >
        <TabsList className="bg-slate-800/60 border border-slate-700/60 w-full">
          <TabsTrigger
            value="days"
            className="flex-1 data-[state=active]:bg-amber-500 data-[state=active]:text-slate-950"
          >
            <Calendar className="w-4 h-4 mr-1.5" />
            Past Days
          </TabsTrigger>
          <TabsTrigger
            value="log"
            className="flex-1 data-[state=active]:bg-amber-500 data-[state=active]:text-slate-950"
          >
            <ClipboardList className="w-4 h-4 mr-1.5" />
            Activity Log
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {subView === "days" ? (
        history.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 mb-4">
              <Calendar className="w-7 h-7 text-slate-700" />
            </div>
            <p className="text-slate-500 font-medium">No past days yet</p>
            <p className="text-slate-600 text-sm mt-1">
              History builds up automatically as days pass
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((day) => {
              const done = day.tasks.filter((t) => t.done).length;
              const missed = day.tasks.filter((t) => !t.done).length;
              return (
                <div
                  key={day.date}
                  className="rounded-xl bg-slate-900/80 border border-slate-800 overflow-hidden"
                >
                  <div className="flex items-center justify-between px-4 py-3 bg-slate-900/60 border-b border-slate-800">
                    <div className="flex items-center gap-2 min-w-0">
                      <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
                      <span className="font-semibold text-slate-100 text-sm sm:text-base truncate">
                        {formatDate(day.date)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs shrink-0">
                      <span className="flex items-center gap-1 text-emerald-400">
                        <Check className="w-3 h-3" />
                        {done}
                      </span>
                      <span className="flex items-center gap-1 text-red-400">
                        <X className="w-3 h-3" />
                        {missed}
                      </span>
                    </div>
                  </div>
                  <div className="divide-y divide-slate-800/60">
                    {day.tasks.map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center gap-3 px-4 py-2.5"
                      >
                        <div
                          className={
                            "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 " +
                            (task.done
                              ? "bg-emerald-500 border-emerald-500"
                              : "border-red-500/50 bg-red-950/30")
                          }
                        >
                          {task.done ? (
                            <Check className="w-3 h-3 text-slate-950" />
                          ) : (
                            <X className="w-3 h-3 text-red-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className={
                              "text-sm truncate " +
                              (task.done
                                ? "text-slate-400 line-through"
                                : "text-slate-200")
                            }
                          >
                            {task.title}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-slate-500 truncate">
                              {task.assignee}
                            </span>
                            <span className="text-xs text-slate-600 flex items-center gap-0.5 shrink-0">
                              <Clock className="w-3 h-3" />
                              {task.deadline}
                            </span>
                          </div>
                        </div>
                        <span
                          className={
                            "text-xs font-semibold uppercase tracking-wide shrink-0 " +
                            (task.done ? "text-emerald-500" : "text-red-400")
                          }
                        >
                          {task.done ? "Done" : "Missed"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        <div className="rounded-xl bg-slate-900/80 border border-slate-800 overflow-hidden">
          {activityLog.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-500 font-medium">No activity yet</p>
              <p className="text-slate-600 text-sm mt-1">
                Actions will appear here as they happen
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/60">
              {[...activityLog].reverse().map((entry) => (
                <div key={entry.id} className="flex items-start gap-3 px-4 py-3">
                  <span className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 text-xs font-semibold shrink-0">
                    {entry.user.charAt(0).toUpperCase()}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-200">
                      <span className="font-semibold text-amber-400">
                        {entry.user}
                      </span>{" "}
                      <span className="text-slate-400">
                        {actionLabel[entry.action] || entry.action}
                      </span>
                      {entry.detail && (
                        <span className="text-slate-300"> — "{entry.detail}"</span>
                      )}
                    </p>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {formatLogTime(entry.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}