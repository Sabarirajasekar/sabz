import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  HardHat,
  Plus,
  Trash2,
  Check,
  Clock,
  AlertTriangle,
  History,
  CalendarDays,
  ListTree,
  LogOut,
  Bell,
} from "lucide-react";
import { LoginScreen } from "@/components/LoginScreen";
import { useOverdueChecker } from "@/hooks/useOverdueChecker";
import { storage } from "@/lib/storage";
import type { Task, HistoryDay, ActivityEntry, Member } from "@/types";

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateKey(key: string) {
  const [y, m, d] = key.split("-");
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [history, setHistory] = useState<HistoryDay[]>([]);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [view, setView] = useState<"today" | "history">("today");
  const [historyTab, setHistoryTab] = useState<"days" | "activity">("days");
  const [title, setTitle] = useState("");
  const [assignee, setAssignee] = useState("");
  const [deadline, setDeadline] = useState("");
  const [booted, setBooted] = useState(false);

  // Load all persisted data on mount
  useEffect(() => {
    const storedUser = storage.getCurrentUser();
    const storedMembers = storage.getMembers();
    const storedTasks = storage.getTasks();
    const storedHistory = storage.getHistory();
    const storedActivity = storage.getActivity();

    // Archive previous day's tasks into history on load
    const tk = todayKey();
    const toArchive = storedTasks.filter((t) => {
      return (t as Task & { dayKey?: string }).dayKey && (t as Task & { dayKey?: string }).dayKey !== tk;
    });

    if (toArchive.length > 0) {
      const dayKeys = [...new Set(toArchive.map((t) => (t as Task & { dayKey?: string }).dayKey!))];
      const newHistory = [...storedHistory];
      for (const dk of dayKeys) {
        const existing = newHistory.find((h) => h.date === dk);
        const dayTasks = toArchive.filter((t) => (t as Task & { dayKey?: string }).dayKey === dk);
        if (existing) {
          existing.tasks = [...existing.tasks, ...dayTasks];
        } else {
          newHistory.push({ date: dk, tasks: dayTasks });
        }
      }
      const remaining = storedTasks.filter((t) => !(t as Task & { dayKey?: string }).dayKey || (t as Task & { dayKey?: string }).dayKey === tk);
      storage.saveHistory(newHistory);
      storage.saveTasks(remaining);
      setHistory(newHistory);
      setTasks(remaining);
    } else {
      setHistory(storedHistory);
      setTasks(storedTasks);
    }

    setMembers(storedMembers);
    setActivity(storedActivity);
    setCurrentUser(storedUser);
    setBooted(true);
  }, []);

  // Persist on every change
  useEffect(() => {
    if (booted) storage.saveTasks(tasks);
  }, [tasks, booted]);
  useEffect(() => {
    if (booted) storage.saveHistory(history);
  }, [history, booted]);
  useEffect(() => {
    if (booted) storage.saveActivity(activity);
  }, [activity, booted]);
  useEffect(() => {
    if (booted) storage.saveMembers(members);
  }, [members, booted]);
  useEffect(() => {
    if (booted) storage.saveCurrentUser(currentUser);
  }, [currentUser, booted]);

  const logActivity = useCallback(
    (action: string, detail?: string) => {
      if (!currentUser) return;
      const entry: ActivityEntry = {
        id: crypto.randomUUID(),
        user: currentUser,
        action,
        detail,
        timestamp: Date.now(),
      };
      setActivity((prev) => [entry, ...prev]);
    },
    [currentUser]
  );

  const handleLogin = (name: string) => {
    setCurrentUser(name);
    if (!members.find((m) => m.name === name)) {
      const newMember: Member = { id: crypto.randomUUID(), name };
      setMembers((prev) => [...prev, newMember]);
    }
    setAssignee(name);

    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    const entry: ActivityEntry = {
      id: crypto.randomUUID(),
      user: name,
      action: "logged in",
      timestamp: Date.now(),
    };
    setActivity((prev) => [entry, ...prev]);
  };

  const handleLogout = () => {
    logActivity("logged out");
    setCurrentUser(null);
  };

  const handleOverdue = useCallback((task: Task) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, overdue: true } : t))
    );

    toast.error(`OVERDUE: ${task.title}`, {
      description: `Assigned to ${task.assignee} — deadline ${task.deadline}. Tap the circle to stop the alarm.`,
      duration: 10000,
    });

    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(`⚠️ Overdue: ${task.title}`, {
        body: `Assigned to ${task.assignee}. Deadline was ${task.deadline}. Tap the circle to stop the alarm.`,
      });
    }
  }, []);

  useOverdueChecker({ tasks, onOverdue: handleOverdue });

  const addTask = () => {
    if (!title.trim() || !assignee || !deadline) {
      toast.warning("Please fill in all fields");
      return;
    }
    const task: Task = {
      id: crypto.randomUUID(),
      title: title.trim(),
      assignee,
      deadline,
      done: false,
      overdue: false,
      createdAt: Date.now(),
      createdBy: currentUser || "unknown",
    };
    setTasks((prev) => [...prev, task]);
    setTitle("");
    setDeadline("");
    logActivity("added task", `"${task.title}" assigned to ${assignee}`);
    toast.success("Task added");
  };

  const toggleDone = (id: string) => {
    let taskTitle = "";
    let wasDone = false;
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          taskTitle = t.title;
          wasDone = t.done;
          return { ...t, done: !t.done, overdue: false };
        }
        return t;
      })
    );
    logActivity(wasDone ? "uncompleted task" : "completed task", `"${taskTitle}"`);
    if (!wasDone) toast.success("Task completed — alarm stopped");
  };

  const deleteTask = (id: string) => {
    const t = tasks.find((x) => x.id === id);
    setTasks((prev) => prev.filter((x) => x.id !== id));
    if (t) logActivity("deleted task", `"${t.title}"`);
  };

  if (!booted) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400 text-sm">Loading...</div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginScreen members={members} onLogin={handleLogin} />;
  }

  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    return a.deadline.localeCompare(b.deadline);
  });

  const doneCount = tasks.filter((t) => t.done).length;
  const overdueCount = tasks.filter((t) => t.overdue && !t.done).length;

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-800">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 ring-1 ring-amber-500/30 flex items-center justify-center shrink-0">
            <HardHat className="w-5 h-5 text-amber-400" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="font-serif text-lg font-bold text-white leading-tight truncate">
              Daily Task Board
            </h1>
            <p className="text-xs text-slate-400 truncate">
              Signed in as <span className="text-amber-400 font-medium">{currentUser}</span>
            </p>
          </div>
          <Button
            onClick={handleLogout}
            variant="ghost"
            size="sm"
            className="text-slate-400 hover:text-white hover:bg-slate-800 shrink-0"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline ml-1">Switch</span>
          </Button>
        </div>

        {/* Tab toggle */}
        <div className="max-w-3xl mx-auto px-4 pb-3">
          <div className="flex gap-1 p-1 rounded-xl bg-slate-800/60">
            <button
              onClick={() => setView("today")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
                view === "today"
                  ? "bg-amber-500 text-slate-950"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Clock className="w-4 h-4" />
              Today
            </button>
            <button
              onClick={() => setView("history")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
                view === "history"
                  ? "bg-amber-500 text-slate-950"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <History className="w-4 h-4" />
              History
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-4 pb-24">
        {view === "today" ? (
          <>
            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="rounded-xl bg-slate-900 ring-1 ring-slate-800 p-3 text-center">
                <div className="text-2xl font-bold text-white">{tasks.length}</div>
                <div className="text-xs text-slate-400 mt-0.5">Total</div>
              </div>
              <div className="rounded-xl bg-slate-900 ring-1 ring-slate-800 p-3 text-center">
                <div className="text-2xl font-bold text-emerald-400">{doneCount}</div>
                <div className="text-xs text-slate-400 mt-0.5">Done</div>
              </div>
              <div className="rounded-xl bg-slate-900 ring-1 ring-slate-800 p-3 text-center">
                <div className={`text-2xl font-bold ${overdueCount > 0 ? "text-red-400" : "text-slate-500"}`}>
                  {overdueCount}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">Overdue</div>
              </div>
            </div>

            {/* Add task form */}
            <div className="rounded-2xl bg-slate-900 ring-1 ring-slate-800 shadow-lg p-4 mb-4">
              <div className="space-y-3">
                <div>
                  <Label className="text-slate-300 text-xs mb-1.5 block">Task title</Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addTask()}
                    placeholder="What needs to get done?"
                    className="bg-slate-800/60 border-slate-700 text-slate-100 placeholder:text-slate-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-slate-300 text-xs mb-1.5 block">Assign to</Label>
                    <Select value={assignee} onValueChange={setAssignee}>
                      <SelectTrigger className="bg-slate-800/60 border-slate-700 text-slate-100">
                        <SelectValue placeholder="Select member" />
                      </SelectTrigger>
                      <SelectContent>
                        {members.map((m) => (
                          <SelectItem key={m.id} value={m.name}>
                            {m.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-slate-300 text-xs mb-1.5 block">Deadline (today)</Label>
                    <Input
                      type="time"
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                      className="bg-slate-800/60 border-slate-700 text-slate-100"
                    />
                  </div>
                </div>
                <Button
                  onClick={addTask}
                  className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Task
                </Button>
              </div>
            </div>

            {/* Task list */}
            {sortedTasks.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <HardHat className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm">No tasks yet. Add one above to get started.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {sortedTasks.map((task) => (
                  <div
                    key={task.id}
                    className={`rounded-xl p-3 ring-1 transition-all ${
                      task.overdue && !task.done
                        ? "bg-red-950/40 ring-red-500/60 shadow-lg shadow-red-900/20 animate-pulse"
                        : task.done
                        ? "bg-slate-900/50 ring-slate-800 opacity-60"
                        : "bg-slate-900 ring-slate-800"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => toggleDone(task.id)}
                        className={`mt-0.5 w-7 h-7 rounded-full border-2 shrink-0 flex items-center justify-center transition-all ${
                          task.done
                            ? "bg-emerald-500 border-emerald-500"
                            : task.overdue
                            ? "border-red-500 hover:bg-red-500/20"
                            : "border-slate-600 hover:border-amber-400"
                        }`}
                        title={task.overdue && !task.done ? "Tap to complete & stop alarm" : "Mark as done"}
                      >
                        {task.done && <Check className="w-4 h-4 text-white" />}
                      </button>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start gap-2">
                          <p
                            className={`text-sm font-medium leading-snug break-words ${
                              task.done ? "text-slate-500 line-through" : "text-slate-100"
                            }`}
                          >
                            {task.title}
                          </p>
                          {task.overdue && !task.done && (
                            <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-red-400 bg-red-500/15 px-1.5 py-0.5 rounded">
                              <AlertTriangle className="w-3 h-3" />
                              Overdue
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            <span className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 text-[10px] font-bold">
                              {task.assignee.charAt(0).toUpperCase()}
                            </span>
                            {task.assignee}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {task.deadline}
                          </span>
                        </div>
                        {task.overdue && !task.done && (
                          <p className="text-[11px] text-red-400 mt-1.5 font-medium">
                            Tap the circle to complete & stop alarm
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="shrink-0 p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            {/* History sub-tabs */}
            <div className="flex gap-1 p-1 rounded-xl bg-slate-800/60 mb-4">
              <button
                onClick={() => setHistoryTab("days")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
                  historyTab === "days"
                    ? "bg-slate-700 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <CalendarDays className="w-4 h-4" />
                Past Days
              </button>
              <button
                onClick={() => setHistoryTab("activity")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
                  historyTab === "activity"
                    ? "bg-slate-700 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <ListTree className="w-4 h-4" />
                Activity Log
              </button>
            </div>

            {historyTab === "days" ? (
              history.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <CalendarDays className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">No past days yet. History builds up as you use the app.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {history
                    .sort((a, b) => b.date.localeCompare(a.date))
                    .map((day) => {
                      const dCount = day.tasks.filter((t) => t.done).length;
                      const mCount = day.tasks.length - dCount;
                      return (
                        <div
                          key={day.date}
                          className="rounded-2xl bg-slate-900 ring-1 ring-slate-800 overflow-hidden"
                        >
                          <div className="px-4 py-3 bg-slate-800/50 border-b border-slate-800 flex items-center justify-between">
                            <h3 className="font-serif font-bold text-white text-sm">
                              {formatDateKey(day.date)}
                            </h3>
                            <div className="flex gap-2 text-xs">
                              <span className="text-emerald-400">{dCount} done</span>
                              <span className="text-slate-600">·</span>
                              <span className="text-red-400">{mCount} missed</span>
                            </div>
                          </div>
                          <div className="divide-y divide-slate-800">
                            {day.tasks.map((task) => (
                              <div key={task.id} className="px-4 py-2.5 flex items-center gap-3">
                                <div
                                  className={`w-2 h-2 rounded-full shrink-0 ${
                                    task.done ? "bg-emerald-500" : "bg-red-500"
                                  }`}
                                />
                                <div className="min-w-0 flex-1">
                                  <p
                                    className={`text-sm break-words ${
                                      task.done ? "text-slate-500 line-through" : "text-slate-200"
                                    }`}
                                  >
                                    {task.title}
                                  </p>
                                  <p className="text-xs text-slate-500 mt-0.5">
                                    {task.assignee} · {task.deadline}
                                  </p>
                                </div>
                                <span
                                  className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded shrink-0 ${
                                    task.done
                                      ? "bg-emerald-500/15 text-emerald-400"
                                      : "bg-red-500/15 text-red-400"
                                  }`}
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
            ) : activity.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <ListTree className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm">No activity logged yet.</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {activity.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-lg bg-slate-900 ring-1 ring-slate-800 px-3 py-2.5 flex items-center gap-3"
                  >
                    <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 text-xs font-bold shrink-0">
                      {entry.user.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-slate-200 break-words">
                        <span className="font-medium text-amber-400">{entry.user}</span>{" "}
                        {entry.action}
                        {entry.detail && (
                          <span className="text-slate-400"> — {entry.detail}</span>
                        )}
                      </p>
                    </div>
                    <span className="text-xs text-slate-500 shrink-0">{formatTime(entry.timestamp)}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* Notification permission hint */}
      {("Notification" in window && Notification.permission === "default") && (
        <div className="fixed bottom-4 left-4 right-4 max-w-3xl mx-auto rounded-xl bg-slate-800 ring-1 ring-slate-700 p-3 flex items-center gap-3 shadow-xl">
          <Bell className="w-5 h-5 text-amber-400 shrink-0" />
          <p className="text-xs text-slate-300 flex-1">
            Enable notifications to get overdue alerts on your screen.
          </p>
          <Button
            size="sm"
            onClick={() => Notification.requestPermission()}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 shrink-0"
          >
            Enable
          </Button>
        </div>
      )}
    </div>
  );
}