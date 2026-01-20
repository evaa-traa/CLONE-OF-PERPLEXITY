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
      <div className="md:hidden flex items-center p-4 border-b border-border bg-background/70 backdrop-blur-md sticky top-0 z-10">
        <button
          onClick={toggleSidebar}
          className="p-2 -ml-2 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 rounded-lg"
          aria-label="Open sidebar"
        >
          <Menu size={20} />
        </button>
        <span className="font-semibold text-sm ml-2 text-foreground">
          Flowise Chat
        </span>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar scroll-smooth" ref={scrollRef}>
        {isEmpty ? (
          /* Empty State / Hero Section */
          <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 animate-in fade-in zoom-in duration-500">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center mb-6 shadow-xl shadow-cyan-500/20">
              <Sparkles className="text-white w-8 h-8" />
            </div>
            <h1 className="text-3xl md:text-4xl font-display font-medium text-center mb-12 text-foreground">
              Where knowledge begins
            </h1>

            {/* Fake search bar for hero aesthetic - functionality is in the footer input though */}
            <div className="w-full max-w-2xl transform transition-all hover:scale-[1.01]">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl opacity-20 blur-lg group-hover:opacity-30 transition-opacity" />
                <div className="relative bg-background/75 backdrop-blur-xl border border-border rounded-2xl p-4 flex items-center gap-4 shadow-2xl">
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
                    className="px-4 py-2 rounded-full border border-border bg-foreground/5 text-sm text-muted-foreground hover:bg-foreground/8 hover:text-cyan-600 hover:border-cyan-500/30 transition-all font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
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
            {activeSession?.messages.map((msg, index) => {
              const sources = msg.content ? extractSources(msg.content) : [];
              const lastUserBefore = [...(activeSession?.messages || [])]
                .slice(0, index)
                .reverse()
                .find((entry) => entry.role === "user");
              return (
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
                    ? "bg-foreground/5 border-border text-foreground"
                    : "bg-cyan-500/10 border-cyan-500/20 text-cyan-600"
                )}>
                  {msg.role === "user" ? <div className="text-xs font-bold">You</div> : <Sparkles size={16} />}
                </div>

                {/* Message Content */}
                <div className={cn(
                  "flex flex-col gap-2 max-w-[85%]",
                  msg.role === "user" ? "items-end" : "items-start"
                )}>
                  <div className="font-medium text-sm text-muted-foreground mb-1">
                    {msg.role === "user" ? "You" : "Assistant"}
                  </div>

                  <div className={cn(
                    "text-base leading-relaxed text-foreground",
                    msg.role === "user" && "text-right"
                  )}>
                    {msg.content}
                    {isStreaming && msg.role === "assistant" && index === activeSession.messages.length - 1 && (
                      <span className="inline-block w-2 h-4 bg-cyan-400 animate-pulse ml-1 align-bottom rounded-sm" />
                    )}
                  </div>

                  {msg.role === "assistant" && Array.isArray(msg.activities) && msg.activities.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {msg.activities.slice(-4).map((state) => (
                        <span
                          key={state}
                          className="inline-flex items-center rounded-full border border-border bg-foreground/5 px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
                        >
                          {activityLabels?.[state] || state}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Assistant Extras: Sources, Related */}
                  {msg.role === "assistant" && msg.content && !isStreaming && (
                    <div className="mt-4 space-y-4 w-full">
                      {/* Sources */}
                      {sources.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {sources.slice(0, 4).map((url, i) => (
                            <a
                              key={i}
                              href={url}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-2 p-2 rounded-lg bg-foreground/5 border border-border hover:bg-foreground/8 transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                            >
                              <div className="w-5 h-5 rounded bg-foreground/5 flex items-center justify-center text-muted-foreground group-hover:text-cyan-600">
                                <Globe size={12} />
                              </div>
                              <span className="text-xs text-muted-foreground truncate flex-1">{new URL(url).hostname}</span>
                            </a>
                          ))}
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 pt-2">
                        <ActionBtn
                          icon={<Copy size={14} />}
                          label="Copy"
                          onClick={() => navigator.clipboard?.writeText(msg.content || "")}
                        />
                        <ActionBtn
                          icon={<RefreshCw size={14} />}
                          label="Regenerate"
                          onClick={() => {
                            const prompt = lastUserBefore?.content || "";
                            if (!prompt) return;
                            onMessageChange(prompt);
                            setTimeout(() => onSend(), 50);
                          }}
                        />
                        <div className="flex-1" />
                        <ActionBtn icon={<ThumbsUp size={14} />} label="Like" />
                        <ActionBtn icon={<ThumbsDown size={14} />} label="Dislike" />
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )})}

            {/* Follow-ups */}
            {!isStreaming && followUps.length > 0 && (
              <div className="pl-12 space-y-3 animate-in fade-in duration-500">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Sparkles size={14} className="text-cyan-600" />
                  <span>Related</span>
                </div>
                <div className="flex flex-col gap-2">
                  {followUps.map((item, i) => (
                    <button
                      key={i}
                      onClick={() => onSelectFollowUp(item)}
                      className="text-left flex items-center justify-between p-3 rounded-lg border border-border bg-foreground/5 hover:bg-foreground/8 hover:border-cyan-500/30 transition-all group w-fit min-w-[300px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                    >
                      <span className="text-sm text-foreground/90 group-hover:text-foreground">{item}</span>
                      <ArrowRight size={14} className="text-muted-foreground opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
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
            <div className="relative bg-background/80 border border-border rounded-2xl p-2 shadow-2xl flex items-center gap-2">
              <SearchInput
                value={message}
                onChange={onMessageChange}
                onSend={onSend}
                disabled={isStreaming}
              />
            </div>
            <p className="text-center text-xs text-muted-foreground/70 mt-3">
              Powered by Flowise. AI can make mistakes.
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
        aria-label={isHero ? "Ask anything" : "Message"}
        className={cn(
          "flex-1 bg-transparent border-none focus:ring-0 text-foreground placeholder:text-muted-foreground resize-none py-3 px-3 custom-scrollbar",
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
            "p-2 rounded-xl transition-all duration-200 flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
            value.trim() && !disabled
              ? "bg-cyan-500 text-white shadow-lg shadow-cyan-500/30 hover:bg-cyan-400"
              : "bg-foreground/5 text-muted-foreground cursor-not-allowed"
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
      className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      aria-label={label}
    >
      {icon}
      {label && <span>{label}</span>}
    </button>
  )
}
