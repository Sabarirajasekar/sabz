import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HardHat, Play } from "lucide-react";
import type { Member } from "@/types";

interface Props {
  members: Member[];
  onLogin: (name: string) => void;
}

export function LoginScreen({ members, onLogin }: Props) {
  const [newName, setNewName] = useState("");

  const handleStart = (name: string) => {
    if (!name.trim()) return;
    onLogin(name.trim());
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-slate-950 text-slate-100 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/15 ring-1 ring-amber-500/30 mb-4">
            <HardHat className="w-8 h-8 text-amber-400" />
          </div>
          <h1 className="font-serif text-3xl font-bold text-white tracking-tight">
            Daily Task Board
          </h1>
          <p className="text-slate-400 text-sm mt-2">
            Shared daily tracker for your crew
          </p>
        </div>

        <div className="rounded-2xl bg-slate-900/80 ring-1 ring-slate-800 shadow-xl p-6 space-y-6">
          <div>
            <Label className="text-slate-300 text-sm font-medium mb-3 block">
              Sign in to start
            </Label>
            {members.length > 0 && (
              <div className="space-y-2 mb-4">
                {members.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => handleStart(m.name)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-800/60 ring-1 ring-slate-700 hover:bg-slate-800 hover:ring-amber-500/40 transition-all text-left"
                  >
                    <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 font-bold text-sm">
                      {m.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium text-slate-100">{m.name}</span>
                    <Play className="w-4 h-4 text-slate-500 ml-auto" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-slate-800 pt-4">
            <Label
              htmlFor="new-name"
              className="text-slate-300 text-sm font-medium mb-2 block"
            >
              Or add a new crew member
            </Label>
            <div className="flex gap-2">
              <Input
                id="new-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleStart(newName)}
                placeholder="Enter your name"
                className="bg-slate-800/60 border-slate-700 text-slate-100 placeholder:text-slate-500"
              />
              <Button
                onClick={() => handleStart(newName)}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold shrink-0"
              >
                Start
              </Button>
            </div>
          </div>
        </div>

        <p className="text-center text-slate-500 text-xs mt-6">
          All data is saved on this device and persists across sessions.
        </p>
      </div>
    </div>
  );
}