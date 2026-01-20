import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  Plus,
  Trash2,
  Moon,
  Sun,
  Bot,
  History
} from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default function ChatSidebar({
  open,
  models,
  selectedModelId,
  onSelectModel,
  mode,
  modes,
  onModeChange,
  onNewChat,
  onClearHistory,
  historyList,
  activeSessionId,
  onSelectSession,
  theme,
  onToggleTheme,
}) {
  return (
    <AnimatePresence mode="wait">
      {open && (
        <motion.aside
          initial={{ x: -300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -300, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="fixed left-0 top-0 bottom-0 z-50 w-[280px] border-r border-white/10 bg-slate-900/80 backdrop-blur-xl flex flex-col p-4 shadow-2xl"
        >
          {/* Header & Logo */}
          <div className="flex items-center justify-between mb-6 px-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-500 flex items-center justify-center text-white font-bold shadow-lg shadow-cyan-500/20">
                <Bot size={20} />
              </div>
              <h1 className="text-xl font-display font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                Perplexity
              </h1>
            </div>
          </div>

          {/* New Chat Button */}
          <button
            onClick={onNewChat}
            className="group flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all mb-6 text-sm font-medium hover:shadow-lg hover:shadow-cyan-500/10 active:scale-95"
          >
            <div className="bg-cyan-500/20 p-1.5 rounded-lg text-cyan-400 group-hover:text-white group-hover:bg-cyan-500 transition-colors">
              <Plus size={18} />
            </div>
            <span>New Thread</span>
            <div className="ml-auto text-xs text-slate-500 border border-slate-700 rounded px-1.5 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              Ctrl+N
            </div>
          </button>

          {/* Modes */}
          <div className="space-y-4 mb-6">
            <div className="px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
              <span>Mode</span>
            </div>
            <div className="grid grid-cols-2 gap-2 p-1 bg-black/20 rounded-lg border border-white/5">
              {Object.entries(modes).map(([key, value]) => (
                <button
                  key={key}
                  onClick={() => onModeChange(value)}
                  className={cn(
                    "flex items-center justify-center px-3 py-2 rounded-md text-xs font-medium transition-all",
                    mode === value
                      ? "bg-white/10 text-white shadow-sm"
                      : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                  )}
                >
                  {key === "COPILOT" ? "Copilot" : "Fast"}
                </button>
              ))}
            </div>
          </div>

          {/* Models Selection */}
          {models && models.length > 0 && (
            <div className="mb-6 space-y-2">
              <label className="px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Model
              </label>
              <div className="relative">
                <select
                  className="w-full appearance-none bg-black/20 text-slate-200 text-sm rounded-lg pl-3 pr-8 py-2.5 border border-white/5 focus:ring-1 focus:ring-cyan-500/50 outline-none transition-all hover:bg-white/5"
                  value={selectedModelId}
                  onChange={(e) => onSelectModel(e.target.value)}
                >
                  {models.map((m) => (
                    <option key={m.id} value={m.name} className="bg-slate-900">
                      {m.label}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                  <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
            </div>
          )}

          {/* History List */}
          <div className="flex-1 overflow-y-auto -mx-2 px-2 custom-scrollbar">
            <div className="mb-2 px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <History size={12} />
              Recent
            </div>
            <div className="space-y-1">
              {historyList.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-slate-600 gap-2">
                  <MessageSquare size={24} className="opacity-20" />
                  <span className="text-xs">No history yet</span>
                </div>
              ) : (
                historyList.map((session) => (
                  <button
                    key={session.id}
                    onClick={() => onSelectSession(session.id)}
                    className={cn(
                      "w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all group flex items-center gap-3 relative overflow-hidden",
                      activeSessionId === session.id
                        ? "bg-white/10 text-white shadow-sm border border-white/5"
                        : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                    )}
                  >
                    <MessageSquare size={16} className={cn(
                      "shrink-0 transition-colors",
                      activeSessionId === session.id ? "text-cyan-400" : "text-slate-600 group-hover:text-slate-500"
                    )} />
                    <span className="truncate flex-1 z-10 relative">{session.title || "New Thread"}</span>
                    {activeSessionId === session.id && (
                      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-transparent pointer-events-none" />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 mt-4 border-t border-white/10 space-y-2">
            <button
              onClick={onClearHistory}
              className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all group"
            >
              <Trash2 size={16} className="group-hover:animate-bounce" />
              <span>Clear History</span>
            </button>
            <button
              onClick={onToggleTheme}
              className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-slate-400 hover:bg-white/5 hover:text-slate-200 transition-all"
            >
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
              <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
            </button>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
