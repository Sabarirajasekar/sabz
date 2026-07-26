import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Toaster } from "@/components/ui/sonner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  HardHat,
  Plus,
  LogOut,
  Clock,
  History,
  ClipboardList,
} from "lucide-react";
import type { Task, HistoryDay, ActivityEntry } from "@/types";
import { TaskCard } from "@/components/TaskCard";
import { HistoryView } from "@/components/HistoryView";

interface Props {
  currentUser: string;
  members: string[];
  todayTasks: Task[];
  history: HistoryDay[];
  activityLog: ActivityEntry[];
  onAddTask: (title: string, assignee: string, deadline: string, createdBy: string) => void;
  onToggleTask: (id: string, user: string) => void;
  onDeleteTask: (id: string, user: string) => void;
  onLogout: () => void;
}

export function TaskBoard({
  currentUser,
  members,
  todayTasks,
  history,
  activityLog,
  onAddTask,
  onToggleTask,
  onDeleteTask,
  onLogout,
}: Props) {
  const [view, setView] = useState<"today" | "history">("today");
  const [title, setTitle] = useState("");
  const [assignee, setAssignee] = useState(members[0] || currentUser);
  const [deadline, setDeadline] = useState("17:00");
  const [showForm, setShowForm] = useState(false);

  const sortedTasks = [...todayTasks].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    return a.deadline.localeCompare(b.deadline);
  });

  const doneCount = todayTasks.filter((t) => t.done).length;
  const overdueCount = todayTasks.filter((t) => t.overdue && !t.done).length;

  const handleSubmit = () => {
    if (!title.trim()) return;
    onAddTask(title, assignee, deadline, currentUser);
    setTitle("");
    setShowForm(false);
  };

  const todayLabel = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col overflow-x-hidden">
      <Toaster theme="dark" position="top-center" />

      <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur border-b border-slate-800">
        <div className="max-w-3xl mx-auto w-full px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
                <HardHat className="w-5 h-5 text-amber-400" />
              </div>
              <div className="min-w-0">
                <h1 className="font-bold text-slate-50 leading-tight truncate">
                  Task Board
                </h1>
                <p className="text-xs text-slate-500 truncate">{todayLabel}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/60">
                <span className="w-7 h-7 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 text-xs font-semibold">
                  {currentUser.charAt(0).toUpperCase()}
                </span>
                <span className="text-sm font-medium text-slate-200 hidden sm:inline">
                  {currentUser}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onLogout}
                className="text-slate-400 hover:text-slate-100 hover:bg-slate-800 px-2.5"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline ml-1">Switch</span>
              </Button>
            </div>
          </div>

          <Tabs
            value={view}
            onValueChange={(v) => setView(v as "today" | "history")}
            className="mt-3"
          >
            <TabsList className="bg-slate-800/60 border border-slate-700/60 w-full">
              <TabsTrigger
                value="today"
                className="flex-1 data-[state=active]:bg-amber-500 data-[state=active]:text-slate-950"
              >
                <ClipboardList className="w-4 h-4 mr-1.5" />
                Today
              </TabsTrigger>
              <TabsTrigger
                value="history"
                className="flex-1 data-[state=active]:bg-amber-500 data-[state=active]:text-slate-950"
              >
                <History className="w-4 h-4 mr-1.5" />
                History
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </header>

      <main className="max-w-3xl mx-auto w-full px-4 py-6 flex-1">
        {view === "today" ? (
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-1 rounded-xl bg-slate-900/80 border border-slate-800 p-3 sm:p-4">
                <div className="text-xl sm:text-2xl font-bold text-slate-50">
                  {todayTasks.length}
                </div>
                <div className="text-xs text-slate-500 uppercase tracking-wide">
                  Total
                </div>
              </div>
              <div className="flex-1 rounded-xl bg-emerald-950/40 border border-emerald-800/40 p-3 sm:p-4">
                <div className="text-xl sm:text-2xl font-bold text-emerald-400">
                  {doneCount}
                </div>
                <div className="text-xs text-emerald-600/80 uppercase tracking-wide">
                  Done
                </div>
              </div>
              <div className="flex-1 rounded-xl bg-red-950/40 border border-red-800/40 p-3 sm:p-4">
                <div className="text-xl sm:text-2xl font-bold text-red-400">
                  {overdueCount}
                </div>
                <div className="text-xs text-red-600/80 uppercase tracking-wide">
                  Overdue
                </div>
              </div>
            </div>

            {showForm ? (
              <Card className="bg-slate-900/80 border-slate-800 shadow-lg">
                <CardContent className="p-4 space-y-3">
                  <div>
                    <Label className="text-slate-400 text-xs mb-1.5 block">
                      Task
                    </Label>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                      placeholder="What needs to get done?"
                      autoFocus
                      className="bg-slate-800/60 border-slate-700 text-slate-100 placeholder:text-slate-600"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-slate-400 text-xs mb-1.5 block">
                        Assign to
                      </Label>
                      <Select value={assignee} onValueChange={setAssignee}>
                        <SelectTrigger className="bg-slate-800/60 border-slate-700 text-slate-100">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                          {members.map((m) => (
                            <SelectItem
                              key={m}
                              value={m}
                              className="text-slate-100 focus:bg-slate-700"
                            >
                              {m}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-slate-400 text-xs mb-1.5 block">
                        Deadline
                      </Label>
                      <Input
                        type="time"
                        value={deadline}
                        onChange={(e) => setDeadline(e.target.value)}
                        className="bg-slate-800/60 border-slate-700 text-slate-100"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button
                      onClick={handleSubmit}
                      className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Task
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => setShowForm(false)}
                      className="text-slate-400 hover:bg-slate-800"
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <button
                onClick={() => setShowForm(true)}
                className="w-full bg-slate-900/80 border border-dashed border-slate-700 hover:border-amber-500/50 hover:bg-slate-900 text-slate-300 hover:text-amber-400 font-medium py-5 sm:py-6 rounded-xl transition-all flex items-center justify-center"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add a task
              </button>
            )}

            {sortedTasks.length === 0 ? (
              <div className="text-center py-12 sm:py-16">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 mb-4">
                  <ClipboardList className="w-7 h-7 text-slate-700" />
                </div>
                <p className="text-slate-500 font-medium">No tasks yet today</p>
                <p className="text-slate-600 text-sm mt-1">
                  Add one above to get started
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {sortedTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    currentUser={currentUser}
                    onToggle={onToggleTask}
                    onDelete={onDeleteTask}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <HistoryView history={history} activityLog={activityLog} />
        )}
      </main>
    </div>
  );
}