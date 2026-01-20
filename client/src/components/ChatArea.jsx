import React, { useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  SendHorizontal,
  Sparkles,
  Globe,
  ArrowRight,
  Menu,
  Copy,
  ThumbsUp,
  ThumbsDown,
  RefreshCw
} from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

function extractSources(text) {
  const urls = Array.from(
    new Set(
      (text.match(/https?:\/\/[^\s)]+/g) || []).map((item) =>
        item.replace(/[.,)\]]$/, "")
      )
    )
  );
  return urls;
}

function suggestFollowUps(prompt) {
  if (!prompt) return [];
  const base = prompt.split("?")[0].trim();
  // Simple heuristic for demo purposes
  return [
    `Tell me more about ${base.split(' ').slice(-3).join(' ')}`,
    `What are the alternatives?`,
    `Explain it like I'm 5`
  ];
}

export default function ChatArea({
  activeSession,
  isStreaming,
  message,
  onMessageChange,
  onSend,
  onSelectFollowUp,
  activityLabels,
  toggleSidebar,
  sidebarOpen
}) {
  const scrollRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeSession?.messages, isStreaming]);

  const followUps = useMemo(() => {
    const lastUserMsg = activeSession?.messages
      .filter((entry) => entry.role === "user")
      .pop();

    return suggestFollowUps(lastUserMsg?.content || "");
  }, [activeSession?.messages]);

  const isEmpty = !activeSession?.messages || activeSession.messages.length === 0;

  return (
    <div className="flex-1 flex flex-col h-full relative">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center p-4 border-b border-white/5 bg-slate-900/50 backdrop-blur-md sticky top-0 z-10">
        <button onClick={toggleSidebar} className="p-2 -ml-2 text-slate-400 hover:text-white">
          <Menu size={20} />
        </button>
        <span className="font-semibold text-sm ml-2">Perplexity Clone</span>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar scroll-smooth" ref={scrollRef}>
        {isEmpty ? (
          /* Empty State / Hero Section */
          <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 animate-in fade-in zoom-in duration-500">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center mb-6 shadow-xl shadow-cyan-500/20">
              <Sparkles className="text-white w-8 h-8" />
            </div>
            <h1 className="text-3xl md:text-4xl font-display font-medium text-center mb-12 text-slate-200">
              Where knowledge begins
            </h1>

            {/* Fake search bar for hero aesthetic - functionality is in the footer input though */}
            <div className="w-full max-w-2xl transform transition-all hover:scale-[1.01]">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl opacity-20 blur-lg group-hover:opacity-30 transition-opacity" />
                <div className="relative bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex items-center gap-4 shadow-2xl">
                  <SearchInput
                    value={message}
                    onChange={onMessageChange}
                    onSend={onSend}
                    disabled={isStreaming}
                    isHero={true}
                  />
                </div>
              </div>

              <div className="mt-8 flex flex-wrap justify-center gap-2">
                {["Latest AI News", "Python vs Rust", "Explain Quantum Computing", "History of Rome"].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => {
                      onMessageChange(suggestion);
                      setTimeout(() => onSend(), 100);
                    }}
                    className="px-4 py-2 rounded-full border border-white/5 bg-white/5 text-sm text-slate-400 hover:bg-white/10 hover:text-cyan-400 hover:border-cyan-500/30 transition-all font-medium"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Chat Messages */
          <div className="mx-auto max-w-3xl w-full px-4 md:px-0 py-8 space-y-8">
            {activeSession?.messages.map((msg, index) => (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                key={msg.id || index}
                className={cn(
                  "flex gap-4",
                  msg.role === "user" ? "flex-row-reverse" : "flex-row"
                )}
              >
                {/* Avatar */}
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center shrink-0 border",
                  msg.role === "user"
                    ? "bg-slate-800 border-slate-700 text-slate-300"
                    : "bg-cyan-950/30 border-cyan-500/20 text-cyan-400"
                )}>
                  {msg.role === "user" ? <div className="text-xs font-bold">You</div> : <Sparkles size={16} />}
                </div>

                {/* Message Content */}
                <div className={cn(
                  "flex flex-col gap-2 max-w-[85%]",
                  msg.role === "user" ? "items-end" : "items-start"
                )}>
                  <div className="font-medium text-sm text-slate-400 mb-1">
                    {msg.role === "user" ? "You" : "Perplexity"}
                  </div>

                  <div className={cn(
                    "text-base leading-relaxed text-slate-200",
                    msg.role === "user" && "text-right"
                  )}>
                    {msg.content}
                    {isStreaming && msg.role === "assistant" && index === activeSession.messages.length - 1 && (
                      <span className="inline-block w-2 h-4 bg-cyan-400 animate-pulse ml-1 align-bottom rounded-sm" />
                    )}
                  </div>

                  {/* Assistant Extras: Sources, Related */}
                  {msg.role === "assistant" && msg.content && !isStreaming && (
                    <div className="mt-4 space-y-4 w-full">
                      {/* Sources */}
                      {extractSources(msg.content).length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {extractSources(msg.content).slice(0, 4).map((url, i) => (
                            <a
                              key={i}
                              href={url}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-2 p-2 rounded-lg bg-slate-900/50 border border-white/5 hover:bg-slate-800 transition-colors group"
                            >
                              <div className="w-5 h-5 rounded bg-slate-800 flex items-center justify-center text-slate-500 group-hover:text-cyan-400">
                                <Globe size={12} />
                              </div>
                              <span className="text-xs text-slate-400 truncate flex-1">{new URL(url).hostname}</span>
                            </a>
                          ))}
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 pt-2">
                        <ActionBtn icon={<Copy size={14} />} label="Copy" />
                        <ActionBtn icon={<RefreshCw size={14} />} label="Regenerate" onClick={() => onSend()} />
                        <div className="flex-1" />
                        <ActionBtn icon={<ThumbsUp size={14} />} />
                        <ActionBtn icon={<ThumbsDown size={14} />} />
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}

            {/* Follow-ups */}
            {!isStreaming && followUps.length > 0 && (
              <div className="pl-12 space-y-3 animate-in fade-in duration-500">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-400">
                  <Sparkles size={14} className="text-cyan-500" />
                  <span>Related</span>
                </div>
                <div className="flex flex-col gap-2">
                  {followUps.map((item, i) => (
                    <button
                      key={i}
                      onClick={() => onSelectFollowUp(item)}
                      className="text-left flex items-center justify-between p-3 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 hover:border-cyan-500/30 transition-all group w-fit min-w-[300px]"
                    >
                      <span className="text-sm text-slate-300 group-hover:text-cyan-100">{item}</span>
                      <ArrowRight size={14} className="text-slate-500 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} className="h-4" />
          </div>
        )}
      </div>

      {/* Footer Input Area */}
      {!isEmpty && (
        <div className="p-4 md:p-6 bg-gradient-to-t from-background via-background to-transparent z-20">
          <div className="mx-auto max-w-3xl relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-2xl blur opacity-75 animate-pulse" />
            <div className="relative bg-slate-900 border border-white/10 rounded-2xl p-2 shadow-2xl flex items-center gap-2">
              <SearchInput
                value={message}
                onChange={onMessageChange}
                onSend={onSend}
                disabled={isStreaming}
              />
            </div>
            <p className="text-center text-xs text-slate-600 mt-3">
              Powered by Perplexity Clone. AI can make mistakes.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function SearchInput({ value, onChange, onSend, disabled, isHero = false }) {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !disabled) {
        onSend();
      }
    }
  };

  return (
    <>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={isHero ? "Ask anything..." : "Ask follow-up..."}
        className={cn(
          "flex-1 bg-transparent border-none focus:ring-0 text-slate-200 placeholder:text-slate-500 resize-none py-3 px-3 custom-scrollbar",
          isHero ? "text-lg md:text-xl font-medium" : "text-sm md:text-base"
        )}
        rows={isHero ? 1 : 1}
        style={{ minHeight: isHero ? '52px' : '44px' }}
      />
      <div className="flex items-center gap-2 pr-2">
        <button
          onClick={onSend}
          disabled={!value.trim() || disabled}
          className={cn(
            "p-2 rounded-xl transition-all duration-200 flex items-center justify-center",
            value.trim() && !disabled
              ? "bg-cyan-500 text-white shadow-lg shadow-cyan-500/30 hover:bg-cyan-400"
              : "bg-slate-800 text-slate-600 cursor-not-allowed"
          )}
        >
          {disabled ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <ArrowRight size={20} />
          )}
        </button>
      </div>
    </>
  );
}

function ActionBtn({ icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium text-slate-500 hover:text-slate-200 hover:bg-white/5 transition-colors"
    >
      {icon}
      {label && <span>{label}</span>}
    </button>
  )
}
