import { useEffect, useMemo, useRef } from "react";

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
  return [
    `Can you expand on ${base}?`,
    `What are the trade-offs of ${base}?`,
    `Give a concise summary of ${base}.`
  ];
}

export default function ChatArea({
  activeSession,
  isStreaming,
  message,
  onMessageChange,
  onSend,
  onSelectFollowUp,
  activityLabels
}) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeSession?.messages, isStreaming]);

  const followUps = useMemo(() => {
    const prompt =
      activeSession?.messages.find((entry) => entry.role === "user")?.content ||
      "";
    return suggestFollowUps(prompt);
  }, [activeSession?.messages]);

  return (
    <main className="flex-1 flex flex-col">
      <div className="flex-1 overflow-y-auto px-6 py-8" ref={scrollRef}>
        <div className="mx-auto max-w-3xl space-y-6">
          {activeSession?.messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`rounded-2xl px-4 py-3 max-w-xl text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-indigo-500 text-white"
                    : "bg-slate-900/70 light:bg-white light:text-slate-900 border border-slate-800/40 light:border-slate-200"
                }`}
              >
                {msg.role === "assistant" && msg.activities?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {msg.activities.map((activity) => (
                      <span
                        key={activity}
                        className="rounded-full bg-slate-800/60 light:bg-slate-200 px-2 py-1 text-[10px] uppercase tracking-wide"
                      >
                        {activityLabels[activity]}
                      </span>
                    ))}
                  </div>
                )}
                <div>
                  {msg.content}
                  {isStreaming &&
                    msg.role === "assistant" &&
                    msg.content.length === 0 && (
                      <span className="inline-block w-2 h-4 bg-indigo-400 animate-blink ml-1 align-middle" />
                    )}
                </div>
                {msg.role === "assistant" &&
                  activeSession?.mode === "research" &&
                  msg.content && (
                    <div className="mt-4 border-t border-slate-800/50 light:border-slate-200 pt-4 space-y-3 text-xs">
                      <div>
                        <div className="font-semibold uppercase text-[10px] text-slate-400">
                          Sources
                        </div>
                        <div className="mt-2 space-y-1">
                          {extractSources(msg.content).length > 0 ? (
                            extractSources(msg.content).map((url) => (
                              <a
                                key={url}
                                href={url}
                                target="_blank"
                                rel="noreferrer"
                                className="block text-indigo-300 light:text-indigo-600 underline"
                              >
                                {url}
                              </a>
                            ))
                          ) : (
                            <div className="text-slate-400">
                              No sources provided.
                            </div>
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="font-semibold uppercase text-[10px] text-slate-400">
                          Follow-up
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {followUps.map((item) => (
                            <button
                              key={item}
                              onClick={() => onSelectFollowUp(item)}
                              className="rounded-full border border-slate-700/60 light:border-slate-300 px-3 py-1 text-[10px]"
                            >
                              {item}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-slate-800/60 light:border-slate-200 px-6 py-4">
        <div className="mx-auto max-w-3xl flex items-center gap-3">
          <textarea
            value={message}
            onChange={(event) => onMessageChange(event.target.value)}
            placeholder="Ask anything..."
            className="flex-1 resize-none rounded-2xl border border-slate-800/60 light:border-slate-200 bg-slate-900/60 light:bg-white px-4 py-3 text-sm focus:outline-none"
            rows={2}
          />
          <button
            onClick={onSend}
            disabled={!message.trim() || isStreaming}
            className="rounded-2xl bg-indigo-500 px-5 py-3 text-sm font-semibold text-white disabled:opacity-40"
          >
            Send
          </button>
        </div>
      </div>
    </main>
  );
}
